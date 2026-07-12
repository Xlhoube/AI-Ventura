import React from 'react';
import { Wifi, UserPlus, Zap, Shield, X } from 'lucide-react';

export const CoopInfoModal = ({ t, isOpen, onClose }: { t: any, isOpen: boolean, onClose: () => void }) => {
    if (!isOpen) return null;

    const steps = [
        { title: t.coopStep1, desc: t.coopStep1Desc, icon: Wifi },
        { title: t.coopStep2, desc: t.coopStep2Desc, icon: UserPlus },
        { title: t.coopStep3, desc: t.coopStep3Desc, icon: Zap },
        { title: t.coopStep4, desc: t.coopStep4Desc, icon: Shield },
    ];

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/50 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Wifi className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{t.coopModalTitle}</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">Multiplayer</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X size={20} className="text-slate-500 dark:text-white" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-4 p-6 bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 rounded-3xl">
                                <div className="w-10 h-10 bg-indigo-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                                    <step.icon size={20} />
                                </div>
                                <div>
                                    <h4 className="text-gray-900 dark:text-white font-bold text-sm mb-1">{step.title}</h4>
                                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{step.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
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
