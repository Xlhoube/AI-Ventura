import React, { useEffect, Suspense, lazy, useRef, useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { BookOpen, Loader2, LogOut, Sun, Moon, UserCircle } from 'lucide-react';
import { Language, translations } from './utils/constants';
import { account, updateProfileLanguage, getProfileLanguage, generateUUID, isCloudEnabled } from './services/services';
import { ensureProfileExists, handleAuthSubmit } from './services/auth.services';
import { saveLocalStory, archiveLocalStory } from './services/story.services';
import { polishManuscript, generateStoryTitle } from './services/ai';
import { Toast, ToastType, TitleSelectionModal, ApiSetupModal } from '@/components';
import { useAppStore } from './store/useAppStore';
import { useStoryStore } from './store/useStoryStore';

// --- STORES ---
// We import directly from the stores
// --- VIEWS (Lazy loaded) ---
const LandingView = lazy(() => import('./views').then(m => ({ default: m.LandingView })));
const DashboardView = lazy(() => import('./views').then(m => ({ default: m.DashboardView })));
const DraftsView = lazy(() => import('./views').then(m => ({ default: m.DraftsView })));
const PrivateLibraryView = lazy(() => import('./views').then(m => ({ default: m.PrivateLibraryView })));
const ArchiveView = lazy(() => import('./views').then(m => ({ default: m.ArchiveView })));
const PublicLibraryView = lazy(() => import('./views').then(m => ({ default: m.PublicLibraryView })));
const AuthorsClubView = lazy(() => import('./views').then(m => ({ default: m.AuthorsClubView })));
const BookPreview = lazy(() => import('./views').then(m => ({ default: m.BookPreview })));
const StorySetup = lazy(() => import('./views').then(m => ({ default: m.StorySetup })));
const StoryEngine = lazy(() => import('./views').then(m => ({ default: m.StoryEngine })));
const LobbyView = lazy(() => import('./views').then(m => ({ default: m.LobbyView })));

export const AppRoutes = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, setCurrentUser, userLang, setUserLang, theme, toggleTheme } = useAppStore();
    const { sessionCode, setSessionCode, resetStory } = useStoryStore();

    const [currentStory, setCurrentStory] = useState<any>(null);
    const [selectedAuthorId, setSelectedAuthorId] = useState<string | undefined>();
    const [isPolishing, setIsPolishing] = useState(false);
    const [toast, setToast] = useState<{ message: string, type: ToastType } | null>(null);
    const [showTitleModal, setShowTitleModal] = useState(false);
    const [pendingManuscript, setPendingManuscript] = useState<any>(null);
    const [pendingMessages, setPendingMessages] = useState<any[]>([]);
    const [isLoadingSession, setIsLoadingSession] = useState(true);
    const [showApiSetup, setShowApiSetup] = useState(false);

    const { apiKeys, activeProvider } = useAppStore();

    const authInitialized = useRef(false);
    const t = translations[userLang] || translations['en'];

    // Sync theme
    useEffect(() => {
        const root = window.document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    const handleLanguageChange = async (newLang: Language) => {
        setUserLang(newLang);
        if (currentUser && currentUser.id !== 'guest') {
            await updateProfileLanguage(currentUser.id, newLang);
        }
    };

    useEffect(() => {
        if (!isCloudEnabled) {
            setIsLoadingSession(false);
            return;
        }

        const initializeUser = async () => {
            try {
                const sessionUser = await account.get();
                setCurrentUser(sessionUser as any);
                
                if (!authInitialized.current) {
                    const params = new URLSearchParams(window.location.search);
                    const paramSessionCode = params.get('session');

                    if (paramSessionCode) {
                        setSessionCode(paramSessionCode);
                        navigate('/lobby');
                    } else if (location.pathname === '/' || location.pathname === '/landing') {
                        navigate('/dashboard');
                    }
                    authInitialized.current = true;
                }

                await ensureProfileExists(sessionUser);

                const profileLang = await getProfileLanguage(sessionUser.$id);
                if (profileLang && ['pt', 'en', 'fr'].includes(profileLang)) {
                    setUserLang(profileLang as Language);
                } else {
                    await updateProfileLanguage(sessionUser.$id, userLang);
                }
            } catch (err) {
                // Not logged in
                setCurrentUser(null);
            } finally {
                setIsLoadingSession(false);
            }
        };

        initializeUser();
    }, []);

    // Check if user has API key, if not, show modal
    useEffect(() => {
        if (!isLoadingSession && currentUser && !apiKeys[activeProvider] && currentUser.id !== 'guest') {
            setShowApiSetup(true);
        }
    }, [isLoadingSession, currentUser, apiKeys, activeProvider]);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
    };

    const handleAuth = async (e: React.FormEvent, mode: 'login' | 'signup') => {
        try {
            const res = await handleAuthSubmit(e, mode);
            if (res.mode === 'signup') showToast(t.signupSuccess, 'success');
            else showToast(t.loginSuccess, 'success');
        } catch (err: any) {
            console.error(err);
            showToast(err.message || t.authError, 'error');
        }
    };

    const handleGuestLogin = () => {
        setCurrentUser({ id: 'guest', user_metadata: { username: 'Guest' }, email: 'guest@iaventura.com', app_metadata: {}, aud: 'authenticated', created_at: new Date().toISOString() } as any);
        authInitialized.current = true;
        navigate('/dashboard');
        showToast(t.loginSuccess, 'success');
    };

    const handleLogout = async () => {
        if (currentUser?.id === 'guest') {
            setCurrentUser(null);
            authInitialized.current = false;
            navigate('/');
            return;
        }
        try {
            if (isCloudEnabled) {
                await account.deleteSession('current');
            }
        } catch (error) {
            console.error("Erro no logout:", error);
        } finally {
            setCurrentUser(null);
            authInitialized.current = false;
            navigate('/');
        }
    };

    const handleFinalizeBook = async (msgs: any[]) => {
        if (!currentStory) return;
        setIsPolishing(true);
        try {
            const manuscriptResult = await polishManuscript(msgs, userLang, currentStory.title);
            setPendingManuscript(manuscriptResult);
            setPendingMessages(msgs);
            setShowTitleModal(true);
        } catch (error) {
            // ... fallback handling if polish fails (uses same messages and marks as completed)
            const fallbackStory = { ...currentStory, messages: msgs, status: 'completed', updated_at: new Date().toISOString() };
            saveLocalStory(fallbackStory);
            setCurrentStory(fallbackStory);
            navigate('/preview');
            showToast(t.publishError, 'error');
        } finally {
            setIsPolishing(false);
        }
    };

    const confirmTitleSelection = (selectedTitle: string) => {
        if (!pendingManuscript || !currentStory) return;

        const finalManuscript = { ...pendingManuscript, title: selectedTitle };
        const updatedStory = {
            ...currentStory,
            title: selectedTitle,
            messages: pendingMessages,
            manuscript: finalManuscript,
            status: 'completed',
            updated_at: new Date().toISOString()
        };

        saveLocalStory(updatedStory);
        setCurrentStory(updatedStory);
        setShowTitleModal(false);
        setPendingManuscript(null);
        setPendingMessages([]);
        navigate('/preview');
        showToast(t.publishedSuccess, 'success');
    };

    const handleAutoSave = (msgs: any[], status?: string, newSessionCode?: string) => {
        setCurrentStory((prev: any) => {
            if (!prev) return prev;
            const updated = {
                ...prev,
                messages: msgs,
                status: status || prev.status,
                sessionCode: newSessionCode || prev.sessionCode
            };
            saveLocalStory(updated);
            return updated;
        });
    };

    const getUserDisplayName = (u: any) => {
        if (!u) return 'Autor';
        const meta = u.user_metadata || {};
        return meta.username || meta.full_name || meta.name || u.email?.split('@')[0] || 'Autor';
    };

    const getUserAvatar = (u: any) => {
        if (!u) return null;
        const meta = u.user_metadata || {};
        return meta.avatar_url || meta.picture || null;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0c] text-slate-800 dark:text-slate-400 selection:bg-indigo-500/30 transition-colors duration-300">
            {/* HEADER ATUALIZADO V0.0.47 - CENTRALIZAÇÃO TOTAL */}
            <header className="border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-black/60 backdrop-blur-xl sticky top-0 z-50 px-8 h-20 flex items-center justify-between relative print:hidden transition-colors duration-300">
                <div className="flex items-center gap-2 cursor-pointer group" onClick={() => navigate(currentUser ? '/dashboard' : '/')}>
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 group-hover:rotate-6 transition-transform">
                        <BookOpen size={24} />
                    </div>
                    <span className="font-black text-xl tracking-tighter bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                        IA-VENTURA
                    </span>
                </div>

                <div className="flex items-center gap-4">
                    <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-all">
                        {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <select
                        value={userLang}
                        onChange={(e) => handleLanguageChange(e.target.value as Language)}
                        className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg px-2 py-1 text-[9px] font-black text-gray-700 dark:text-white outline-none cursor-pointer"
                    >
                        <option value="pt" className="dark:bg-[#121214]">PT</option>
                        <option value="en" className="dark:bg-[#121214]">EN</option>
                        <option value="fr" className="dark:bg-[#121214]">FR</option>
                    </select>
                    {currentUser && (
                        <div className="flex items-center gap-3 pl-2 border-l border-gray-200 dark:border-white/10">
                            <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 dark:border-white/10">
                                {getUserAvatar(currentUser) ? (
                                    <img src={getUserAvatar(currentUser)} alt="User" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                        <UserCircle size={20} />
                                    </div>
                                )}
                            </div>
                            <button onClick={handleLogout} className="text-slate-500 dark:text-slate-600 hover:text-rose-500 p-1.5 transition-colors" title={t.logout}>
                                <LogOut size={20} />
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                {isPolishing && (
                    <div className="fixed inset-0 z-[150] bg-white/95 dark:bg-black/95 flex flex-col items-center justify-center text-center p-12 transition-colors duration-300">
                        <Loader2 className="animate-spin text-indigo-500 mb-8" size={48} />
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 italic leading-tight">{t.polishingTitle}</h2>
                        <p className="text-slate-500 max-w-md font-medium">{t.polishingDesc}</p>
                    </div>
                )}

                {isLoadingSession ? (
                    <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-75 min-h-[50vh]">
                        <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">A verificar credenciais...</p>
                    </div>
                ) : (
                    <Suspense fallback={<div className="py-20 flex flex-col items-center gap-4 opacity-50"><Loader2 className="animate-spin text-indigo-500" size={32} /><p className="text-[10px] font-black uppercase tracking-[0.2em]">Loading Studio...</p></div>}>
                        <Routes>
                            <Route path="/" element={<LandingView t={t} onAuth={handleAuth} onGuestLogin={handleGuestLogin} />} />
                            {currentUser && (
                                <>
                                    <Route path="/dashboard" element={
                                        <DashboardView
                                            t={t}
                                            username={getUserDisplayName(currentUser)}
                                            isGuest={currentUser?.id === 'guest'}
                                            activeSessionCode={sessionCode}
                                            onNavigate={(nav: any) => {
                                                if (typeof nav === 'string') {
                                                    const routeMap: Record<string, string> = {
                                                        'setup': '/setup',
                                                        'drafts': '/drafts',
                                                        'library_private': '/library',
                                                        'public': '/explore',
                                                        'authors': '/authors',
                                                        'archive': '/archive'
                                                    };
                                                    navigate(routeMap[nav] || '/dashboard');
                                                } else if (typeof nav === 'object') {
                                                    // Corrigido: Agora permite limpar a sessão se nav.sessionCode for null
                                                    if ('sessionCode' in nav) setSessionCode(nav.sessionCode);
                                                    if (nav.initialStory) setCurrentStory(nav.initialStory);

                                                    if (nav.view === 'lobby') navigate('/lobby');
                                                    else if (nav.view === 'setup') navigate('/setup');
                                                    else if (nav.view === 'story') navigate('/story');
                                                    else navigate('/dashboard');
                                                }
                                            }}
                                            lang={userLang}
                                            onShowToast={showToast}
                                        />
                                    } />
                                    <Route path="/drafts" element={<DraftsView t={t} onResume={(s: any) => { setCurrentStory(s); if (s.status === 'completed') navigate('/preview'); else navigate('/story'); }} onArchive={archiveLocalStory} onBack={() => navigate('/dashboard')} />} />
                                    <Route path="/library" element={<PrivateLibraryView t={t} onRead={(s: any) => { setCurrentStory(s); navigate('/preview'); }} onArchive={archiveLocalStory} onBack={() => navigate('/dashboard')} />} />
                                    <Route path="/archive" element={<ArchiveView t={t} onBack={() => navigate('/dashboard')} />} />
                                    <Route path="/explore" element={<PublicLibraryView t={t} onRead={(s: any) => { setCurrentStory(s); navigate('/preview'); }} onBack={() => navigate('/dashboard')} />} />
                                    <Route path="/author/:id" element={<PublicLibraryView t={t} authorId={selectedAuthorId} onRead={(s: any) => { setCurrentStory(s); navigate('/preview'); }} onBack={() => navigate('/authors')} />} />
                                    <Route path="/authors" element={<AuthorsClubView t={t} onViewAuthor={(id: any) => { setSelectedAuthorId(id); navigate(`/author/${id}`); }} onBack={() => navigate('/dashboard')} />} />

                                    <Route path="/lobby" element={
                                        <LobbyView
                                            t={t}
                                            user={currentUser}
                                            sessionCode={sessionCode}
                                            onBack={() => navigate('/dashboard')}
                                            onStartSetup={() => navigate('/setup')}
                                            onSessionCodeChange={setSessionCode}
                                        />
                                    } />

                                    <Route path="/setup" element={
                                        <StorySetup
                                            t={t}
                                            lang={userLang}
                                            sessionCode={sessionCode}
                                            user={currentUser}
                                            onBack={() => navigate('/dashboard')}
                                            onShowToast={showToast}
                                            onComplete={async (config: any) => {
                                                const displayName = getUserDisplayName(currentUser);
                                                const title = await generateStoryTitle(config, userLang);
                                                const newStory = {
                                                    id: generateUUID(),
                                                    title,
                                                    messages: [],
                                                    config,
                                                    author_name: displayName,
                                                    updated_at: new Date().toISOString(),
                                                    status: 'draft',
                                                    sessionCode: sessionCode
                                                };
                                                saveLocalStory(newStory);
                                                setCurrentStory(newStory);
                                                navigate('/story');
                                            }}
                                        />
                                    } />

                                    {currentStory && (
                                        <>
                                            <Route path="/story" element={
                                                <StoryEngine
                                                    t={t}
                                                    lang={userLang}
                                                    user={currentUser}
                                                    initialConfig={currentStory}
                                                    sessionCode={sessionCode}
                                                    onExit={() => navigate('/dashboard')}
                                                    onAutoSave={handleAutoSave}
                                                    onFinalizeBook={handleFinalizeBook}
                                                    onSessionStart={(code: any) => setSessionCode(code)}
                                                    onShowToast={showToast}
                                                />
                                            } />

                                            <Route path="/preview" element={
                                                <BookPreview
                                                    t={t}
                                                    story={currentStory}
                                                    onBack={() => navigate('/dashboard')}
                                                    onReopen={(s: any) => {
                                                        const reopenedStory = { ...s, status: 'draft' };
                                                        saveLocalStory(reopenedStory);
                                                        setCurrentStory(reopenedStory);
                                                        navigate('/story');
                                                        showToast(t.reopenWarn, 'info');
                                                    }}
                                                    userLang={userLang}
                                                />
                                            } />
                                        </>
                                    )}
                                </>
                            )}
                            <Route path="*" element={<Navigate to={currentUser ? '/dashboard' : '/'} replace />} />
                        </Routes>
                    </Suspense>
                )}
            </main>

            <TitleSelectionModal
                t={t}
                isOpen={showTitleModal}
                onClose={() => setShowTitleModal(false)}
                onConfirm={confirmTitleSelection}
                suggestedTitles={pendingManuscript?.titleOptions || []}
            />

            <ApiSetupModal 
                t={t}
                isOpen={showApiSetup} 
                onClose={() => setShowApiSetup(false)} 
                forceSetup={!apiKeys[activeProvider]}
            />

            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
        </div>
    );
};
