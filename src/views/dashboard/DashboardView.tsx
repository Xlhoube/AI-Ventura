import React, { useState, useEffect } from 'react';
import {
   PlusCircle, FileText, Library, Globe, Users2, History, Wifi, Loader2,
   X, Sparkles, HelpCircle, UserCircle, Trash2, Trophy, Book, User, Archive, BarChart2, Key, AlertTriangle
} from 'lucide-react';
import { ChangelogModal, CoopInfoModal, JoinInviteModal, AuthorRankingModal, TutorialModal, InteractiveTour, ApiSetupModal } from '@/components';
import { account, joinCollaborationSession, createLobbySession } from '@/services/services';
import { APP_VERSION, Language } from '@/utils/constants';

export const DashboardView = ({ t, username, onNavigate, lang, activeSessionCode, onShowToast, isGuest }: { t: any, username: string, onNavigate: (v: any) => void, lang: Language, activeSessionCode?: string | null, onShowToast: (msg: string, type: 'success' | 'error' | 'info') => void, isGuest?: boolean }) => {
   const [joinCode, setJoinCode] = useState('');
   const [isJoining, setIsJoining] = useState(false);
   const [errorJoin, setErrorJoin] = useState<string | null>(null);

   // MODAL STATES
   const [showChangelog, setShowChangelog] = useState(false);
   const [showRanking, setShowRanking] = useState(false);
   const [showTutorial, setShowTutorial] = useState(false);
   const [showTour, setShowTour] = useState(false);
   const [showCoopInfo, setShowCoopInfo] = useState(false);
   const [showModeSelect, setShowModeSelect] = useState(false);
   const [hasNewUpdate, setHasNewUpdate] = useState(false);
   const [isCreatingLobby, setIsCreatingLobby] = useState(false);

   const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
   const [incomingSessionCode, setIncomingSessionCode] = useState<string | null>(null);
   const [showApiKeyModal, setShowApiKeyModal] = useState(false);

   useEffect(() => {
      const seenVersion = localStorage.getItem('ia_ventura_version');
      if (seenVersion !== APP_VERSION) {
         setHasNewUpdate(true);
      }
      
      const seenApiSetup = localStorage.getItem('hasSeenApiSetup');
      if (!seenApiSetup) {
         setShowApiKeyModal(true);
         localStorage.setItem('hasSeenApiSetup', 'true');
      }
   }, []);

   useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const sessionParam = params.get('session');
      if (sessionParam) {
         const code = sessionParam.toUpperCase();
         setJoinCode(code);
         setIncomingSessionCode(code);
         handleJoin(code);
      }
   }, []);

   const handleOpenChangelog = () => {
      setShowChangelog(true);
      setHasNewUpdate(false);
      localStorage.setItem('ia_ventura_version', APP_VERSION);
   };

   const handleNewStoryClick = () => {
      setShowModeSelect(true);
   };

   const handleCreateLobby = async () => {
      setIsCreatingLobby(true);
      try {
         let user;
         try {
             user = await account.get();
         } catch(e) {} // Convidado
         
         // Fix para Convidados: Se não houver user, usamos 'guest' context
         const userId = user?.$id || `guest_${Math.random().toString(36).substring(2, 9)}`;
         const finalUsername = user?.name || username || 'Convidado';
         const avatar = user?.prefs?.avatar || null;

         const session = await createLobbySession(userId, finalUsername, avatar);
         if (session) {
            onNavigate({ view: 'lobby', sessionCode: session.code });
         }
      } catch (e) {
         console.error(e);
      } finally {
         setIsCreatingLobby(false);
         setShowModeSelect(false);
      }
   };

   const cards = [
      { id: 'setup', action: handleNewStoryClick, title: t.createStory, desc: t.cardCreateDesc, icon: PlusCircle, color: 'bg-indigo-500', className: 'tour-new-story' },
      { id: 'drafts', action: () => onNavigate('drafts'), title: t.drafts, desc: t.cardDraftsDesc, icon: FileText, color: 'bg-amber-500', className: 'tour-drafts' },
      { id: 'library_private', action: () => onNavigate('library_private'), title: t.privateLibrary, desc: t.cardLibraryPrivateDesc, icon: Library, color: 'bg-emerald-500' },
      { id: 'public', action: () => onNavigate('public'), title: t.publicLibrary, desc: t.cardLibraryPublicDesc, icon: Globe, color: 'bg-blue-500' },
      { id: 'authors', action: () => onNavigate('authors'), title: t.authorsClub, desc: t.cardAuthorsDesc, icon: Users2, color: 'bg-rose-500' },
      { id: 'archive', action: () => onNavigate('archive'), title: t.archive, desc: t.cardArchiveDesc, icon: History, color: 'bg-slate-500' },
   ];

   const handleJoin = async (codeOverride?: string) => {
      const codeToUse = codeOverride || joinCode;
      if (!codeToUse) return;
      setIsJoining(true);
      setErrorJoin(null);
      try {
         let currentUser;
         try {
             currentUser = await account.get();
         } catch(e) {}

         const currentUserId = currentUser?.$id || 'guest';
         const userAvatar = currentUser?.prefs?.avatar || null;
         const session = await joinCollaborationSession(codeToUse, currentUserId, username, userAvatar);
         if (session) {
            const url = new URL(window.location.href);
            url.searchParams.delete('session');
            window.history.replaceState({}, '', url);
            if (session.status === 'lobby') {
               onNavigate({ view: 'lobby', sessionCode: session.code });
            } else if (session.status === 'setup') {
               onNavigate({ view: 'setup', sessionCode: session.code });
            } else {
               onNavigate({ view: 'story', sessionCode: session.code, initialStory: session.story_data });
            }
         } else {
            setErrorJoin(t.sessionError);
         }
      } catch (e) {
         console.error(e);
         setErrorJoin(t.sessionError);
      } finally {
         setIsJoining(false);
      }
   };

   return (
      <div className="space-y-12 animate-in fade-in duration-700">
         <div className="mb-12 py-2 flex flex-col md:flex-row md:items-start justify-between gap-6 tour-dashboard-header">
            <div>
               <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-2">{t.welcomeBack} <span className="text-indigo-500">{username}</span></h2>
               <p className="text-slate-500 font-medium">{t.exploreFuncs}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3 md:justify-end">
               <button onClick={() => setShowApiKeyModal(true)} className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-indigo-500 hover:border-indigo-500/50 transition-all flex items-center gap-2 group" title={t.apiKeySettings}>
                  <Key size={20} className="group-hover:scale-110 transition-transform text-indigo-500" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-indigo-500">{t.apiKeySettings}</span>
               </button>
               <button onClick={() => setShowTutorial(true)} className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-indigo-500 hover:border-indigo-500/50 transition-all flex items-center gap-2 group tour-help">
                  <HelpCircle size={20} className="group-hover:scale-110 transition-transform" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">{t.help || 'Ajuda'}</span>
               </button>
               <button onClick={() => setShowRanking(true)} className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-amber-500 hover:border-amber-500/50 transition-all flex items-center gap-2 group tour-ranking">
                  <Trophy size={20} className="group-hover:scale-110 transition-transform text-amber-500" />
                  <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest text-amber-500">{t.ranking || 'Ranking'}</span>
               </button>
               <div className="relative">
                  <button onClick={handleOpenChangelog} className="p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl text-slate-500 hover:text-indigo-500 hover:border-indigo-500/50 transition-all flex items-center gap-2 group">
                     <History size={20} className="group-hover:scale-110 transition-transform" />
                     <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">v{APP_VERSION}</span>
                     {hasNewUpdate && <span className="absolute -top-1 -right-1 w-3 h-3 bg-indigo-500 border-2 border-white dark:border-[#0a0a0c] rounded-full animate-bounce"></span>}
                  </button>
               </div>
            </div>
         </div>

         {activeSessionCode && (
            <div className="flex gap-2 mb-8">
               <button onClick={() => onNavigate({ view: 'lobby', sessionCode: activeSessionCode })} className="flex-1 p-6 rounded-[40px] bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex items-center justify-between group hover:shadow-xl transition-all">
                  <div className="flex items-center gap-4">
                     <div className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"><Wifi size={24} className="animate-pulse" /></div>
                     <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500/60 leading-none">{t.activeSession || 'Sessão Ativa'}</p>
                        <p className="text-lg font-black text-gray-900 dark:text-white mt-1">{t.backToLobby || 'Voltar ao Lobby'}</p>
                     </div>
                  </div>
                  <div className="px-5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-500/20 text-indigo-500 font-mono font-black text-xl tracking-tighter shadow-sm">{activeSessionCode}</div>
               </button>
               <button onClick={() => setShowDeleteConfirm(true)} className="p-6 rounded-[40px] bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all group" title={t.cancel || 'Cancelar'}><Trash2 size={24} /></button>
            </div>
         )}

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(card => (
               <div key={card.id} onClick={card.action || (() => onNavigate(card.id))} className={`group cursor-pointer bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-[40px] p-8 hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all hover:border-gray-300 dark:hover:border-white/10 hover:-translate-y-1 shadow-sm hover:shadow-lg ${card.className || ''}`}>
                  <div className={`w-14 h-14 ${card.color} rounded-2xl flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}><card.icon className="text-white" size={24} /></div>
                  <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{card.title}</h3>
                  <p className="text-slate-500 text-sm font-medium leading-relaxed">{card.desc}</p>
               </div>
            ))}
         </div>

         {showModeSelect && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-colors">
               <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-lg rounded-[40px] shadow-2xl p-8 space-y-8 animate-in zoom-in-95 duration-300 relative">
                  <div className="flex justify-between items-center mb-2">
                     <h3 className="text-2xl font-black text-gray-900 dark:text-white">{t.selectModeTitle}</h3>
                     <button onClick={() => setShowModeSelect(false)} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X size={20} className="text-slate-500" /></button>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <button onClick={() => { setShowModeSelect(false); onNavigate('setup'); }} className="flex items-center gap-6 p-6 rounded-[32px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/5 hover:border-indigo-500 dark:hover:border-indigo-500/50 transition-all text-left group tour-solo-mode">
                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform"><UserCircle size={32} /></div>
                        <div>
                           <div className="flex items-center gap-2 mb-1 relative group/tooltip">
                              <h4 className="text-lg font-black text-gray-900 dark:text-white">{t.modeSolo}</h4>
                              <div className="text-slate-400 transition-colors p-1 rounded-full cursor-help relative">
                                 <HelpCircle size={14} />
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[160] pointer-events-none before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-900 dark:before:border-t-white text-center font-medium">
                                    {t.modeSoloTooltip}
                                 </div>
                              </div>
                           </div>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.modeSoloDesc}</p>
                        </div>
                     </button>
                     <button onClick={isGuest ? undefined : handleCreateLobby} disabled={isCreatingLobby || isGuest} className={`flex items-center gap-6 p-6 rounded-[32px] border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] transition-all text-left group relative tour-coop-mode ${isGuest ? 'opacity-50 cursor-not-allowed' : 'hover:bg-white dark:hover:bg-white/5 hover:border-emerald-500 dark:hover:border-emerald-500/50'}`}>
                        <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">{isCreatingLobby ? <Loader2 className="animate-spin" /> : <Users2 size={32} />}</div>
                        <div>
                           <div className="flex items-center gap-2 mb-1 relative group/tooltip">
                              <h4 className="text-lg font-black text-gray-900 dark:text-white">{t.modeCoop}</h4>
                              <div className="text-slate-400 transition-colors p-1 rounded-full cursor-help relative">
                                 <HelpCircle size={14} />
                                 <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs leading-relaxed rounded-xl shadow-xl opacity-0 invisible group-hover/tooltip:opacity-100 group-hover/tooltip:visible transition-all z-[160] pointer-events-none before:absolute before:top-full before:left-1/2 before:-translate-x-1/2 before:border-4 before:border-transparent before:border-t-gray-900 dark:before:border-t-white text-center font-medium">
                                    {t.modeCoopTooltip}
                                 </div>
                              </div>
                           </div>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.modeCoopDesc}</p>
                           {isGuest && (
                              <div className="mt-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] sm:text-xs font-bold px-3 py-2 rounded-xl flex items-start gap-2">
                                 <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                 <span>{t.guestCoopWarning || 'O modo Co-Op requer uma conta registada para aceder à nuvem.'}</span>
                              </div>
                           )}
                        </div>
                     </button>
                  </div>
               </div>
            </div>
         )}

         <ChangelogModal t={t} isOpen={showChangelog} onClose={() => setShowChangelog(false)} lang={lang} />
         <CoopInfoModal t={t} isOpen={showCoopInfo} onClose={() => setShowCoopInfo(false)} />
         <AuthorRankingModal t={t} isOpen={showRanking} onClose={() => setShowRanking(false)} />
         <TutorialModal t={t} isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
         <ApiSetupModal t={t} isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />

         {showDeleteConfirm && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in">
               <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-sm rounded-[40px] p-8 shadow-2xl animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-rose-100 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center text-rose-500 mb-6 mx-auto"><Trash2 size={32} /></div>
                  <h3 className="text-xl font-black text-center text-gray-900 dark:text-white mb-2">{t.confirmDeleteSession || 'Eliminar Sessão?'}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center font-medium mb-8">{t.confirmDeleteSessionDesc || 'Tens a certeza que queres terminar esta sessão ativamente?'}</p>
                  <div className="grid grid-cols-2 gap-3">
                     <button onClick={() => setShowDeleteConfirm(false)} className="px-6 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 text-slate-500 font-bold hover:bg-gray-200 transition-colors">{t.cancel}</button>
                     <button onClick={() => { setShowDeleteConfirm(false); onNavigate({ view: 'dashboard', sessionCode: null }); }} className="px-6 py-4 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-500 shadow-lg shadow-rose-500/20 transition-all">{t.confirm}</button>
                  </div>
               </div>
            </div>
         )}

         <InteractiveTour
            isOpen={showTour}
            onClose={() => setShowTour(false)}
            steps={[
               { selector: '.tour-dashboard-header', title: 'Dashboard', content: 'Este é o teu cockpit criativo. Aqui tens acesso rápido a todas as tuas obras e ferramentas.' },
               { selector: '.tour-new-story', title: 'Novas Aventuras', content: 'Clica aqui para começares uma nova história. Podes escrever sozinho com a IA ou convidar amigos para o Modo Co-Op.' },
               { selector: '.tour-drafts', title: 'Rascunhos Perto de Ti', content: 'Nunca percas o fio à meada. Os teus rascunhos em curso aparecem aqui para que possas retomar a escrita instantaneamente.' },
               { selector: '.tour-ranking', title: 'Elite Literária', content: 'Vê quem está a dominar o trimestre no Ranking de Autores. Conseguirás chegar ao topo?' },
               { selector: '.tour-help', title: 'Estamos aqui para ajudar', content: 'Sempre que tiveres dúvidas, clica aqui para ver este guia ou consultar o manual técnico.' }
            ]}
         />

         {incomingSessionCode && (
            <JoinInviteModal
               t={t}
               isOpen={!!incomingSessionCode}
               onClose={() => { setIncomingSessionCode(null); setJoinCode(''); setErrorJoin(null); }}
               onJoin={() => handleJoin(incomingSessionCode)}
               code={incomingSessionCode}
               isJoining={isJoining}
               error={errorJoin}
            />
         )}
      </div>
   );
};
