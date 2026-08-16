import React, { useState, useEffect } from 'react';
import { Sparkles, X, Loader2, PenTool, CheckCircle2, Trophy, Flame, Compass } from 'lucide-react';
import { generateEndingOptions, EndingOption } from '@/services/ai';

interface EndingOptionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirmEnding: (choice: { title: string; description: string; isCustom: boolean }) => void;
    messages: any[];
    lang: 'pt' | 'en' | 'fr';
    t: any;
}

export const EndingOptionsModal: React.FC<EndingOptionsModalProps> = ({
    isOpen,
    onClose,
    onConfirmEnding,
    messages,
    lang,
    t
}) => {
    const [options, setOptions] = useState<EndingOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [selectedId, setSelectedId] = useState<number | 'custom' | null>(null);
    const [customText, setCustomText] = useState<string>('');

    useEffect(() => {
        if (isOpen) {
            setSelectedId(null);
            setCustomText('');
            setIsLoading(true);
            generateEndingOptions(messages, lang)
                .then(opts => {
                    setOptions(opts);
                    if (opts.length > 0) {
                        setSelectedId(opts[0].id);
                    }
                })
                .catch(err => {
                    console.error("Erro ao gerar opções de desfecho:", err);
                })
                .finally(() => {
                    setIsLoading(false);
                });
        }
    }, [isOpen, messages, lang]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        if (selectedId === 'custom') {
            if (!customText.trim()) return;
            onConfirmEnding({
                title: lang === 'pt' ? 'Desfecho Personalizado do Autor' : 'Author Custom Ending',
                description: customText.trim(),
                isCustom: true
            });
        } else {
            const chosen = options.find(o => o.id === selectedId);
            if (chosen) {
                onConfirmEnding({
                    title: chosen.title,
                    description: chosen.description,
                    isCustom: false
                });
            }
        }
    };

    const getOptionBadge = (index: number) => {
        if (index === 0) return { icon: <Trophy size={13} className="text-amber-500" />, label: lang === 'pt' ? 'Triunfante / Heroico' : 'Triumphant' };
        if (index === 1) return { icon: <Flame size={13} className="text-rose-500" />, label: lang === 'pt' ? 'Dramático / Sacrifício' : 'Dramatic' };
        return { icon: <Compass size={13} className="text-indigo-500" />, label: lang === 'pt' ? 'Reviravolta / Mistério' : 'Plot Twist' };
    };

    const canSubmit = selectedId === 'custom' ? customText.trim().length > 0 : selectedId !== null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-6 bg-black/70 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-all">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-2xl max-h-[90vh] rounded-[32px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                
                {/* Cabeçalho */}
                <div className="p-6 md:p-8 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <Sparkles size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">
                                {lang === 'pt' ? 'Desfecho da Obra' : lang === 'fr' ? 'Dénouement de l\'Œuvre' : 'Story Climax & Ending'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                {lang === 'pt'
                                    ? 'A IA leu todo o manuscrito e formulou 3 propostas para o clímax. Escolhe uma ou escreve o teu próprio final.'
                                    : 'The AI analyzed the entire story and crafted 3 climax proposals. Pick one or write your own.'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-slate-500 dark:text-slate-400"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corpo das Opções */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-4 custom-scrollbar">
                    {isLoading ? (
                        <div className="py-16 flex flex-col items-center justify-center gap-4 text-center">
                            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-600 animate-spin flex items-center justify-center">
                                <Sparkles size={16} className="text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">
                                    {lang === 'pt' ? 'A sintetizar toda a narrativa e a desenhar 3 desfechos...' : 'Synthesizing story and drafting 3 endings...'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                    {lang === 'pt' ? 'A garantir coerência com todas as decisões tomadas pelos protagonistas.' : 'Ensuring consistency with characters and previous events.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <>
                            {/* 3 Opções Geradas pela IA */}
                            {options.map((opt, idx) => {
                                const badge = getOptionBadge(idx);
                                const isSelected = selectedId === opt.id;
                                return (
                                    <div
                                        key={opt.id}
                                        onClick={() => setSelectedId(opt.id)}
                                        className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col gap-2.5 ${
                                            isSelected
                                                ? 'bg-indigo-50/80 dark:bg-indigo-500/10 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                                                : 'bg-gray-50/60 dark:bg-white/[0.03] border-gray-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/40 hover:bg-white dark:hover:bg-white/[0.05]'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border border-gray-200/50 dark:border-white/5">
                                                {badge.icon}
                                                <span>{badge.label}</span>
                                            </div>
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                                isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-gray-300 dark:border-white/20'
                                            }`}>
                                                {isSelected && <CheckCircle2 size={14} />}
                                            </div>
                                        </div>

                                        <h4 className="text-base font-bold text-gray-900 dark:text-white font-serif">
                                            {opt.title}
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                                            {opt.description}
                                        </p>
                                    </div>
                                );
                            })}

                            {/* 4ª Opção: Escrever o Próprio Final */}
                            <div
                                onClick={() => setSelectedId('custom')}
                                className={`p-5 rounded-2xl border transition-all cursor-pointer relative flex flex-col gap-3 ${
                                    selectedId === 'custom'
                                        ? 'bg-purple-50/80 dark:bg-purple-500/10 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                                        : 'bg-gray-50/60 dark:bg-white/[0.03] border-gray-200 dark:border-white/5 hover:border-purple-300 dark:hover:border-purple-500/40 hover:bg-white dark:hover:bg-white/[0.05]'
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 px-2.5 py-1 bg-white dark:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-500/20">
                                        <PenTool size={13} />
                                        <span>{lang === 'pt' ? 'Final Personalizado do Autor' : 'Custom Ending'}</span>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${
                                        selectedId === 'custom' ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300 dark:border-white/20'
                                    }`}>
                                        {selectedId === 'custom' && <CheckCircle2 size={14} />}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-base font-bold text-gray-900 dark:text-white">
                                        {lang === 'pt' ? 'Escrever o meu próprio desfecho' : 'Write my own ending'}
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        {lang === 'pt'
                                            ? 'Indica exatamente como queres que a história termine. A IA integrará a tua visão no grande capítulo final.'
                                            : 'Specify exactly how you want the story to end. The AI will weave your vision into the final chapter.'}
                                    </p>
                                </div>

                                {selectedId === 'custom' && (
                                    <textarea
                                        rows={3}
                                        value={customText}
                                        onChange={(e) => setCustomText(e.target.value)}
                                        placeholder={lang === 'pt' ? 'Descreve o teu final aqui (ex: Os protagonistas decidem selar o portal para salvar o reino, mas um deles fica preso no outro lado)...' : 'Describe your ending here...'}
                                        className="w-full mt-2 p-3 bg-white dark:bg-black/30 border border-purple-300 dark:border-purple-500/30 rounded-xl text-xs text-gray-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30 resize-none font-sans"
                                        autoFocus
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Rodapé de Ações */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
                    >
                        {lang === 'pt' ? 'Voltar ao Editor' : 'Back to Editor'}
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={!canSubmit || isLoading}
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all"
                    >
                        <Sparkles size={14} />
                        <span>{lang === 'pt' ? 'Redigir Desfecho & Concluir Obra' : 'Write Climax & Finish Book'}</span>
                    </button>
                </div>

            </div>
        </div>
    );
};
