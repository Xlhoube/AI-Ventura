import React from 'react';
import { Wifi, Loader2, CheckCircle } from 'lucide-react';

export const JoinInviteModal = ({
    t,
    isOpen,
    onClose,
    onJoin,
    code,
    isJoining,
    error
}: {
    t: any,
    isOpen: boolean,
    onClose: () => void,
    onJoin: () => void,
    code: string,
    isJoining: boolean,
    error?: string | null
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center space-y-6">
                    <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-500">
                        <Wifi size={32} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-2">{t.inviteDetected}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.inviteDetectedDesc}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-white/5 rounded-2xl p-4 border border-gray-200 dark:border-white/5">
                        <span className="text-2xl font-black text-gray-900 dark:text-white tracking-widest font-mono">{code}</span>
                    </div>

                    {error && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-xl border border-rose-100 dark:border-rose-500/20 animate-in slide-in-from-top-1">
                            <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 leading-tight">{error}</p>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                        {t.cancel}
                    </button>
                    <button
                        onClick={onJoin}
                        disabled={isJoining}
                        className="flex-[2] py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        {isJoining ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                        {t.validateAndJoin}
                    </button>
                </div>
            </div>
        </div>
    );
};
