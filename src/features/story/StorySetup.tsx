import React, { useState, useEffect } from 'react';
import { PenTool, Sparkles, Loader2, Wand2, Shield, Trash2, CheckCircle, Users2, Plus, Minus } from 'lucide-react';
import { PageHeader, ApiSetupModal } from '@/components';
import { Language } from '@/utils/constants';
import { generatePremises, generateCharacters } from '@/services/ai';
import { joinCollaborationSession, updateSessionStory, updateSessionPhase } from '@/services/services';
import { useAppStore } from '@/store/useAppStore';

export const StorySetup = ({ t, lang, onBack, onComplete, sessionCode, user, onShowToast }: { t: any, lang: Language, onBack: () => void, onComplete: (config: any) => void, sessionCode?: string, user?: any, onShowToast?: (msg: string, type: 'error' | 'success' | 'info') => void }) => {
    const [step, setStep] = useState(1);
    const [mode, setMode] = useState<'own' | 'ai'>('own');
    const [config, setConfig] = useState<any>({ idea: '', genre: 'fantasy', subTema: 'none', timePeriod: 'present', quality: 'rich', charProfiles: [], mainChar: '', charLinks: '', playAsYourself: false });
    const [aiIdeas, setAiIdeas] = useState<string[]>([]);
    const [loadingAI, setLoadingAI] = useState(false);
    const [loadingCharsAI, setLoadingCharsAI] = useState(false);
    const [editingChar, setEditingChar] = useState<any>(null);
    const [isHost, setIsHost] = useState(false);
    const [sessionParticipants, setSessionParticipants] = useState<any[]>([]);
    const [kicked, setKicked] = useState(false);
    const [showApiSetup, setShowApiSetup] = useState(false);
    const [extraCharsB, setExtraCharsB] = useState<string[]>([]);
    const { apiKeys, activeProvider } = useAppStore();

    useEffect(() => {
        if (!sessionCode || !user) return;
        let interval: any;
        const fetchSession = async () => {
            try {
                const username = user.user_metadata?.username || user.email?.split('@')[0];
                const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;
                const session = await joinCollaborationSession(sessionCode, user.id, username, avatar);
                if (session) {
                    if (session.host_id === user.id) setIsHost(true);
                    if (session.story_data?.participants) {
                        const parts = session.story_data.participants;
                        setSessionParticipants(parts);
                        const amIHere = parts.some((p: any) => p.id === user.id);
                        if (!amIHere) {
                            setKicked(true);
                            setTimeout(() => onBack(), 3000);
                        }
                    }
                    if (session.story_data?.config) {
                        const remoteConfig = session.story_data.config;
                        setConfig((prev: any) => { return { ...prev, ...remoteConfig }; });
                    }

                    if (session.status === 'active' && session.host_id !== user.id) {
                        onComplete(session.story_data.config);
                    }
                }
            } catch (e) { console.error("Setup Sync Error", e); }
        };
        fetchSession();
        interval = setInterval(fetchSession, 2000);
        return () => clearInterval(interval);
    }, [sessionCode, user]);

    const updateRemoteConfig = async (newConfig: any) => {
        if (sessionCode) {
            await updateSessionStory(sessionCode, {
                config: newConfig,
                participants: sessionParticipants,
                currentTurnIndex: 0
            });
        }
    };

    const handleConfigChange = (newConfig: any) => { setConfig(newConfig); updateRemoteConfig(newConfig); };

    const fetchAI = async () => {
        if (!apiKeys[activeProvider]) {
            setShowApiSetup(true);
            return;
        }
        
        setLoadingAI(true);
        try {
            const ideas = await generatePremises(lang, config.genre, config.subTema, config.timePeriod);
            setAiIdeas(ideas);
            if (ideas.length > 0) {
                // Auto-select the first idea to prevent users from getting stuck
                handleConfigChange({ ...config, idea: ideas[0] });
            }
        } catch (e: any) {
            console.error(e);
            if (onShowToast) {
                onShowToast(e.message || "Erro ao gerar conceitos.", 'error');
            }
        } finally {
            setLoadingAI(false);
        }
    };

    const fetchCharsAI = async () => {
        if (!apiKeys[activeProvider]) {
            setShowApiSetup(true);
            return;
        }
        
        setLoadingCharsAI(true);
        try {
            const chars = await generateCharacters(config, lang);
            if (chars && chars.length > 0) {
                const newProfiles = [...(config.charProfiles || []), ...chars];
                handleConfigChange({ ...config, charProfiles: newProfiles });
            }
        } catch (e: any) {
            console.error(e);
            if (onShowToast) {
                onShowToast(e.message || "Erro ao gerar personagens.", 'error');
            }
        } finally {
            setLoadingCharsAI(false);
        }
    };

    const next = () => setStep(step + 1);
    const prev = () => setStep(step - 1);

    const [isFinishing, setIsFinishing] = useState(false);

    const finish = () => {
        setIsFinishing(true);
        // Pequena simulação de processamento/carregamento para feedback visual
        setTimeout(() => {
            onComplete(config);
            if (sessionCode && isHost) {
                updateSessionPhase(sessionCode, 'active', { config, participants: sessionParticipants, currentTurnIndex: 0, messages: [] });
            }
        }, 2200);
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 md:px-8 animate-in slide-in-from-right-8 duration-500 pb-24 pt-4">
            <PageHeader t={t} title={t.setupTitle} subtitle={t.stepCounter(step, 4)} onBack={onBack} />

            {step === 1 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mt-8">
                    {/* Lado Esquerdo: Modo & Input Core */}
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setMode('own')} className={`p-6 rounded-3xl border transition-all ${mode === 'own' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] text-slate-500 hover:border-indigo-300'}`}>
                                <PenTool className="mb-3 mx-auto" />
                                <h3 className="font-bold text-center">{t.ownIdea}</h3>
                            </button>
                            <button onClick={() => setMode('ai')} className={`p-6 rounded-3xl border transition-all ${mode === 'ai' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shadow-lg shadow-indigo-500/10' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#121214] text-slate-500 hover:border-indigo-300'}`}>
                                <Sparkles className="mb-3 mx-auto" />
                                <h3 className="font-bold text-center">{t.aiIdea}</h3>
                            </button>
                        </div>
                        {mode === 'own' && (
                            <textarea
                                value={config.idea}
                                onChange={(e) => handleConfigChange({ ...config, idea: e.target.value })}
                                placeholder={t.ideaPlaceholder}
                                className="w-full h-40 lg:h-64 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-3xl p-6 text-gray-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 resize-none shadow-xl text-lg leading-relaxed"
                            />
                        )}
                        {mode === 'ai' && (
                            <div className="space-y-6 bg-white dark:bg-[#121214] p-6 lg:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl">
                                <div className="space-y-2">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-base">{t.step1Genre}</h4>
                                    <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                        {Object.keys(t.genres).map(g => (
                                            <button key={g} onClick={() => setConfig({ ...config, genre: g })} className={`px-3 py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase tracking-widest whitespace-nowrap border transition-all ${config.genre === g ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-gray-50 dark:bg-white/5 text-slate-500 border-gray-200 dark:border-white/10 hover:border-indigo-400/50 hover:text-indigo-400'}`}>
                                                {t.genres[g] || g}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {lang === 'pt' ? '🎭 Sub-Tema / Foco' : '🎭 Sub-Theme / Focus'}
                                        </label>
                                        <select 
                                            value={config.subTema} 
                                            onChange={e => handleConfigChange({ ...config, subTema: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 font-medium text-sm text-gray-900 dark:text-white"
                                        >
                                            <option value="none" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Nenhum' : 'None'}</option>
                                            <option value="romance" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Romance / Relações' : 'Romance / Relationships'}</option>
                                            <option value="medieval" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Medieval / Épico' : 'Medieval / Epic'}</option>
                                            <option value="scifi" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Ficção Científica / Tecnologia' : 'Science Fiction / Tech'}</option>
                                            <option value="humor" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Comédia / Humor' : 'Comedy / Humor'}</option>
                                            <option value="veridica" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'História Real / Verídica' : 'Real / True Story'}</option>
                                            <option value="mystery" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Mistério / Investigação' : 'Mystery / Investigation'}</option>
                                            <option value="drama" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Drama / Conflito Familiar' : 'Drama / Family Conflict'}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {lang === 'pt' ? '⏳ Posição no Tempo' : '⏳ Position in Time'}
                                        </label>
                                        <select 
                                            value={config.timePeriod} 
                                            onChange={e => handleConfigChange({ ...config, timePeriod: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-indigo-500/20 font-medium text-sm text-gray-900 dark:text-white"
                                        >
                                            <option value="present" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Contemporâneo / Atual' : 'Contemporary / Present'}</option>
                                            <option value="past_medieval" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Passado Medieval / Feudal' : 'Medieval Past / Feudal'}</option>
                                            <option value="past_century" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Século Passado (XIX/XX)' : 'Last Century (19th/20th)'}</option>
                                            <option value="future_near" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Futuro Próximo / Distopia' : 'Near Future / Dystopia'}</option>
                                            <option value="future_far" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Futuro Distante / Espacial' : 'Far Future / Space Era'}</option>
                                            <option value="timeless" className="text-gray-950 dark:text-gray-900">{lang === 'pt' ? 'Atemporal / Fantástico' : 'Timeless / Mythological'}</option>
                                        </select>
                                    </div>
                                </div>

                                <button onClick={fetchAI} disabled={loadingAI} className="w-full py-5 mt-4 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-black tracking-widest uppercase text-sm rounded-2xl hover:bg-indigo-200 dark:hover:bg-indigo-500/30 transition-all flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-500/10">
                                    {loadingAI ? <Loader2 className="animate-spin" size={24} /> : <Wand2 size={24} />}
                                    {loadingAI ? t.generatingConcepts : t.generateMagicSuggestions}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Lado Direito: Preview da Ideia ou AI Ideas */}
                    <div className="space-y-6 h-full">
                        {mode === 'ai' ? (
                            <div className="bg-white dark:bg-[#121214] p-6 lg:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-xl h-full flex flex-col min-h-[400px]">
                                <h4 className="font-bold text-gray-900 dark:text-white mb-6 text-lg flex items-center gap-3">
                                    <Sparkles className="text-indigo-500" />
                                    {t.step2Premise}
                                </h4>
                                {aiIdeas.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                        <Wand2 size={64} className="mb-6 text-indigo-500" />
                                        <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">{t.generateIdeasFirst}</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1 max-h-[500px]">
                                        {aiIdeas.map((idea, i) => (
                                            <div key={i} onClick={() => handleConfigChange({ ...config, idea })} className={`p-6 rounded-2xl border cursor-pointer hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all animate-in slide-in-from-bottom-2 ${config.idea === idea ? 'border-indigo-500 ring-4 ring-indigo-500/20 bg-indigo-50 dark:bg-indigo-500/10' : 'border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02]'}`} style={{ animationDelay: `${i * 100}ms` }}>
                                                <p className="text-base font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{idea}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="hidden lg:flex bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-500/5 dark:to-purple-500/5 border border-indigo-500/10 rounded-3xl p-12 h-full flex-col items-center justify-center text-center shadow-inner">
                                <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-8 shadow-xl">
                                    <PenTool size={40} className="text-indigo-500" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">{t.limitImaginationTitle}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-md">{t.limitImaginationDesc}</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start mt-8">
                    <div className="space-y-6">
                        {sessionCode && (
                            <div
                                onClick={() => handleConfigChange({ ...config, playAsYourself: !config.playAsYourself })}
                                className={`p-6 rounded-3xl border cursor-pointer flex items-center gap-5 transition-all hover:scale-[1.01] ${config.playAsYourself ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/10' : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-white/10 hover:border-emerald-300'}`}
                            >
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${config.playAsYourself ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/10 text-slate-400'}`}>
                                    <Shield size={28} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-black text-gray-900 dark:text-white text-lg">{t.playAsYourself}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{t.playAsYourselfDesc}</p>
                                </div>
                                {config.playAsYourself && <CheckCircle className="text-emerald-500 shrink-0" size={28} />}
                            </div>
                        )}

                        <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-[32px] p-6 lg:p-8 shadow-xl">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                                    <Users2 className="text-indigo-500" />
                                    {t.charNamesTitle}
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={fetchCharsAI} disabled={loadingCharsAI || !config.idea} className="px-5 py-2.5 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-100 dark:hover:bg-purple-500/20 transition-colors flex items-center gap-2">
                                        {loadingCharsAI ? <Loader2 className="animate-spin" size={14} /> : <Wand2 size={14} />}
                                        <span className="hidden sm:inline">{t.generateCast}</span>
                                    </button>
                                    <button onClick={() => setEditingChar({})} className="px-5 py-2.5 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors">+ {t.addCharacter}</button>
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {config.charProfiles.map((char: any, i: number) => (
                                    <div key={i} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/30 transition-all animate-in slide-in-from-bottom-2" style={{ animationDelay: `${i * 100}ms` }}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg shadow-inner">{char.name[0]}</div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-base">{char.name}</p>
                                                <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mt-0.5">{char.role === 'Protagonist' ? t.roleProtagonist : char.role === 'Antagonist' ? t.roleAntagonist : char.role === 'Sidekick' ? t.roleSidekick : char.role}</p>
                                                {char.controlledBy && <p className="text-[10px] text-emerald-500 font-black mt-1 uppercase tracking-wider">{t.lockedBy} {char.controlledBy}</p>}
                                            </div>
                                        </div>
                                        <button onClick={() => {
                                            const newChars = [...config.charProfiles];
                                            newChars.splice(i, 1);
                                            handleConfigChange({ ...config, charProfiles: newChars });
                                        }} className="w-10 h-10 flex items-center justify-center rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"><Trash2 size={18} /></button>
                                    </div>
                                ))}
                                {config.charProfiles.length === 0 && (
                                    <div className="text-center py-12 px-6 border-2 border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                                        <Users2 size={40} className="mx-auto text-slate-300 mb-4" />
                                        <p className="text-slate-400 text-sm font-medium">{lang === 'pt' ? 'Adiciona personagens para compor o elenco. Em sessões cooperativas, os jogadores podem controlar estas personagens.' : 'Add characters to build the cast. In cooperative sessions, players can control these characters.'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="hidden lg:flex bg-gradient-to-bl from-emerald-50 to-teal-50 dark:from-emerald-500/5 dark:to-teal-500/5 border border-emerald-500/10 rounded-[32px] p-12 h-full flex-col items-center justify-center text-center shadow-inner">
                        <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mb-8 shadow-xl">
                            <Users2 size={40} className="text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">{lang === 'pt' ? 'Elenco da História' : 'Story Cast'}</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed max-w-sm">{lang === 'pt' ? 'Adiciona personagens importantes à tua aventura. Se estiveres numa sessão cooperativa com amigos, eles poderão assumir o controlo das personagens que criares!' : 'Add important characters to your adventure. If you are in a cooperative session with friends, they can take control of the characters you create!'}</p>
                    </div>

                    {editingChar && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                            <div className="bg-white dark:bg-[#121214] w-full max-w-md rounded-[32px] p-8 space-y-5 border border-gray-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                                <h3 className="font-black text-2xl text-gray-900 dark:text-white mb-2">{t.addCharacter || (lang === 'pt' ? 'Adicionar Personagem' : 'Add Character')}</h3>
                                <div className="space-y-4">
                                    <input autoFocus value={editingChar.name || ''} onChange={e => setEditingChar({ ...editingChar, name: e.target.value })} placeholder={t.charNamesPlaceholder || (lang === 'pt' ? 'Ex: Rui Silva' : 'Ex: Elara Vance')} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-indigo-500/20 font-medium" />
                                    <select value={editingChar.role || 'Protagonist'} onChange={e => setEditingChar({ ...editingChar, role: e.target.value })} className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-indigo-500/20 font-medium appearance-none">
                                        <option value="Protagonist">{t.roleProtagonist || (lang === 'pt' ? 'Protagonista' : 'Protagonist')}</option>
                                        <option value="Antagonist">{t.roleAntagonist || (lang === 'pt' ? 'Antagonista' : 'Antagonist')}</option>
                                        <option value="Sidekick">{t.roleSidekick || (lang === 'pt' ? 'Personagem Secundária' : 'Sidekick')}</option>
                                    </select>
                                </div>

                                {config.playAsYourself && user && (
                                    <button
                                        onClick={() => setEditingChar({ ...editingChar, controlledBy: editingChar.controlledBy === user.user_metadata.username ? null : user.user_metadata.username })}
                                        className={`w-full py-4 rounded-2xl text-sm font-black uppercase tracking-widest border transition-all shadow-sm ${editingChar.controlledBy === user.user_metadata.username ? 'bg-emerald-500 text-white border-emerald-500 shadow-emerald-500/20' : 'bg-white dark:bg-[#121214] border-gray-200 dark:border-white/10 text-slate-500 hover:border-emerald-300 hover:text-emerald-500'}`}
                                    >
                                        {editingChar.controlledBy === user.user_metadata.username ? (lang === 'pt' ? 'Controlado por mim' : 'Controlled by me') : (lang === 'pt' ? 'Assumir Controlo' : 'Take Control')}
                                    </button>
                                )}

                                <div className="flex gap-3 pt-4">
                                    <button onClick={() => setEditingChar(null)} className="flex-1 py-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-2xl text-xs font-black uppercase tracking-widest text-slate-500">{t.cancel}</button>
                                    <button onClick={() => {
                                        if (editingChar.name) {
                                            handleConfigChange({ ...config, charProfiles: [...config.charProfiles, editingChar] });
                                            setEditingChar(null);
                                        }
                                    }} className="flex-1 py-4 bg-indigo-600 text-white hover:bg-indigo-500 transition-colors rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">{t.confirm}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 3 && (
                <div className="max-w-5xl mx-auto space-y-8 bg-white dark:bg-[#121214] p-8 lg:p-12 rounded-[32px] border border-gray-200 dark:border-white/10 shadow-2xl mt-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500"><Users2 size={32} /></div>
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t.charLinksTitle}</h3>
                        </div>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium text-lg leading-relaxed max-w-2xl">
                        {lang === 'pt' 
                          ? 'Desenha o mapa de relações e ramificações entre as personagens. Podes criar múltiplas ligações para definir laços familiares, rivalidades ou alianças.'
                          : 'Design the relationship and connection map between characters. You can create multiple links to define family ties, rivalries, or alliances.'}
                    </p>

                    {/* Criador de Relações Dinâmico */}
                    <div className="bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-6 rounded-3xl space-y-6">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                            {lang === 'pt' ? '🔗 Adicionar Nova Conexão' : '🔗 Add New Connection'}
                        </h4>
                        
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                        {lang === 'pt' ? 'Personagem A' : 'Character A'}
                                    </label>
                                    <select 
                                        id="char-a-select"
                                        className="w-full bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-purple-500/20 font-medium text-sm text-gray-900 dark:text-white"
                                    >
                                        <option value="">{lang === 'pt' ? 'Selecionar...' : 'Select...'}</option>
                                        {config.charProfiles.map((c: any, idx: number) => (
                                            <option key={idx} value={c.name} className="text-gray-900 dark:text-gray-900">{c.name}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                                        {lang === 'pt' ? 'Ligação / Relação' : 'Relationship / Connection'}
                                    </label>
                                    <input 
                                        id="relation-input"
                                        type="text" 
                                        placeholder={lang === 'pt' ? 'Ex: Irmão de, Pai de, Rival de' : 'Ex: Brother of, Father of, Rival of'}
                                        className="w-full bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-purple-500/20 font-medium text-sm text-gray-900 dark:text-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                                            {lang === 'pt' ? 'Personagem B' : 'Character B'}
                                        </label>
                                        <button 
                                            onClick={() => setExtraCharsB([...extraCharsB, ''])}
                                            className="p-1 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-500/10 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                            title={lang === 'pt' ? 'Adicionar mais uma Personagem B' : 'Add another Character B'}
                                        >
                                            <Plus size={12} /> {lang === 'pt' ? 'Mais' : 'More'}
                                        </button>
                                    </div>
                                    <select 
                                        id="char-b-select"
                                        className="w-full bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-purple-500/20 font-medium text-sm text-gray-900 dark:text-white"
                                    >
                                        <option value="">{lang === 'pt' ? 'Selecionar...' : 'Select...'}</option>
                                        {config.charProfiles.map((c: any, idx: number) => (
                                            <option key={idx} value={c.name} className="text-gray-900 dark:text-gray-900">{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {extraCharsB.map((val, eIdx) => (
                                <div key={eIdx} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end animate-in slide-in-from-top-2 duration-200">
                                    <div className="hidden md:block"></div>
                                    <div className="hidden md:block"></div>
                                    <div className="space-y-2 relative">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500">
                                                {lang === 'pt' ? `Personagem B (Extra ${eIdx + 1})` : `Character B (Extra ${eIdx + 1})`}
                                            </label>
                                            <button 
                                                onClick={() => {
                                                    const updated = [...extraCharsB];
                                                    updated.splice(eIdx, 1);
                                                    setExtraCharsB(updated);
                                                }}
                                                className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                                            >
                                                <Minus size={12} /> {lang === 'pt' ? 'Remover' : 'Remove'}
                                            </button>
                                        </div>
                                        <select 
                                            value={val}
                                            onChange={e => {
                                                const updated = [...extraCharsB];
                                                updated[eIdx] = e.target.value;
                                                setExtraCharsB(updated);
                                            }}
                                            className="w-full bg-white dark:bg-[#1A1A1E] border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 outline-none focus:ring-2 ring-purple-500/20 font-medium text-sm text-gray-900 dark:text-white"
                                        >
                                            <option value="">{lang === 'pt' ? 'Selecionar...' : 'Select...'}</option>
                                            {config.charProfiles.map((c: any, idx: number) => (
                                                <option key={idx} value={c.name} className="text-gray-900 dark:text-gray-900">{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => {
                                const selectA = document.getElementById('char-a-select') as HTMLSelectElement;
                                const inputRel = document.getElementById('relation-input') as HTMLInputElement;
                                const selectB = document.getElementById('char-b-select') as HTMLSelectElement;

                                const valueA = selectA?.value;
                                const relation = inputRel?.value;
                                
                                // Colecionar todas as personagens B selecionadas
                                const targetsB = [selectB?.value, ...extraCharsB].filter(v => v && v.trim() !== '');

                                if (valueA && relation && targetsB.length > 0) {
                                    const duplicate = targetsB.find(val => val === valueA);
                                    if (duplicate) {
                                        if (onShowToast) onShowToast(lang === 'pt' ? 'Uma personagem não pode ligar-se a si mesma.' : 'A character cannot connect to themselves.', 'error');
                                        return;
                                    }

                                    const currentLinks = config.charLinks ? config.charLinks.split('\n').filter((l: string) => l.trim() !== '') : [];
                                    let newLinkAdded = false;

                                    targetsB.forEach(valB => {
                                        const linkText = `${valueA} é ${relation} ${valB}`;
                                        if (!currentLinks.includes(linkText)) {
                                            currentLinks.push(linkText);
                                            newLinkAdded = true;
                                        }
                                    });

                                    if (newLinkAdded) {
                                        handleConfigChange({ ...config, charLinks: currentLinks.join('\n') });
                                        if (onShowToast) onShowToast(lang === 'pt' ? 'Ligações criadas com sucesso!' : 'Connections created successfully!', 'success');
                                    }
                                    
                                    inputRel.value = '';
                                    setExtraCharsB([]);
                                    selectB.value = '';
                                } else {
                                    if (onShowToast) onShowToast(lang === 'pt' ? 'Preenche todos os campos da conexão.' : 'Fill in all connection fields.', 'error');
                                }
                            }}
                            className="w-full py-3 bg-purple-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl hover:bg-purple-500 transition-colors shadow-lg shadow-purple-600/10"
                        >
                            {lang === 'pt' ? 'Criar Ligação' : 'Create Connection'}
                        </button>
                    </div>

                    {/* Tabela / Mapa de Relações */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">
                            {lang === 'pt' ? '📋 Conexões Definidas (Ramificações)' : '📋 Defined Connections (Branches)'}
                        </h4>
                        
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                            {config.charLinks ? (
                                config.charLinks.split('\n').filter((l: string) => l.trim() !== '').map((link: string, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 animate-in fade-in">
                                        <span className="text-sm font-bold text-gray-800 dark:text-slate-300">{link}</span>
                                        <button 
                                            onClick={() => {
                                                const currentLinks = config.charLinks.split('\n').filter((l: string) => l.trim() !== '');
                                                currentLinks.splice(idx, 1);
                                                handleConfigChange({ ...config, charLinks: currentLinks.join('\n') });
                                            }}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-slate-400 italic text-center py-6 border border-dashed border-gray-200 dark:border-white/10 rounded-2xl">
                                    {lang === 'pt' ? 'Nenhuma relação configurada.' : 'No relationships configured.'}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Editor Manual de Apoio */}
                    <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {lang === 'pt' ? '✍️ Notas ou Detalhes Adicionais da Dinâmica' : '✍️ Additional Notes or Dynamics Details'}
                        </label>
                        <textarea
                            value={config.charLinks}
                            onChange={(e) => handleConfigChange({ ...config, charLinks: e.target.value })}
                            placeholder={t.charLinksPlaceholder}
                            className="w-full h-32 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 rounded-3xl p-5 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 ring-purple-500/20 resize-none leading-relaxed shadow-inner"
                        />
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-8 text-center py-20 lg:py-32">
                    <div className="w-32 h-32 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 mb-8 shadow-2xl shadow-emerald-500/20 animate-pulse">
                        <CheckCircle size={64} />
                    </div>
                    <h3 className="text-5xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tighter mb-6">{t.allSetTitle}</h3>
                    <p className="text-xl lg:text-2xl text-slate-500 dark:text-slate-400 max-w-xl mx-auto font-medium leading-relaxed">{t.allSetDesc}</p>
                </div>
            )}

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-[#0a0a0c]/80 backdrop-blur-xl border-t border-gray-200 dark:border-white/5 flex justify-center gap-4">
                {step > 1 && <button onClick={prev} className="px-8 py-3 bg-gray-100 dark:bg-white/5 rounded-2xl text-slate-500 font-bold uppercase tracking-widest text-xs hover:bg-gray-200 dark:hover:bg-white/10">{t.back}</button>}
                {step < 4 ? (
                    <button onClick={next} disabled={!config.idea && step === 1} className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:shadow-none">{t.next}</button>
                ) : (
                    <button onClick={finish} className="px-12 py-3 bg-emerald-500 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-400 shadow-lg shadow-emerald-500/20">{t.startAdventure}</button>
                )}
            </div>

            <ApiSetupModal t={t} isOpen={showApiSetup} onClose={() => setShowApiSetup(false)} forceSetup={false} />

            {/* Livro a desfolhar & Barra de Progresso Overlay */}
            {isFinishing && (
                <div className="fixed inset-0 z-[300] bg-gray-950/95 backdrop-blur-md flex flex-col items-center justify-center space-y-12 animate-in fade-in duration-300">
                    <div className="relative w-40 h-28 flex items-center justify-center [perspective:1000px]">
                        {/* Book Spine */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-1.5 h-full bg-slate-800 rounded-full shadow-2xl z-20" />
                        
                        {/* Left Static Page */}
                        <div className="absolute right-1/2 w-20 h-full bg-white dark:bg-slate-100 rounded-l-lg border-r border-slate-200 shadow-md origin-right" />
                        
                        {/* Right Static Page */}
                        <div className="absolute left-1/2 w-20 h-full bg-white dark:bg-slate-100 rounded-r-lg border-l border-slate-200 shadow-md origin-left" />

                        {/* Flipping Pages (3 Layers) */}
                        <div className="absolute left-1/2 w-20 h-full bg-white dark:bg-slate-50 rounded-r-lg border-l border-slate-200 shadow-lg animate-page-flip-1" />
                        <div className="absolute left-1/2 w-20 h-full bg-white dark:bg-slate-50 rounded-r-lg border-l border-slate-200 shadow-lg animate-page-flip-2" />
                        <div className="absolute left-1/2 w-20 h-full bg-white dark:bg-slate-50 rounded-r-lg border-l border-slate-200 shadow-lg animate-page-flip-3" />
                    </div>

                    <div className="text-center space-y-4 max-w-sm px-6">
                        <h4 className="text-white font-black text-xl tracking-tight uppercase tracking-[0.2em] text-indigo-400">
                            {lang === 'pt' ? 'A Preparar Aventura' : 'Preparing Adventure'}
                        </h4>
                        <p className="text-slate-400 text-xs font-semibold leading-relaxed">
                            {lang === 'pt' 
                               ? 'O Editor está a alinhar as personagens e a carregar a premissa narrativa...' 
                               : 'The Editor is aligning the characters and loading the narrative premise...'}
                        </p>
                        
                        {/* Custom Loading Progress Bar Container */}
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-6">
                            <div className="h-full bg-indigo-500 rounded-full animate-progress-bar" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
