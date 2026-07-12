import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft, Sparkles, Loader2, Send, Wifi, Lock, PenTool, CheckCircle, Plus, Minus, Type, Users2, HelpCircle, Info, X, Map, Shield, Volume2, VolumeX, Eye, EyeOff, Trash2
} from 'lucide-react';
import { requestImageGeneration, streamAIConversation, generateSuggestions, extractStoryState, generateImagePrompt } from '@/services/ai';
import { ConfirmModal, ParticipantsModal } from '@/components';
import { updateSessionStory, joinCollaborationSession, createCollaborationSession, updateSessionPhase, notifyTurnByEmail, regenerateSessionCode, getProfileSettings, updateProfileSettings, getSpectatorSession } from '@/services/services';
import { renderNarrativeWithBreaks, getAuthorStyle } from '@/utils/utils';

export const StoryEngine = ({ t, lang, user, initialConfig, sessionCode, onExit, onAutoSave, onFinalizeBook, onSessionStart, onShowToast, isSpectator = false }: any) => {
    const [messages, setMessages] = useState<any[]>(initialConfig?.messages || []);
    const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [writeOwn, setWriteOwn] = useState(false);
    const [participants, setParticipants] = useState<any[]>(initialConfig?.participants || []);
    const [showParticipants, setShowParticipants] = useState(false);
    const [showConfig, setShowConfig] = useState(false);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(initialConfig?.currentTurnIndex || 0);
    const [isHost, setIsHost] = useState(false);

    // Novos estados para extensões
    const [zenMode, setZenMode] = useState(false);
    const [showTree, setShowTree] = useState(false);
    const [inventory, setInventory] = useState<string[]>(initialConfig?.inventory || []);
    const [relationships, setRelationships] = useState<any>(initialConfig?.relationships || {});
    const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

    const fontSizes = ['text-sm', 'text-base', 'text-lg', 'text-xl', 'text-2xl'];
    const [fontSizeIndex, setFontSizeIndex] = useState(1);
    const [lastAuthorId, setLastAuthorId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (!sessionCode) return;

        const interval = setInterval(async () => {
            if (!isSpectator) {
                // Polling normal para participantes
            } else {
                // Carregar em modo espectador
                const session = await getSpectatorSession(sessionCode);
                if (session && session.story_data) {
                    if (session.story_data.messages?.length > messages.length) {
                        setMessages(session.story_data.messages);
                        setParticipants(session.story_data.participants || []);
                        setCurrentTurnIndex(session.story_data.currentTurnIndex || 0);
                        setTimeout(scrollToBottom, 100);
                    }
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [sessionCode, messages.length, isSpectator]);

    useEffect(() => {
        setWriteOwn(false);
    }, [messages.length]);

    useEffect(() => {
        if (isSpectator || !user) return;
        const loadSettings = async () => {
            try {
                const settings = await getProfileSettings(user.id);
                if (settings?.fontSizeIndex !== undefined) {
                    setFontSizeIndex(settings.fontSizeIndex);
                }
            } catch (e) { console.warn("Could not load font settings", e); }
        };
        loadSettings();
    }, [user.id]);

    const handleFontSizeChange = async (increment: boolean) => {
        const newIndex = increment ? Math.min(fontSizeIndex + 1, fontSizes.length - 1) : Math.max(fontSizeIndex - 1, 0);
        setFontSizeIndex(newIndex);
        await updateProfileSettings(user.id, { fontSizeIndex: newIndex });
    };

    const calculateTurnFromHistory = (msgs: any[], parts: any[]) => {
        if (!parts || parts.length === 0) return 0;
        if (!msgs || msgs.length === 0) return 0;
        const lastHumanMsg = [...msgs].reverse().find(m => m.role === 'user');
        if (!lastHumanMsg) return 0;
        const lastAuthId = lastHumanMsg.author_id;
        if (!lastAuthId) return 0;
        const lastAuthorIndex = parts.findIndex(p => p.id === lastAuthId);
        if (lastAuthorIndex === -1) return 0;
        return (lastAuthorIndex + 1) % parts.length;
    };

    useEffect(() => {
        // Migração de mensagens legadas (lineares) para estrutura com IDs
        if (messages.length > 0 && !messages[0].id) {
            const migrated = messages.map((m, idx) => ({
                ...m,
                id: `legacy-${idx}-${Date.now()}`,
                parentId: idx === 0 ? null : `legacy-${idx - 1}`
            }));
            setMessages(migrated);
            setActiveNodeId(migrated[migrated.length - 1].id);
        } else if (messages.length > 0) {
            setActiveNodeId(messages[messages.length - 1].id);
        }
    }, [messages.length]);

    useEffect(() => {
        if (isSpectator || !user) return;

        const shouldGen = !sessionCode || (participants.length > 0 && currentTurnIndex === participants.findIndex(p => p.id === user.id));

        if (messages.length > 0 && shouldGen && !isTyping && suggestions.length === 0) {
            generateSuggestions(messages, lang).then(setSuggestions);
        } else if (messages.length === 0) {
            setSuggestions([]);
        } setTimeout(scrollToBottom, 100);
    }, [messages.length, currentTurnIndex, participants.length, isTyping, suggestions.length]);

    const handleTTS = (text: string, msgId: string) => {
        if (isSpeaking === msgId) {
            window.speechSynthesis.cancel();
            setIsSpeaking(null);
            return;
        }
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        const targetLang = lang === 'pt' ? 'pt-PT' : lang === 'fr' ? 'fr-FR' : 'en-US';
        utterance.lang = targetLang;

        // Ajustes para navegação de voz natural
        utterance.rate = 0.95; // Ligeiramente mais lento confere uma leitura literária mais natural
        utterance.pitch = 1.0;

        // Tentar obter a melhor voz disponível no sistema operativo do utilizador
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const langPrefix = lang === 'pt' ? 'pt' : lang === 'fr' ? 'fr' : 'en';
            const availableVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langPrefix));

            // Preferir vozes da nuvem ou de alta qualidade Neural/Natural/Google
            const premiumVoice = availableVoices.find(v =>
                v.name.includes('Google') ||
                v.name.includes('Natural') ||
                v.name.includes('Neural') ||
                v.name.includes('Online')
            );

            if (premiumVoice) {
                utterance.voice = premiumVoice;
            } else if (availableVoices.length > 0) {
                utterance.voice = availableVoices[0];
            }
        }

        utterance.onend = () => setIsSpeaking(null);
        setIsSpeaking(msgId);
        window.speechSynthesis.speak(utterance);
    };

    const handleGenerateImage = async (msgId: string, content: string) => {
        const genre = initialConfig.config?.genre || 'cinematic';
        const aiPrompt = await generateImagePrompt(content, genre, lang);
        const url = await requestImageGeneration(aiPrompt);
        if (url) setMessages(prev => prev.map(m => m.id === msgId ? { ...m, imageUrl: url } : m));
    };

    useEffect(() => {
        if (!sessionCode) return;
        let interval = setInterval(async () => {
            const session = await joinCollaborationSession(sessionCode, user.id, user.user_metadata?.username, user.user_metadata?.avatar_url);
            if (session) {
                if (session.host_id === user.id) setIsHost(true);
                if (session.story_data) {
                    const remoteMsgs = session.story_data.messages || [];
                    const remoteParts = session.story_data.participants || [];

                    if (remoteParts.length > 0) {
                        setParticipants(remoteParts);
                        const correctTurn = calculateTurnFromHistory(remoteMsgs.length > 0 ? remoteMsgs : messages, remoteParts);
                        if (currentTurnIndex !== correctTurn) setCurrentTurnIndex(correctTurn);
                    }

                    if (remoteMsgs.length > messages.length) {
                        setMessages(remoteMsgs);
                        onShowToast(t.newTurnReceived, 'info');
                        const last = remoteMsgs[remoteMsgs.length - 1];
                        if (last.role === 'user') setLastAuthorId(last.author_id);

                        const myIndex = remoteParts.findIndex((p: any) => p.id === user.id);
                        const newTurn = calculateTurnFromHistory(remoteMsgs, remoteParts);

                        if (newTurn === myIndex) {
                            generateSuggestions(remoteMsgs, lang).then(setSuggestions);
                        } else {
                            setSuggestions([]);
                        }
                        setTimeout(scrollToBottom, 100);
                    }
                }
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [sessionCode, messages.length, currentTurnIndex]);

    const myTurnIndex = isSpectator ? -1 : participants.findIndex(p => p.id === user?.id);
    const isMyTurn = !isSpectator && (!sessionCode || (participants.length > 0 && currentTurnIndex === myTurnIndex));
    const strictModeBlock = !isSpectator && sessionCode && participants.length > 1 && lastAuthorId === user?.id;

    const getFullPayload = (newMsgs: any[], nextIndex: number) => ({
        ...initialConfig,
        messages: newMsgs,
        participants: participants,
        currentTurnIndex: nextIndex,
        inventory: inventory,
        relationships: relationships,
        config: initialConfig.config,
        title: initialConfig.title,
        updated_at: new Date().toISOString()
    });

    const handleSend = async () => {
        if (!input.trim() || isTyping) return;
        if (!isMyTurn && sessionCode) {
            onShowToast('Ainda não é a tua vez!', 'error');
            return;
        }
        if (strictModeBlock) {
            onShowToast('Já escreveste o último turno. Aguarda por outro autor!', 'error');
            return;
        }

        const msgId = Date.now().toString();
        const userMsg = {
            id: msgId,
            parentId: activeNodeId,
            role: 'user',
            content: input,
            author_id: user.id,
            author_name: user.user_metadata?.username || user.email?.split('@')[0] || 'Autor',
            author_avatar: user.user_metadata?.avatar_url,
            timestamp: new Date().toISOString()
        };

        const newMessages = [...messages, userMsg];
        setMessages(newMessages);
        setActiveNodeId(msgId);
        setInput('');
        setLastAuthorId(user.id);
        setTimeout(scrollToBottom, 100);

        if (sessionCode) {
            const nextIndex = calculateTurnFromHistory(newMessages, participants);
            await updateSessionStory(sessionCode, getFullPayload(newMessages, nextIndex));
            setCurrentTurnIndex(nextIndex);
            const nextPlayer = participants[nextIndex];
            if (nextPlayer && nextPlayer.id !== user.id) {
                notifyTurnByEmail(nextPlayer.id, sessionCode, initialConfig.title);
            }
        } else {
            onAutoSave(newMessages);
        }

        const isNewChapter = /cap[ií]tulo/i.test(input);

        await handleAIStream(input, 'continue', newMessages, msgId, isNewChapter);
    };

    const handleAIStream = async (prompt: string, mode: string, contextMessages = messages, parentId: string | null = activeNodeId, isNewChapter: boolean = false) => {
        setIsTyping(true);
        setSuggestions([]);

        const aiMsgId = `ai-${Date.now()}`;
        let currentAIContent = '';

        setMessages(prev => [...prev, {
            role: 'ai',
            content: '',
            id: aiMsgId,
            parentId: parentId,
            timestamp: new Date().toISOString()
        }]);

        try {
            const stream = await streamAIConversation(contextMessages, prompt, t.aiSystemRole, lang);

            for await (const chunk of stream) {
                currentAIContent += chunk;

                // Extração visual e em tempo real
                let displayContent = currentAIContent;
                if (displayContent.includes('---SUGGESTIONS---')) {
                    displayContent = displayContent.split('---SUGGESTIONS---')[0].trim();
                    // Também limpamos markdown de negrito e listas se a IA vazar formato
                    displayContent = displayContent.replace(/\n\**[1-3]\.\s*\*\*.+/g, '');
                }

                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: displayContent } : m));
            }

            // Sanitização final do conteúdo antes de guardar na BD
            let finalCleanContent = currentAIContent;
            if (finalCleanContent.includes('---SUGGESTIONS---')) {
                finalCleanContent = finalCleanContent.split('---SUGGESTIONS---')[0].trim();
                finalCleanContent = finalCleanContent.replace(/\n\**[1-3]\.\s*\*\*.+/g, '');
            }

            const finalMsgs = [...contextMessages, {
                role: 'ai',
                content: finalCleanContent,
                id: aiMsgId,
                parentId: parentId,
                timestamp: new Date().toISOString()
            }];

            setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: finalCleanContent } : m));
            setActiveNodeId(aiMsgId);

            if (sessionCode) {
                await updateSessionStory(sessionCode, getFullPayload(finalMsgs, currentTurnIndex));
            } else {
                onAutoSave(finalMsgs);
            }

            if (isNewChapter) {
                handleGenerateImage(aiMsgId, currentAIContent);
                onShowToast('A gerar imagem para o novo capítulo...', 'info');
            }

            // Atraso de 3s antes de gerar sugestões para evitar rate limit
            await new Promise(r => setTimeout(r, 3000));
            const suggs = await generateSuggestions(finalMsgs, lang);
            setSuggestions(suggs);
            
            // Extrair inventário e relações apenas a cada 3 respostas da IA (reduz chamadas à API)
            const aiMsgCount = finalMsgs.filter(m => m.role === 'ai').length;
            if (aiMsgCount % 3 === 0) {
                // Atraso adicional para não colidir com as sugestões
                setTimeout(() => {
                    extractStoryState(finalMsgs, lang).then(state => {
                        if (state.inventory.length > 0) setInventory(state.inventory);
                        if (Object.keys(state.relationships).length > 0) setRelationships(state.relationships);
                        
                        if (sessionCode) {
                            updateSessionStory(sessionCode, {
                                ...getFullPayload(finalMsgs, currentTurnIndex),
                                inventory: state.inventory.length > 0 ? state.inventory : inventory,
                                relationships: Object.keys(state.relationships).length > 0 ? state.relationships : relationships
                            });
                        }
                    });
                }, 5000);
            }

        } catch (e: any) {
            console.error(e);
            onShowToast(`${t.connectionError} ${e.message ? `(${e.message})` : ''}`, 'error');
            if (currentAIContent.trim() === '') {
                setMessages(prev => prev.filter(m => m.id !== aiMsgId));
            }
        } finally {
            setIsTyping(false);
        }
    };

    // GERAÇÃO INICIAL MOVIDA PARA DEPOIS DE HANDLEAISTREAM PARA ACESSO À FUNÇÃO
    useEffect(() => {
        if (messages.length === 0 && initialConfig.config) {
            const config = initialConfig.config;
            const chars = config.charProfiles?.map((c: any) => `${c.name} (${c.role})`).join(', ') || t.noName;
            const prompt = t.aiInitialPrompt
                ? t.aiInitialPrompt(config.idea, '', config.genre || '', chars, '', config.charLinks || '')
                : `Saudações, Autor. Iniciamos a redação desta obra de ${config.genre || 'Fantasia'}. CONCEITO: ${config.idea}. ELENCO: ${chars}. RELAÇÕES: ${config.charLinks || ''}. Redige o primeiro capítulo focando na imersão e introdução das personagens.`;

            handleAIStream(prompt, 'continue', [], null, true);
        }
    }, [messages.length]);


    const handleAction = async (actionType: 'ending' | 'definitive') => {
        if (!isMyTurn && sessionCode) return;
        const prompt = actionType === 'ending' ? t.requestEnding : t.requestDefinitiveEnding;
        const hiddenMsg = { role: 'user', content: `[SYSTEM: ${prompt}]`, author_id: 'system', hidden: true };
        const context = [...messages, hiddenMsg];

        if (actionType === 'definitive') {
            onFinalizeBook(messages);
        } else {
            await handleAIStream(prompt, 'ending', context, activeNodeId, true);
        }
    };

    const handleStartCoop = async () => {
        if (sessionCode) {
            setShowParticipants(true);
            return;
        }
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'Autor';
        const avatar = user.user_metadata?.avatar_url;
        try {
            const session = await createCollaborationSession(initialConfig, user.id, username, avatar);
            if (session) {
                onSessionStart(session.code);
                setParticipants(session.story_data.participants);
                setShowParticipants(true);
                onShowToast('Sessão Co-Op Criada!', 'success');
            }
        } catch (e) { console.error(e); }
    };

    const handleRenovateCode = async () => {
        if (!isHost || !sessionCode) return;
        const newSess = await regenerateSessionCode(sessionCode, getFullPayload(messages, currentTurnIndex), user.id);
        if (newSess) {
            onSessionStart(newSess.code);
            onShowToast(t.codeRenovated, 'success');
        }
    };

    const handleNudge = (targetId: string) => {
        if (sessionCode) notifyTurnByEmail(targetId, sessionCode, initialConfig.title);
        onShowToast(t.nudgeSent, 'info');
    };

    // --- SUB-COMPONENTES INTERNOS ---
    const NarrativeTree = () => {
        // Lógica simplificada de árvore linear com ramos para demonstração
        const activeMessages = messages; // Aqui poderíamos filtrar por ramo futuramente
        return (
            <div className="flex flex-col gap-4 p-6 overflow-y-auto h-full">
                <h3 className="text-xl font-black italic mb-4">
                    {lang === 'pt' ? 'Mapa Narrativo' : lang === 'fr' ? 'Carte Narrative' : 'Narrative Map'}
                </h3>
                <div className="relative pl-6 border-l-2 border-indigo-500/20 space-y-6">
                    {activeMessages.map((m, idx) => (
                        <div key={m.id} className={`relative group ${m.id === activeNodeId ? 'scale-105' : 'opacity-60'}`}>
                            <div className={`absolute -left-[31px] w-4 h-4 rounded-full border-2 transition-all ${m.id === activeNodeId ? 'bg-indigo-500 border-white dark:border-[#121214] scale-125 shadow-lg shadow-indigo-500/50' : 'bg-gray-300 dark:bg-gray-700 border-transparent'}`} />
                            <button
                                onClick={() => setActiveNodeId(m.id)}
                                className={`text-left p-3 rounded-xl border transition-all w-full ${m.id === activeNodeId ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-white/50 dark:bg-white/5 border-transparent hover:border-gray-300 dark:hover:border-white/10'}`}
                            >
                                <p className="text-[10px] font-black uppercase opacity-40 mb-1">{m.role === 'ai' ? 'Editor' : m.author_name}</p>
                                <p className="text-xs line-clamp-1">{m.content}</p>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const InventorySidebar = () => (
        <div className={`w-64 border-l border-gray-200 dark:border-white/5 bg-white/30 dark:bg-[#0a0a0c]/30 backdrop-blur-xl transition-all duration-500 overflow-hidden flex flex-col ${zenMode ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
            <div className="p-6 space-y-8">
                <div>
                    <div className="flex items-center gap-2 mb-4 text-indigo-500">
                        <Shield size={18} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">{lang === 'pt' ? 'Inventário' : lang === 'fr' ? 'Inventaire' : 'Inventory'}</h3>
                    </div>
                    {inventory.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                            {inventory.map((item, idx) => (
                                <span key={idx} className="px-3 py-1 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg text-[10px] font-bold shadow-sm">{item}</span>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[10px] italic opacity-40">{lang === 'pt' ? 'Mãos vazias...' : lang === 'fr' ? 'Mains vides...' : 'Empty hands...'}</p>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2 mb-4 text-emerald-500">
                        <Users2 size={18} />
                        <h3 className="text-[10px] font-black uppercase tracking-widest">{lang === 'pt' ? 'Relações' : lang === 'fr' ? 'Relations' : 'Relationships'}</h3>
                    </div>
                    {Object.keys(relationships).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(relationships).map(([name, level]: any) => (
                                <div key={name}>
                                    <div className="flex justify-between text-[9px] font-bold mb-1 uppercase tracking-tighter">
                                        <span>{name}</span>
                                        <span>{level}%</span>
                                    </div>
                                    <div className="h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-emerald-500" style={{ width: `${level}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[10px] italic opacity-40">Nenhuma ligação...</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className={`flex flex-col h-[calc(100vh-140px)] w-full max-w-[95vw] mx-auto bg-white dark:bg-[#121214] rounded-[40px] shadow-2xl overflow-hidden border border-gray-200 dark:border-white/5 animate-in zoom-in-95 duration-500 relative ${zenMode ? 'zen-mode-active' : ''}`}>

            <div className={`h-16 border-b border-gray-200 dark:border-white/5 flex items-center justify-between px-8 bg-white/50 dark:bg-[#121214]/50 backdrop-blur-md z-[110] outline-none shrink-0 transition-all duration-500 ${zenMode ? 'opacity-0 -translate-y-5 pointer-events-none' : 'opacity-100 translate-y-0'}`}>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onExit} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><ChevronLeft className="text-slate-500 dark:text-slate-400" /></button>
                        <button onClick={() => setShowConfig(true)} className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-indigo-500 rounded-xl transition-all"><Info size={20} /></button>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white line-clamp-1 max-w-[200px] md:max-w-md text-sm md:text-base">{initialConfig?.title || 'Story'}</h2>
                        {sessionCode && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500">{isSpectator ? 'Spectator Mode' : 'Live Session'}</span>}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setZenMode(true)}
                        title={lang === 'pt' ? 'Oculta todas as distrações para uma escrita focada' : 'Hides all distractions for focused writing'}
                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-500 rounded-xl transition-all flex items-center gap-2 text-xs font-bold"
                    >
                        <EyeOff size={18} />
                        <span className="hidden md:inline">{lang === 'pt' ? 'Modo Zen' : 'Zen Mode'}</span>
                    </button>
                    <button
                        onClick={() => setShowTree(true)}
                        className="p-2 bg-indigo-600 text-white rounded-xl transition-all shadow-lg shadow-indigo-600/20 hover:scale-105"
                    >
                        <Map size={18} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden relative">

                <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth pb-48 relative">
                    {/* Botão para sair do Modo Zen */}
                    {zenMode && (
                        <button
                            onClick={() => setZenMode(false)}
                            className="fixed top-8 right-8 z-[200] p-4 bg-white/10 backdrop-blur-md rounded-full text-white/50 hover:text-white hover:bg-white/20 transition-all animate-pulse"
                        >
                            <Eye size={24} />
                        </button>
                    )}

                    {messages.map((msg, i) => {
                        const isAI = msg.role === 'ai';
                        const isMe = msg.author_id === user.id;
                        const style = !isAI ? getAuthorStyle(msg.author_id) : null;

                        if (msg.hidden) return null;

                        return (
                            <div key={msg.id || i} className={`flex gap-4 ${isMe ? 'flex-row-reverse' : ''} animate-writing`}>
                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 ${isAI ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' : `${style?.bg} ${style?.border}`}`}>
                                    {isAI ? <Sparkles className="text-white" size={16} /> : (
                                        msg.author_avatar ? <img src={msg.author_avatar} className="w-full h-full object-cover" /> : <span className="font-bold text-xs">{msg.author_name?.[0]}</span>
                                    )}
                                </div>
                                <div className={`max-w-[85%] md:max-w-[80%] ${isAI ? 'w-full' : ''}`}>
                                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isAI ? 'Editor IA' : msg.author_name}</span>
                                    </div>

                                    <div className="relative group">
                                        <div className={`prose dark:prose-invert text-justify ${isAI ? `max-w-none leading-relaxed font-serif text-gray-800 dark:text-slate-300 ${fontSizes[fontSizeIndex]}` : `bg-white dark:bg-[#1a1a1c] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm text-sm ${isMe ? 'rounded-tr-sm bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}`}>

                                            {isAI && msg.imageUrl && (
                                                <div className="story-image-container mb-6 animate-in fade-in zoom-in-95 duration-700 overflow-hidden rounded-2xl">
                                                    <img
                                                        src={msg.imageUrl}
                                                        className="w-full h-auto object-cover max-h-[400px]"
                                                        alt="Ilustração da cena"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                        onLoad={(e) => { (e.target as HTMLImageElement).style.display = 'block'; }}
                                                        style={{ display: 'block' }}
                                                    />
                                                </div>
                                            )}

                                            {isAI ? renderNarrativeWithBreaks(msg.content) : msg.content}
                                            {isAI && i === messages.length - 1 && isTyping && <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse"></span>}
                                        </div>

                                        {isAI && !isTyping && (
                                            <div className="absolute top-0 -right-12 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleTTS(msg.content, msg.id)}
                                                    className={`p-2 rounded-lg transition-all ${isSpeaking === msg.id ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-500 shadow-sm border border-gray-100 dark:border-white/10'}`}
                                                >
                                                    {isSpeaking === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                </button>
                                                {!msg.imageUrl && (
                                                    <button
                                                        onClick={() => handleGenerateImage(msg.id, msg.content)}
                                                        className="p-2 bg-white dark:bg-white/5 text-slate-400 hover:text-indigo-500 rounded-lg shadow-sm border border-gray-100 dark:border-white/10 transition-all"
                                                    >
                                                        <Sparkles size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                    <div ref={messagesEndRef} />
                </div>

                <InventorySidebar />

                <div className={`w-16 md:w-20 border-l border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#121214]/50 flex flex-col items-center py-6 gap-6 z-10 transition-all duration-500 ${zenMode ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>

                    <div className="flex flex-col items-center gap-2">
                        <button onClick={() => handleFontSizeChange(true)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-500 border border-gray-200 dark:border-white/5 shadow-sm"><Plus size={16} /></button>
                        <span className="text-[10px] font-black text-slate-400"><Type size={14} /></span>
                        <button onClick={() => handleFontSizeChange(false)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-500 border border-gray-200 dark:border-white/5 shadow-sm"><Minus size={16} /></button>
                    </div>

                    <div className="w-8 h-px bg-gray-200 dark:bg-white/10"></div>

                    <div className="flex flex-col items-center gap-2">
                        {sessionCode ? (
                            <button
                                onClick={() => setShowParticipants(true)}
                                className="w-10 h-10 flex items-center justify-center bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all relative"
                                title={t.turnParticipants}
                            >
                                <Users2 size={18} />
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#121214]">{participants.length}</span>
                            </button>
                        ) : (
                            <button onClick={handleStartCoop} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-white/5 text-slate-500 hover:text-indigo-500 rounded-xl transition-all border border-gray-200 dark:border-white/5 hover:border-indigo-200 shadow-sm" title={t.startLiveSession}>
                                <Wifi size={18} />
                            </button>
                        )}
                    </div>

                    <div className="w-8 h-px bg-gray-200 dark:bg-white/10"></div>

                    <div className="flex flex-col items-center gap-3">
                        <button onClick={() => handleAction('ending')} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-200 dark:border-white/5 shadow-sm" title={t.requestEnding}>
                            <PenTool size={18} />
                        </button>
                        <button onClick={() => handleAction('definitive')} className="w-10 h-10 flex items-center justify-center bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 rounded-xl transition-all border border-emerald-200 dark:border-emerald-500/20 shadow-sm" title={t.requestDefinitiveEnding}>
                            <CheckCircle size={18} />
                        </button>
                    </div>

                </div>
            </div>

            <div className={`bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 p-4 md:p-6 z-20 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ${zenMode ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>

                {!isTyping && suggestions.length > 0 && !writeOwn && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => { setInput(s); setWriteOwn(true); }}
                                className="w-full text-left px-4 py-3 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-sm flex items-center group h-auto min-h-[3rem]"
                            >
                                <span className="line-clamp-3 w-full group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-relaxed">{s}</span>
                            </button>
                        ))}
                        <button
                            onClick={() => { setInput(''); setWriteOwn(true); }}
                            className="w-full text-center px-4 py-3 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all shadow-sm flex items-center justify-center gap-2 h-auto min-h-[3rem]"
                        >
                            <PenTool size={16} />
                            {lang === 'pt' ? 'Escrever eu próprio' : lang === 'fr' ? 'Écrire moi-même' : 'Write my own'}
                        </button>
                    </div>
                )}

                {!isSpectator ? (
                    (strictModeBlock || (sessionCode && !isMyTurn)) ? (
                        <div className="flex items-center justify-center p-4 bg-slate-50 dark:bg-white/[0.02] rounded-2xl border border-dashed border-slate-200 dark:border-white/5 text-slate-500 gap-4 animate-pulse">
                            {strictModeBlock ? (
                                <>
                                    <Lock size={20} className="text-slate-400" />
                                    <span className="text-xs font-black uppercase tracking-widest">Turno Completo</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white dark:border-[#121214] shadow-sm">
                                            {participants[currentTurnIndex]?.avatar ? (
                                                <img src={participants[currentTurnIndex].avatar} alt={participants[currentTurnIndex].name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-sm">
                                                    {participants[currentTurnIndex]?.name?.substring(0, 1)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">
                                                {lang === 'pt' ? 'A Aguardar' : lang === 'fr' ? 'En attente' : 'Waiting'}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {lang === 'pt' ? 'Turno de' : lang === 'fr' ? 'Tour de' : 'Turn of'} {participants[currentTurnIndex]?.name}
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className={`flex gap-2 relative ${(!writeOwn && suggestions.length > 0) ? 'hidden' : ''}`}>
                            {suggestions.length > 0 && writeOwn && (
                                <button
                                    onClick={() => { setWriteOwn(false); setInput(''); }}
                                    className="bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-500 hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl px-3 flex items-center justify-center transition-all"
                                    title="Voltar às opções"
                                >
                                    <X size={16} />
                                </button>
                            )}
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                placeholder={isTyping ? (lang === 'pt' ? 'O Editor está a escrever...' : lang === 'fr' ? 'L\'Éditeur écrit...' : 'The Editor is writing...') : (lang === 'pt' ? 'Escreve a continuação...' : lang === 'fr' ? 'Écrivez la suite...' : 'Write the continuation...')}
                                disabled={isTyping}
                                className="flex-1 bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/10 rounded-2xl px-4 py-3 pr-12 text-gray-900 dark:text-white text-sm outline-none focus:ring-2 ring-indigo-500/20 resize-none h-12 max-h-32 transition-all disabled:opacity-50"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!input.trim() || isTyping}
                                className="absolute right-1 top-1 bottom-1 w-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                {isTyping ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                            </button>
                        </div>
                    )
                ) : (
                    <div className="flex items-center justify-center p-4 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl border border-dashed border-indigo-200 dark:border-indigo-500/20 text-indigo-500 gap-4">
                        <Wifi size={20} className="animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest">
                            {lang === 'pt' ? 'Modo Espectador: Apenas Leitura' : lang === 'fr' ? 'Mode Spectateur : Lecture Seule' : 'Spectator Mode: Read Only'}
                        </span>
                    </div>
                )}
            </div>

            {/* Config Modal */}
            {showConfig && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in">
                    <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-md rounded-[40px] shadow-2xl p-8 space-y-6 animate-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white italic">
                                {lang === 'pt' ? 'Configuração' : lang === 'fr' ? 'Configuration' : 'Configuration'}
                            </h3>
                            <button onClick={() => setShowConfig(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">
                                    {lang === 'pt' ? 'Ideia Base' : lang === 'fr' ? 'Idée de Base' : 'Base Idea'}
                                </label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">{initialConfig?.config?.idea || initialConfig?.idea}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">
                                        {lang === 'pt' ? 'Género' : lang === 'fr' ? 'Genre' : 'Genre'}
                                    </label>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                                        {(initialConfig?.config?.genre || (lang === 'pt' ? 'Vários' : lang === 'fr' ? 'Divers' : 'Various')).replace(/_/g, ' ')}
                                    </p>
                                </div>
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">
                                        {lang === 'pt' ? 'Público' : lang === 'fr' ? 'Public' : 'Audience'}
                                    </label>
                                    <p className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                                        {initialConfig?.config?.audience || (lang === 'pt' ? 'Geral' : lang === 'fr' ? 'Général' : 'General')}
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1 block">
                                    {lang === 'pt' ? 'Personagens' : lang === 'fr' ? 'Personnages' : 'Characters'}
                                </label>
                                <p className="text-sm font-medium text-gray-900 dark:text-white leading-relaxed">
                                    {initialConfig?.config?.characters || (lang === 'pt' ? 'Vários' : lang === 'fr' ? 'Divers' : 'Various')}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setShowConfig(false)} className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/20">
                            {lang === 'pt' ? 'Fechar' : lang === 'fr' ? 'Fermer' : 'Close'}
                        </button>
                    </div>
                </div>
            )}

            {showTree && (
                <div className="absolute inset-0 z-[160] flex items-end justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-2xl h-[80%] rounded-t-[40px] shadow-2xl flex flex-col animate-in slide-in-from-bottom-5 duration-500">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5">
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white italic">
                                {lang === 'pt' ? 'Caminhos da História' : lang === 'fr' ? 'Chemins de l\'Histoire' : 'Story Paths'}
                            </h3>
                            <button onClick={() => setShowTree(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
                        </div>
                        <NarrativeTree />
                    </div>
                </div>
            )}


            <ParticipantsModal
                t={t}
                isOpen={showParticipants}
                onClose={() => setShowParticipants(false)}
                sessionCode={sessionCode}
                participants={participants}
                currentUserId={user.id}
                isHost={isHost}
                currentTurnIndex={currentTurnIndex}
                onNudge={handleNudge}
                onRenovate={handleRenovateCode}
            />
        </div>
    );
};
