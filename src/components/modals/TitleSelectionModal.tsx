import React, { useState } from 'react';
import { Book, X, Sparkles, Edit3, CheckCircle } from 'lucide-react';

export const TitleSelectionModal = ({
    t,
    isOpen,
    onClose,
    onConfirm,
    suggestedTitles
}: {
    t: any,
    isOpen: boolean,
    onClose: () => void,
    onConfirm: (title: string) => void,
    suggestedTitles: string[]
}) => {
    const [customTitle, setCustomTitle] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Book className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{t.titleSelection}</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t.selectTitleDesc}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X size={20} className="text-slate-500 dark:text-white" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {/* Sugestões da IA */}
                    <div className="space-y-3">
                        {suggestedTitles.map((title, i) => (
                            <button
                                key={i}
                                onClick={() => onConfirm(title)}
                                className="w-full text-left p-5 rounded-2xl border border-gray-200 dark:border-white/10 hover:border-indigo-500 dark:hover:border-indigo-500 bg-gray-50 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all group"
                            >
                                <span className="flex items-center gap-2 mb-1">
                                    <Sparkles size={14} className="text-indigo-500" />
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500">AI Suggestion</span>
                                </span>
                                <p className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 font-serif italic">{title}</p>
                            </button>
                        ))}
                    </div>

                    {/* Divisor */}
                    <div className="relative flex items-center justify-center">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-white/10"></div></div>
                        <span className="relative px-4 bg-white dark:bg-[#121214] text-[10px] font-black uppercase tracking-widest text-slate-400">{t.orCustom}</span>
                    </div>

                    {/* Input Customizado */}
                    <div className="flex gap-2">
                        <div className="flex-1 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-2 flex items-center focus-within:ring-2 ring-indigo-500/20 transition-all">
                            <div className="pl-3 text-slate-400"><Edit3 size={18} /></div>
                            <input
                                value={customTitle}
                                onChange={(e) => setCustomTitle(e.target.value)}
                                placeholder={t.customTitlePlaceholder}
                                className="w-full bg-transparent border-none focus:ring-0 py-4 px-3 text-gray-900 dark:text-white outline-none font-medium"
                            />
                        </div>
                        <button
                            onClick={() => onConfirm(customTitle)}
                            disabled={!customTitle.trim()}
                            className="px-6 rounded-2xl bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <CheckCircle size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
