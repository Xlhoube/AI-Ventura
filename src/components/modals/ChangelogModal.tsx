import React from 'react';
import { Rocket, X } from 'lucide-react';
import { changelogData } from '@/utils/constants';

export const ChangelogModal = ({ t, isOpen, onClose, lang }: { t: any, isOpen: boolean, onClose: () => void, lang: 'pt' | 'en' | 'fr' }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/50 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Rocket className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{t.changelogTitle}</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t.version}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X size={20} className="text-slate-500 dark:text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-8">
                    {changelogData.map((log, index) => (
                        <div key={index} className="relative pl-8 border-l-2 border-gray-100 dark:border-white/10 last:border-0 pb-2">
                            <span className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white dark:border-[#121214] ${index === 0 ? 'bg-indigo-500' : 'bg-gray-300 dark:bg-slate-700'}`}></span>
                            <div className="mb-2">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white inline-flex items-center gap-2">
                                    v{log.version}
                                    {index === 0 && <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">New</span>}
                                </h4>
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">{log.date}</p>
                            </div>
                            <ul className="space-y-2">
                                {log.changes[lang].map((change, i) => (
                                    <li key={i} className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium flex items-start gap-2">
                                        <span className="text-indigo-500 mt-1.5">•</span>
                                        {change}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                <div className="p-6 bg-gray-50 dark:bg-black/40 flex justify-center">
                    <button onClick={onClose} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
};
