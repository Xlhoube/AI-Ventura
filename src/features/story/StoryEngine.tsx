import React, { useState, useEffect, useRef } from 'react';
import {
    ChevronLeft, Sparkles, Loader2, Send, Wifi, Lock, PenTool, CheckCircle, Plus, Minus, Type, Users2, HelpCircle, Info, X, Map, Volume2, VolumeX, Eye, EyeOff, Trash2, BookOpen, ScrollText, RotateCw
} from 'lucide-react';
import { requestImageGeneration, streamAIConversation, generateSuggestions, generateDynamicSummary, generateImagePrompt } from '@/services/ai';
import { ConfirmModal, ParticipantsModal, EndingOptionsModal } from '@/components';
import { updateSessionStory, joinCollaborationSession, createCollaborationSession, updateSessionPhase, regenerateSessionCode, getProfileSettings, updateProfileSettings, getSpectatorSession } from '@/services/services';
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
    const [showEndingModal, setShowEndingModal] = useState(false);
    const [currentTurnIndex, setCurrentTurnIndex] = useState(initialConfig?.currentTurnIndex || 0);
    const [isHost, setIsHost] = useState(false);

    // Novos estados para extensões
    const [zenMode, setZenMode] = useState(false);
    const [showTree, setShowTree] = useState(false);
    const [dynamicSummary, setDynamicSummary] = useState<string>(initialConfig?.dynamicSummary || initialConfig?.idea || '');
    const [isSummaryUpdating, setIsSummaryUpdating] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<string | null>(null);

    // Estados para Edição de Palavras / Substituição
    const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string, messageId: string, paragraphIndex: number, wordIndex: number } | null>(null);
    const [newWordValue, setNewWordValue] = useState('');

    // Estado para Abas de Capítulos
    const [activeChapterIndex, setActiveChapterIndex] = useState<number>(-1);

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

            // 1. First priority: Microsoft voices (requested by user)
            let premiumVoice = availableVoices.find(v => v.name.includes('Microsoft'));
            
            // 2. Second priority: Other high quality voices
            if (!premiumVoice) {
                premiumVoice = availableVoices.find(v =>
                    v.name.includes('Google') ||
                    v.name.includes('Natural') ||
                    v.name.includes('Neural') ||
                    v.name.includes('Online')
                );
            }

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
    const isCloudSolo = initialConfig?.storageType === 'cloud' || participants.length <= 1;
    const isMyTurn = !isSpectator && (!sessionCode || isCloudSolo || (participants.length > 0 && currentTurnIndex === myTurnIndex));
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
            // TODO: Notificação de turno via Appwrite Functions (por implementar)
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
                if (/[-*]*SUGGESTIONS[-*]*/i.test(displayContent)) {
                    displayContent = displayContent.split(/[-*]*SUGGESTIONS[-*]*/i)[0].trim();
                    // Também limpamos markdown de negrito e listas se a IA vazar formato
                    displayContent = displayContent.replace(/\n\**[1-3]\.\s*\*\*.+/g, '');
                }

                setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: displayContent } : m));
            }

            // Sanitização final do conteúdo antes de guardar na BD
            let finalCleanContent = currentAIContent;
            if (/[-*]*SUGGESTIONS[-*]*/i.test(finalCleanContent)) {
                finalCleanContent = finalCleanContent.split(/[-*]*SUGGESTIONS[-*]*/i)[0].trim();
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
            } else if (initialConfig.config?.autoGenerateImages) {
                handleGenerateImage(aiMsgId, currentAIContent);
            }

            // Atraso de 3s antes de gerar sugestões para evitar rate limit
            await new Promise(r => setTimeout(r, 3000));
            const suggs = await generateSuggestions(finalMsgs, lang);
            setSuggestions(suggs);
            
            // Atualizar o resumo dinâmico na 1ª mensagem de IA e a cada 2 respostas
            const aiMsgCount = finalMsgs.filter(m => m.role === 'ai').length;
            if (aiMsgCount === 1 || aiMsgCount % 2 === 0) {
                setTimeout(() => {
                    setIsSummaryUpdating(true);
                    generateDynamicSummary(finalMsgs, lang).then(summary => {
                        if (summary) {
                            setDynamicSummary(summary);
                            if (sessionCode) {
                                updateSessionStory(sessionCode, {
                                    ...getFullPayload(finalMsgs, currentTurnIndex),
                                    dynamicSummary: summary
                                });
                            }
                        }
                    }).finally(() => {
                        setIsSummaryUpdating(false);
                    });
                }, 4000);
            }

            // Se for o desfecho definitivo, transita automaticamente para a finalização e polimento da obra
            if (mode === 'definitive_ending') {
                onShowToast(lang === 'pt' ? 'Capítulo final redigido! A preparar a edição...' : 'Final chapter completed! Preparing manuscript...', 'success');
                setTimeout(() => {
                    onFinalizeBook(finalMsgs);
                }, 1800);
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

    const handleConfirmEndingChoice = async (choice: { title: string; description: string; isCustom: boolean }) => {
        setShowEndingModal(false);
        onShowToast(lang === 'pt' ? 'O Editor está a redigir o grande desfecho da obra...' : 'Writing the grand finale...', 'info');

        const endingInstruction = `Escreve o grande capítulo final e conclusão definitiva desta obra com base no seguinte desfecho:\n\nTÍTULO DO DESFECHO: ${choice.title}\nDIRETRIZ DE CONCLUSÃO: ${choice.description}\n\nREGRAS CRÍTICAS:\n1. Conclui todos os arcos dramáticos, encerra a jornada dos protagonistas e entrega um final arrebatador.\n2. Não deixes ganchos ou mistérios por resolver.\n3. Escreve ESTRITAMENTE em Português de Portugal (PT-PT estrito, sem gerúndios, usando 'num/numa' e artigos antes dos possessivos).`;

        const hiddenMsg = { role: 'user', content: `[DESFECHO ESCOLHIDO: ${choice.title}]`, author_id: 'system', hidden: true };
        const context = [...messages, hiddenMsg];

        await handleAIStream(endingInstruction, 'definitive_ending', context, activeNodeId, false);
    };

    // GERAÇÃO INICIAL MOVIDA PARA DEPOIS DE HANDLEAISTREAM PARA ACESSO À FUNÇÃO
    useEffect(() => {
        if (messages.length === 0 && initialConfig.config) {
            const config = initialConfig.config;
            const chars = config.charProfiles?.map((c: any) => `${c.name} (${c.role})`).join(', ') || t.noName;
            const prompt = t.aiInitialPrompt
                ? t.aiInitialPrompt(config.idea, '', config.genre || '', chars, '', config.charLinks || '')
                : `Iniciamos a redação desta obra de ${config.genre || 'Fantasia'}. CONCEITO: ${config.idea}. ELENCO: ${chars}. RELAÇÕES: ${config.charLinks || ''}. Redige o primeiro capítulo com foco na imersão e introdução das personagens em Português de Portugal (PT-PT estrito, sem gerúndios).`;

            handleAIStream(prompt, 'continue', [], null, true);
        }
    }, [messages.length]);


    const handleAction = async (actionType: 'ending' | 'definitive') => {
        if (!isMyTurn && sessionCode) return;
        const prompt = actionType === 'ending' ? t.requestEnding : t.requestDefinitiveEnding;
        const hiddenMsg = { role: 'user', content: `[SYSTEM: ${prompt}]`, author_id: 'system', hidden: true };
        const context = [...messages, hiddenMsg];

        if (actionType === 'definitive') {
            const definitivePrompt = t.definitivePrompt || 'Escreve o texto de fecho da obra. Prepara o cenário para os momentos finais.';
            await handleAIStream(definitivePrompt, 'ending', context, activeNodeId, false);
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
        // TODO: Notificação de turno via Appwrite Functions (por implementar)
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

    const handleManualRefreshSummary = async () => {
        if (messages.length === 0 || isSummaryUpdating) return;
        setIsSummaryUpdating(true);
        try {
            const summary = await generateDynamicSummary(messages, lang);
            if (summary) {
                setDynamicSummary(summary);
                if (sessionCode) {
                    updateSessionStory(sessionCode, {
                        ...getFullPayload(messages, currentTurnIndex),
                        dynamicSummary: summary
                    });
                }
                onShowToast(lang === 'pt' ? 'Resumo atualizado com sucesso!' : 'Summary updated successfully!', 'success');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSummaryUpdating(false);
        }
    };

    const StorySummarySidebar = () => {
        const totalWordCount = messages
            .filter(m => m.role === 'ai' && m.content)
            .reduce((acc, m) => acc + m.content.trim().split(/\s+/).filter(Boolean).length, 0);

        const chapterCount = messages.filter(m => /cap[ií]tulo/i.test(m.content) || m.imageUrl).length || 1;

        return (
            <div className={`w-72 md:w-80 shrink-0 border-l border-gray-200 dark:border-white/5 bg-white/40 dark:bg-[#0a0a0c]/40 backdrop-blur-2xl transition-all duration-500 overflow-hidden flex flex-col justify-between ${zenMode ? 'opacity-0 translate-x-10 pointer-events-none' : 'opacity-100 translate-x-0'}`}>
                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400">
                            <ScrollText size={18} />
                            <h3 className="text-[10px] font-black uppercase tracking-widest">
                                {lang === 'pt' ? 'Resumo Dinâmico' : lang === 'fr' ? 'Résumé Dynamique' : 'Dynamic Summary'}
                            </h3>
                        </div>
                        <button
                            onClick={handleManualRefreshSummary}
                            disabled={isSummaryUpdating || messages.length === 0}
                            className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-slate-400 hover:text-indigo-500 rounded-lg transition-all disabled:opacity-40"
                            title={lang === 'pt' ? 'Atualizar Resumo com IA' : 'Refresh Summary with AI'}
                        >
                            <RotateCw size={14} className={isSummaryUpdating ? "animate-spin text-indigo-500" : ""} />
                        </button>
                    </div>

                    <div className="relative">
                        {isSummaryUpdating && (
                            <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm rounded-2xl flex items-center justify-center gap-2 z-10 animate-in fade-in">
                                <Loader2 size={16} className="animate-spin text-indigo-500" />
                                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                                    {lang === 'pt' ? 'A sintetizar...' : 'Summarizing...'}
                                </span>
                            </div>
                        )}

                        <div className="p-4 bg-white/70 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 rounded-2xl shadow-sm space-y-3">
                            <div className="flex items-center gap-1.5 text-indigo-500">
                                <Sparkles size={13} />
                                <span className="text-[9px] font-black uppercase tracking-widest">
                                    {lang === 'pt' ? 'Estado Atual da Trama' : 'Plot Living State'}
                                </span>
                            </div>

                            {dynamicSummary ? (
                                <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 font-serif italic selection:bg-indigo-500/20">
                                    "{dynamicSummary}"
                                </p>
                            ) : (
                                <div className="space-y-2 py-2 text-center">
                                    <BookOpen size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
                                    <p className="text-xs text-slate-400 italic">
                                        {initialConfig?.idea ? `"${initialConfig.idea}"` : (lang === 'pt' ? 'O resumo atualizar-se-á à medida que a narrativa avança...' : 'The summary will update as the story progresses...')}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cartão de Contexto e Personagens Principais */}
                    {initialConfig?.charProfiles && initialConfig.charProfiles.length > 0 && (
                        <div className="p-4 bg-gray-50/50 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl space-y-2">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block">
                                {lang === 'pt' ? 'Protagonistas Ativos' : 'Active Cast'}
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                                {initialConfig.charProfiles.map((char: any, cIdx: number) => (
                                    <span key={cIdx} className="text-[10px] font-semibold bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300">
                                        {char.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Métricas e Estatísticas Rápidas da Obra no Rodapé da Barra */}
                <div className="p-4 border-t border-gray-200/70 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">{lang === 'pt' ? 'Capítulos' : 'Chapters'}</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">{chapterCount}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">{lang === 'pt' ? 'Palavras' : 'Words'}</span>
                        <span className="text-xs font-bold text-indigo-500 dark:text-indigo-400">{totalWordCount}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                        <span className="block text-[8px] font-black uppercase tracking-widest text-slate-400">{lang === 'pt' ? 'Turnos' : 'Turns'}</span>
                        <span className="text-xs font-bold text-emerald-500">{messages.length}</span>
                    </div>
                </div>
            </div>
        );
    };

    const getWordRegex = (word: string) => {
        const escaped = word.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        return new RegExp(`(?<=^|[^\\wÀ-ú-])${escaped}(?=[^\\wÀ-ú-]|$)`, 'g');
    };

    const getWordOccurrencesCount = (targetWord: string) => {
        if (!targetWord) return 0;
        const regex = getWordRegex(targetWord);
        let count = 0;
        messages.forEach((m: any) => {
            if (m.content) {
                const matches = m.content.match(regex);
                if (matches) count += matches.length;
            }
        });
        return count;
    };

    const handleReplaceWord = async (replaceAll: boolean = true) => {
        if (!selectedWordInfo || !newWordValue.trim() || newWordValue.trim() === selectedWordInfo.word) {
            setSelectedWordInfo(null);
            return;
        }

        const regex = getWordRegex(selectedWordInfo.word);
        const replacement = newWordValue.trim();
        let totalReplaced = 0;

        const updatedMessages = messages.map((m: any) => {
            if (!m.content) return m;
            if (replaceAll) {
                const matches = m.content.match(regex);
                if (matches) totalReplaced += matches.length;
                return {
                    ...m,
                    content: m.content.replace(regex, replacement)
                };
            } else if (m.id === selectedWordInfo.messageId) {
                let replaced = false;
                const newContent = m.content.replace(regex, (match: string) => {
                    if (!replaced) {
                        replaced = true;
                        totalReplaced++;
                        return replacement;
                    }
                    return match;
                });
                return { ...m, content: newContent };
            }
            return m;
        });

        setMessages(updatedMessages);

        if (sessionCode) {
            await updateSessionStory(sessionCode, getFullPayload(updatedMessages, currentTurnIndex));
        } else {
            onAutoSave(updatedMessages);
        }

        const toastMsg = replaceAll
            ? (lang === 'pt' 
                ? `${totalReplaced} ocorrência(s) de "${selectedWordInfo.word}" substituída(s) em toda a obra!` 
                : `${totalReplaced} occurrence(s) of "${selectedWordInfo.word}" replaced across the entire story!`)
            : (lang === 'pt' ? 'Palavra atualizada com sucesso!' : 'Word updated successfully!');

        onShowToast(toastMsg, 'success');
        setSelectedWordInfo(null);
    };

    return (
        <div className={`flex flex-col bg-white dark:bg-[#121214] overflow-hidden animate-in zoom-in-95 duration-500 relative ${zenMode ? 'fixed inset-0 z-[500] w-full h-full rounded-none border-none max-w-none' : 'h-[calc(100vh-140px)] w-full max-w-[95vw] mx-auto rounded-[40px] shadow-2xl border border-gray-200 dark:border-white/5'}`}>

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

                <div className={`w-20 md:w-24 shrink-0 border-r border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#121214]/50 flex flex-col items-center py-6 gap-6 z-[600] transition-all duration-500 overflow-y-auto custom-scrollbar ${zenMode ? 'fixed left-0 top-0 bottom-0 h-full border-r border-white/10 bg-slate-900/80 dark:bg-black/80 backdrop-blur-xl' : 'relative'}`}>

                    <div className="flex flex-col items-center gap-2 w-full px-2 mt-4">
                        <button onClick={() => handleFontSizeChange(true)} className={`w-full h-10 flex items-center justify-center rounded-xl transition-all shadow-sm text-xs font-black border ${zenMode ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' : 'bg-white dark:bg-white/5 text-slate-500 hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-white/5'}`}>A+</button>
                        <button onClick={() => handleFontSizeChange(false)} className={`w-full h-10 flex items-center justify-center rounded-xl transition-all shadow-sm text-xs font-black border ${zenMode ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' : 'bg-white dark:bg-white/5 text-slate-500 hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-white/5'}`}>A-</button>
                    </div>

                    <div className="w-8 h-px bg-gray-200 dark:bg-white/10 shrink-0"></div>

                    <div className="flex flex-col items-center gap-2 w-full px-2">
                        {sessionCode ? (
                            <button
                                onClick={() => setShowParticipants(true)}
                                className={`w-full h-10 flex items-center justify-center rounded-xl transition-all relative border ${zenMode ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/40' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-100 dark:hover:bg-indigo-500/20'}`}
                                title={t.turnParticipants}
                            >
                                <span className="text-[10px] font-black uppercase">{lang === 'pt' ? 'Autores' : 'Authors'}</span>
                                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white text-[8px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-[#121214]">{participants.length}</span>
                            </button>
                        ) : (
                            <button onClick={handleStartCoop} className={`w-full h-10 flex items-center justify-center rounded-xl transition-all shadow-sm border ${zenMode ? 'bg-white/10 text-white hover:text-indigo-300 border-white/10 hover:bg-white/20' : 'bg-white dark:bg-white/5 text-slate-500 hover:text-indigo-500 border-gray-200 dark:border-white/5 hover:border-indigo-200'}`} title={t.startLiveSession}>
                                <span className="text-[10px] font-black uppercase">Co-Op</span>
                            </button>
                        )}
                    </div>

                    <div className="w-8 h-px bg-gray-200 dark:bg-white/10 shrink-0"></div>

                    <div className="flex flex-col items-center gap-3 w-full px-2">
                        <button onClick={() => handleAction('ending')} className={`w-full h-10 flex items-center justify-center rounded-xl transition-all shadow-sm border ${zenMode ? 'bg-white/10 text-white border-white/10 hover:bg-white/20' : 'bg-white dark:bg-white/5 text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 border-gray-200 dark:border-white/5'}`} title={t.requestEnding}>
                            <span className="text-[9px] font-black uppercase text-center leading-none">{lang === 'pt' ? 'Fechar\nCapítulo' : 'Close\nChapter'}</span>
                        </button>
                        <button onClick={() => setShowEndingModal(true)} className={`w-full h-10 flex items-center justify-center rounded-xl transition-all shadow-sm border ${zenMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30 hover:bg-purple-500/40' : 'bg-purple-50 dark:bg-purple-500/10 text-purple-600 hover:bg-purple-100 dark:hover:bg-purple-500/20 border-purple-200 dark:border-purple-500/20'}`} title={t.exportBook}>
                            <span className="text-[9px] font-black uppercase text-center leading-none">{lang === 'pt' ? 'Finalizar\nObra' : 'Finalize\nBook'}</span>
                        </button>
                    </div>

                </div>

                <div ref={scrollContainerRef} className={`flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth pb-48 relative ${zenMode ? 'pl-24 md:pl-32' : ''}`}>
                    {/* Botão para sair do Modo Zen */}
                    {zenMode && (
                        <button
                            onClick={() => setZenMode(false)}
                            className="fixed bottom-8 right-8 z-[600] px-6 py-4 bg-slate-900/80 dark:bg-white/20 backdrop-blur-xl rounded-full text-white hover:bg-slate-900 dark:hover:bg-white/30 transition-all shadow-2xl border border-white/10 flex items-center gap-3"
                        >
                            <Eye size={24} />
                            <span className="text-xs font-black tracking-widest uppercase">{lang === 'pt' ? 'Sair do Zen' : 'Exit Zen'}</span>
                        </button>
                    )}

                    {/* Tabs Dinâmicas de Capítulos */}
                    {!zenMode && (
                        (() => {
                            // Separar mensagens em blocos de capítulos baseados no padrão "Capítulo" ou quebra explícita
                            const chaptersList: any[][] = [[]];
                            messages.forEach((msg) => {
                                const isNewChapter = msg.role === 'user' && /cap[ií]tulo/i.test(msg.content);
                                if (isNewChapter && chaptersList[chaptersList.length - 1].length > 0) {
                                    chaptersList.push([msg]);
                                } else {
                                    chaptersList[chaptersList.length - 1].push(msg);
                                }
                            });

                            if (chaptersList.length > 1) {
                                return (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 border-b border-gray-100 dark:border-white/5 sticky top-0 bg-white/95 dark:bg-[#121214]/95 backdrop-blur-md z-40 pr-2 scrollbar-none">
                                        <button 
                                            onClick={() => setActiveChapterIndex(-1)} 
                                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap border transition-all ${activeChapterIndex === -1 ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' : 'bg-gray-50 dark:bg-white/5 text-slate-500 border-gray-200 dark:border-white/5'}`}
                                        >
                                            {lang === 'pt' ? 'Ver Tudo' : 'View All'}
                                        </button>
                                        {chaptersList.map((_, idx) => (
                                            <button 
                                                key={idx}
                                                onClick={() => setActiveChapterIndex(idx)} 
                                                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap border transition-all ${activeChapterIndex === idx ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-600/10' : 'bg-gray-50 dark:bg-white/5 text-slate-500 border-gray-200 dark:border-white/5'}`}
                                            >
                                                {lang === 'pt' ? `Capítulo ${idx + 1}` : `Chapter ${idx + 1}`}
                                            </button>
                                        ))}
                                    </div>
                                );
                            }
                            return null;
                        })()
                    )}

                    {(() => {
                        // Filtrar mensagens de acordo com a tab ativa
                        let displayedMessages = messages;
                        if (activeChapterIndex !== -1) {
                            const chaptersList: any[][] = [[]];
                            messages.forEach((msg) => {
                                const isNewChapter = msg.role === 'user' && /cap[ií]tulo/i.test(msg.content);
                                if (isNewChapter && chaptersList[chaptersList.length - 1].length > 0) {
                                    chaptersList.push([msg]);
                                } else {
                                    chaptersList[chaptersList.length - 1].push(msg);
                                }
                            });
                            displayedMessages = chaptersList[activeChapterIndex] || messages;
                        }

                        return (
                            <div className={`transition-all duration-700 mx-auto w-full ${zenMode ? 'max-w-3xl' : ''}`}>
                                {displayedMessages.map((msg, i) => {
                                    const isAI = msg.role === 'ai';
                                    const isMe = msg.author_id === user.id;
                                    const style = !isAI ? getAuthorStyle(msg.author_id) : null;

                                    if (msg.hidden) return null;

                                    return (
                                        <div key={msg.id || i} className={`flex gap-4 mb-8 ${isMe ? 'flex-row-reverse' : ''} animate-writing ${zenMode && !isAI ? 'justify-center' : ''}`}>
                                            {!zenMode && (
                                                <div className={`w-8 h-8 md:w-10 md:h-10 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden border-2 ${isAI ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' : `${style?.bg} ${style?.border}`}`}>
                                                    {isAI ? <Sparkles className="text-white" size={16} /> : (
                                                        msg.author_avatar ? <img src={msg.author_avatar} className="w-full h-full object-cover" /> : <span className="font-bold text-xs">{msg.author_name?.[0]}</span>
                                                    )}
                                                </div>
                                            )}
                                            <div className={`${zenMode ? 'w-full max-w-full' : 'max-w-[85%] md:max-w-[80%]'} ${isAI ? 'w-full' : ''}`}>
                                                {!zenMode && (
                                                    <div className={`flex items-center gap-2 mb-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{isAI ? 'Editor IA' : msg.author_name}</span>
                                                    </div>
                                                )}

                                                <div className="relative group">
                                                    <div className={`prose dark:prose-invert text-justify ${isAI ? `max-w-none leading-relaxed font-serif text-gray-800 dark:text-slate-300 ${fontSizes[fontSizeIndex]}` : `bg-white dark:bg-[#1a1a1c] p-4 rounded-2xl border border-gray-200 dark:border-white/5 shadow-sm text-sm ${isMe ? 'rounded-tr-sm bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}`}>

                                                        {isAI && msg.imageUrl && (
                                                            <div className="story-image-container mb-6 animate-in fade-in zoom-in-95 duration-700 overflow-hidden rounded-2xl flex justify-center">
                                                                <img src={msg.imageUrl} alt="Cena da história" className="w-full max-w-3xl h-auto object-cover hover:scale-105 transition-transform duration-700 rounded-2xl shadow-lg" />
                                                            </div>
                                                        )}

                                                        {msg.content ? msg.content.split('\n').map((paragraph, pIdx) => (
                                                            <p key={pIdx} className="mb-4">
                                                                {paragraph.split(' ').map((word, wIdx) => {
                                                                    const cleanWord = word.replace(/[^\wÀ-ú-]/g, '');
                                                                    if (!cleanWord || !isAI) return <span key={wIdx}>{word} </span>;
                                                                    
                                                                    return (
                                                                        <span 
                                                                            key={wIdx}
                                                                            onClick={() => {
                                                                                if (!zenMode) {
                                                                                    setSelectedWordInfo({
                                                                                        word: cleanWord,
                                                                                        messageId: msg.id,
                                                                                        paragraphIndex: pIdx,
                                                                                        wordIndex: wIdx
                                                                                    });
                                                                                    setNewWordValue(cleanWord);
                                                                                }
                                                                            }}
                                                                            className={`${!zenMode ? 'cursor-pointer hover:bg-indigo-500/20 hover:text-indigo-400 rounded px-0.5 transition-all' : ''} inline`}
                                                                            title={!zenMode ? (lang === 'pt' ? 'Clicar para modificar palavra' : 'Click to modify word') : ''}
                                                                        >
                                                                            {word}{' '}
                                                                        </span>
                                                                    );
                                                                })}
                                                            </p>
                                                        )) : null}
                                                        {isAI && i === displayedMessages.length - 1 && isTyping && <span className="inline-block w-2 h-4 bg-indigo-500 ml-1 animate-pulse"></span>}
                                                    </div>

                                                    {isAI && !isTyping && !zenMode && (
                                                        <div className="mt-6 flex flex-wrap items-center gap-2 border-t border-gray-200/50 dark:border-white/5 pt-4">
                                                            <button
                                                                onClick={() => handleTTS(msg.content, msg.id)}
                                                                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 shadow-sm border ${isSpeaking === msg.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-slate-500 hover:text-indigo-500 hover:border-indigo-200 dark:hover:border-indigo-500/30'}`}
                                                                title={lang === 'pt' ? 'Ouvir/Parar texto' : 'Listen/Stop text'}
                                                            >
                                                                {isSpeaking === msg.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                                                                <span className="text-[10px] font-black uppercase tracking-widest">{isSpeaking === msg.id ? (lang === 'pt' ? 'Parar' : 'Stop') : (lang === 'pt' ? 'Ouvir' : 'Listen')}</span>
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })()}
                    <div ref={messagesEndRef} />
                </div>

                <StorySummarySidebar />


            </div>

            <div className={`bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 p-4 md:p-6 z-20 flex flex-col gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] transition-all duration-500 ${zenMode ? 'opacity-0 translate-y-10 pointer-events-none' : 'opacity-100 translate-y-0'}`}>

                {!isTyping && suggestions.length > 0 && !writeOwn && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mb-2 animate-in slide-in-from-bottom-2 fade-in duration-500">
                        {suggestions.map((s, i) => (
                            <button
                                key={i}
                                onClick={() => { setInput(s); setWriteOwn(true); }}
                                className="w-full text-left px-4 py-3 bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-white/10 rounded-xl text-xs text-slate-600 dark:text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all shadow-sm flex items-start group h-auto min-h-[3rem]"
                            >
                                <span className="w-full group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-relaxed">{s}</span>
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

            <EndingOptionsModal
                isOpen={showEndingModal}
                onClose={() => setShowEndingModal(false)}
                onConfirmEnding={handleConfirmEndingChoice}
                messages={messages}
                lang={lang}
                t={t}
            />

            {/* Modal de Edição de Palavras */}
            {selectedWordInfo && (() => {
                const occurrences = getWordOccurrencesCount(selectedWordInfo.word);
                return (
                    <div className="fixed inset-0 z-[250] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#121214] w-full max-w-md rounded-[32px] p-8 space-y-6 border border-gray-200 dark:border-white/10 shadow-2xl animate-in zoom-in-95">
                            <div className="flex justify-between items-center">
                                <h3 className="font-black text-xl text-gray-900 dark:text-white">
                                    {lang === 'pt' ? 'Modificar Palavra' : 'Modify Word'}
                                </h3>
                                <button 
                                    onClick={() => setSelectedWordInfo(null)} 
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all text-slate-400 hover:text-slate-600 dark:hover:text-white"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5 flex items-center justify-between">
                                    <div>
                                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">
                                            {lang === 'pt' ? 'Termo Original' : 'Original Term'}
                                        </label>
                                        <span className="font-semibold text-gray-700 dark:text-slate-300">
                                            "{selectedWordInfo.word}"
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/20">
                                        {lang === 'pt' ? `${occurrences} na obra` : `${occurrences} in story`}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-indigo-500 block">
                                        {lang === 'pt' ? 'Novo Termo' : 'New Term'}
                                    </label>
                                    <input 
                                        autoFocus
                                        type="text"
                                        value={newWordValue}
                                        onChange={(e) => setNewWordValue(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && newWordValue.trim() && newWordValue.trim() !== selectedWordInfo.word) {
                                                handleReplaceWord(true);
                                            }
                                        }}
                                        placeholder={lang === 'pt' ? 'Ex: Douro' : 'Ex: Thames'}
                                        className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 ring-indigo-500/20 font-medium text-gray-900 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setSelectedWordInfo(null)} 
                                        className="py-3 px-4 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors rounded-xl text-xs font-black uppercase tracking-widest text-slate-500"
                                    >
                                        {t.cancel}
                                    </button>
                                    {occurrences > 1 && (
                                        <button 
                                            onClick={() => handleReplaceWord(false)}
                                            disabled={!newWordValue.trim() || newWordValue.trim() === selectedWordInfo.word}
                                            className="flex-1 py-3 px-3 bg-white dark:bg-white/10 hover:bg-gray-50 dark:hover:bg-white/20 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-slate-200 transition-colors rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
                                        >
                                            {lang === 'pt' ? 'Apenas Esta' : 'Only This'}
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => handleReplaceWord(true)}
                                        disabled={!newWordValue.trim() || newWordValue.trim() === selectedWordInfo.word}
                                        className="flex-1 py-3 px-4 bg-indigo-600 text-white hover:bg-indigo-500 transition-colors rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 disabled:opacity-40"
                                    >
                                        {lang === 'pt' ? (occurrences > 1 ? `Substituir Todas (${occurrences})` : 'Substituir') : (occurrences > 1 ? `Replace All (${occurrences})` : 'Replace')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
