import React, { useState, useRef, useEffect } from 'react';
import {
    Sparkles, Send, BookOpen, Compass, Shield, User, ScrollText,
    Loader2, Volume2, VolumeX, Image as ImageIcon, CheckCircle, HelpCircle,
    ChevronRight, ArrowLeft, RefreshCw, MessageSquare
} from 'lucide-react';
import { DMCampaign, DMNarrativeNode, DMChoice } from './types';
import { streamDungeonMasterNarrative, generateDMChoices, requestImageGeneration } from '@/services/ai';
import { renderNarrativeWithBreaks } from '@/utils/utils';

interface DungeonMasterEngineProps {
    initialCampaign: DMCampaign;
    onExit: () => void;
    onSaveCampaign?: (campaign: DMCampaign) => void;
    onShowToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DungeonMasterEngine: React.FC<DungeonMasterEngineProps> = ({
    initialCampaign,
    onExit,
    onSaveCampaign,
    onShowToast
}) => {
    const [campaign, setCampaign] = useState<DMCampaign>(initialCampaign);
    const [inputAction, setInputAction] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentStreamingText, setCurrentStreamingText] = useState('');
    const [activeTab, setActiveTab] = useState<'narrative' | 'character' | 'quests' | 'lore'>('narrative');
    const [loadingImage, setLoadingImage] = useState(false);

    const narrativeEndRef = useRef<HTMLDivElement>(null);
    const activeChar = campaign.characters.find(c => c.id === campaign.activeCharacterId) || campaign.characters[0];
    const lastNode = campaign.nodes[campaign.nodes.length - 1];

    useEffect(() => {
        narrativeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [campaign.nodes, currentStreamingText]);

    const handlePlayerAction = async (actionText: string) => {
        if (!actionText.trim() || isGenerating) return;

        const playerNode: DMNarrativeNode = {
            id: `node-${Date.now()}-player`,
            timestamp: Date.now(),
            sender: 'player',
            playerName: activeChar.name,
            text: actionText.trim()
        };

        const updatedNodes = [...campaign.nodes, playerNode];
        const updatedCampaign = { ...campaign, nodes: updatedNodes, updatedAt: Date.now() };
        setCampaign(updatedCampaign);
        setInputAction('');
        setIsGenerating(true);
        setCurrentStreamingText('');

        try {
            let fullDmText = '';
            await streamDungeonMasterNarrative(
                updatedCampaign,
                actionText,
                (chunk) => {
                    fullDmText = chunk;
                    setCurrentStreamingText(chunk);
                }
            );

            // Gerar novas escolhas dinâmicas
            const newChoices = await generateDMChoices(updatedCampaign, fullDmText);
            const validChoices = Array.isArray(newChoices) ? newChoices : [];

            const dmNode: DMNarrativeNode = {
                id: `node-${Date.now()}-dm`,
                timestamp: Date.now(),
                sender: 'dm',
                text: fullDmText,
                choices: validChoices.map((c: any, i: number) => ({
                    id: `c-${i}`,
                    text: typeof c === 'string' ? c : (c.text || c.action || 'Avançar com cuidado'),
                    intent: (c.intent || 'action') as any
                }))
            };


            const finalCampaign: DMCampaign = {
                ...updatedCampaign,
                nodes: [...updatedNodes, dmNode],
                updatedAt: Date.now()
            };

            setCampaign(finalCampaign);
            setCurrentStreamingText('');
            if (onSaveCampaign) onSaveCampaign(finalCampaign);

        } catch (e: any) {
            console.error("Erro no Dungeon Master:", e);
            if (onShowToast) onShowToast(e.message || "Erro na resposta do Mestre.", "error");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGenerateSceneIllustration = async (nodeId: string, sceneText: string) => {
        if (loadingImage) return;
        setLoadingImage(true);
        try {
            const prompt = `Dark atmospheric fantasy oil painting, detailed tabletop RPG art: ${sceneText.slice(0, 200)}`;
            const imageUrl = await requestImageGeneration(prompt);
            
            const updatedNodes = campaign.nodes.map(n => n.id === nodeId ? { ...n, sceneImage: imageUrl } : n);
            const updated = { ...campaign, nodes: updatedNodes };
            setCampaign(updated);
            if (onSaveCampaign) onSaveCampaign(updated);
            if (onShowToast) onShowToast("Cena ilustrada pelo Mestre!", "success");
        } catch (e: any) {
            if (onShowToast) onShowToast("Não foi possível gerar a ilustração.", "error");
        } finally {
            setLoadingImage(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
            {/* Top Bar - Mesa do Mestre */}
            <header className="h-16 border-b border-amber-900/40 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between shrink-0 z-10 shadow-lg">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onExit}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition flex items-center gap-1 text-sm font-semibold"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Sair</span>
                    </button>
                    <div className="h-6 w-[1px] bg-slate-800" />
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="text-amber-400 font-bold font-serif text-lg">{campaign.title}</span>
                            <span className="text-xs bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30 font-mono">
                                {campaign.dmStyle.toUpperCase()}
                            </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">{activeChar.name} • {activeChar.archetype}</div>
                    </div>
                </div>

                {/* Abas de Informação */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
                    <button
                        onClick={() => setActiveTab('narrative')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'narrative' ? 'bg-amber-600 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <BookOpen className="w-3.5 h-3.5" />
                        Crónica
                    </button>
                    <button
                        onClick={() => setActiveTab('character')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'character' ? 'bg-amber-600 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <User className="w-3.5 h-3.5" />
                        Personagem
                    </button>
                    <button
                        onClick={() => setActiveTab('quests')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${activeTab === 'quests' ? 'bg-amber-600 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}
                    >
                        <ScrollText className="w-3.5 h-3.5" />
                        Missões ({campaign.quests.length})
                    </button>
                </div>
            </header>

            {/* Layout Principal: Crónica Central e Painel Lateral */}
            <div className="flex-1 flex overflow-hidden">
                {/* Painel Central: Narrativa do Dungeon Master */}
                <main className="flex-1 flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
                    <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 max-w-4xl mx-auto w-full">
                        {campaign.nodes.map((node) => (
                            <div
                                key={node.id}
                                className={`flex flex-col gap-2 ${node.sender === 'dm' ? 'items-start' : 'items-end'}`}
                            >
                                {node.sender === 'dm' ? (
                                    <div className="w-full bg-slate-900/80 border border-amber-900/30 rounded-3xl p-6 shadow-xl backdrop-blur-md relative overflow-hidden group">
                                        <div className="flex items-center justify-between border-b border-amber-900/30 pb-3 mb-4">
                                            <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm">
                                                <Sparkles className="w-4 h-4" />
                                                <span>Dungeon Master</span>
                                            </div>
                                            {node.locationName && (
                                                <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                                    <Compass className="w-3.5 h-3.5" />
                                                    {node.locationName}
                                                </span>
                                            )}
                                        </div>

                                        {/* Imagem de Cena se houver */}
                                        {node.sceneImage ? (
                                            <img
                                                src={node.sceneImage}
                                                alt="Ilustração da Cena"
                                                className="w-full h-64 object-cover rounded-2xl mb-4 border border-amber-900/40 shadow-inner"
                                            />
                                        ) : (
                                            <button
                                                onClick={() => handleGenerateSceneIllustration(node.id, node.text)}
                                                disabled={loadingImage}
                                                className="mb-4 px-3 py-1.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl text-xs text-amber-300/80 hover:text-amber-200 transition flex items-center gap-2"
                                            >
                                                <ImageIcon className="w-3.5 h-3.5" />
                                                <span>Pedir Ilustração da Cena ao Mestre</span>
                                            </button>
                                        )}

                                        {/* Texto Narrativo */}
                                        <div className="text-slate-200 font-serif leading-relaxed text-base prose prose-invert max-w-none">
                                            {renderNarrativeWithBreaks(node.text)}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="max-w-xl bg-gradient-to-r from-amber-600/20 to-amber-500/30 border border-amber-500/40 rounded-2xl p-4 text-amber-100 shadow-md">
                                        <div className="text-xs font-mono font-bold text-amber-300 mb-1 flex items-center gap-1.5 justify-end">
                                            <span>{node.playerName || activeChar.name}</span>
                                            <span>⚔️</span>
                                        </div>
                                        <div className="text-sm">{node.text}</div>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Streaming da resposta atual do Mestre */}
                        {isGenerating && currentStreamingText && (
                            <div className="w-full bg-slate-900/80 border border-amber-900/30 rounded-3xl p-6 shadow-xl backdrop-blur-md animate-pulse">
                                <div className="flex items-center gap-2 text-amber-400 font-serif font-bold text-sm mb-3">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>O Dungeon Master está a descrever o destino...</span>
                                </div>
                                <div className="text-slate-200 font-serif leading-relaxed text-base">
                                    {renderNarrativeWithBreaks(currentStreamingText)}
                                </div>
                            </div>
                        )}

                        <div ref={narrativeEndRef} />
                    </div>

                    {/* Barra de Ações do Jogador & Sugestões do Mestre */}
                    <div className="p-4 bg-slate-950/95 border-t border-amber-900/40 backdrop-blur-md shrink-0">
                        <div className="max-w-4xl mx-auto space-y-3">
                            {/* Sugestões de Escolhas do Mestre */}
                            {lastNode && lastNode.sender === 'dm' && lastNode.choices && lastNode.choices.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {lastNode.choices.map((choice) => (
                                        <button
                                            key={choice.id}
                                            disabled={isGenerating}
                                            onClick={() => handlePlayerAction(choice.text)}
                                            className="p-3 bg-slate-900/90 hover:bg-amber-950/50 active:bg-amber-900/60 border border-amber-900/30 hover:border-amber-500/50 rounded-xl text-left text-xs text-amber-200/90 transition shadow flex items-center justify-between group disabled:opacity-50"
                                        >
                                            <span className="line-clamp-2">{choice.text}</span>
                                            <ChevronRight className="w-4 h-4 text-amber-500/60 group-hover:translate-x-1 transition shrink-0 ml-2" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Campo de Ação Livre: O que queres fazer ou dizer? */}
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handlePlayerAction(inputAction);
                                }}
                                className="flex items-center gap-2 bg-slate-900 border border-slate-700 focus-within:border-amber-500 rounded-2xl p-2 shadow-inner transition"
                            >
                                <input
                                    type="text"
                                    value={inputAction}
                                    onChange={(e) => setInputAction(e.target.value)}
                                    placeholder={`O que pretendes que ${activeChar.name} faça ou diga? (Ex: Falar com o guarda, investigar o altar...)`}
                                    disabled={isGenerating}
                                    className="flex-1 bg-transparent px-3 py-1.5 text-sm text-slate-100 placeholder-slate-500 outline-none"
                                />
                                <button
                                    type="submit"
                                    disabled={!inputAction.trim() || isGenerating}
                                    className="p-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:brightness-110 active:scale-95 text-slate-950 rounded-xl font-bold transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md"
                                >
                                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                </button>
                            </form>
                        </div>
                    </div>
                </main>

                {/* Painel Lateral: Ficha do Herói / Diário de Missões */}
                {activeTab !== 'narrative' && (
                    <aside className="w-80 border-l border-amber-900/30 bg-slate-900/95 p-5 overflow-y-auto flex flex-col gap-5 shrink-0">
                        {activeTab === 'character' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
                                    <div className="text-4xl p-2 bg-slate-950 border border-slate-800 rounded-2xl">{activeChar.avatar}</div>
                                    <div>
                                        <div className="font-bold text-amber-300 font-serif text-lg">{activeChar.name}</div>
                                        <div className="text-xs text-amber-400/80 font-mono">{activeChar.archetype}</div>
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1">Biografia</div>
                                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                                        {activeChar.biography}
                                    </p>
                                </div>

                                <div>
                                    <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1">Traços & Perícias</div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {activeChar.traits.map((t, idx) => (
                                            <span key={idx} className="text-xs bg-slate-950 px-2.5 py-1 rounded-lg text-amber-300 border border-slate-800">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <div className="text-xs uppercase font-mono tracking-wider text-slate-400 font-semibold mb-1">Inventário do Aventureiro</div>
                                    <div className="space-y-1.5">
                                        {activeChar.inventory.map((item, idx) => (
                                            <div key={idx} className="text-xs bg-slate-950/80 px-3 py-2 rounded-lg text-slate-200 border border-slate-800 flex items-center gap-2">
                                                <span>🎒</span>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'quests' && (
                            <div className="space-y-3">
                                <div className="text-xs uppercase font-mono tracking-wider text-amber-400 font-semibold mb-2">Diário de Missões & Pistas</div>
                                {campaign.quests.map((q) => (
                                    <div key={q.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-xs text-amber-200">{q.title}</span>
                                            <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-mono uppercase">
                                                {q.status}
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-400 leading-relaxed">{q.description}</p>
                                        {q.cluesFound.length > 0 && (
                                            <div className="pt-2 border-t border-slate-800/80">
                                                <span className="text-[10px] text-slate-500 font-mono uppercase">Pistas:</span>
                                                <ul className="text-xs text-slate-300 list-disc list-inside mt-0.5">
                                                    {q.cluesFound.map((c, i) => <li key={i}>{c}</li>)}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </aside>
                )}
            </div>
        </div>
    );
};
