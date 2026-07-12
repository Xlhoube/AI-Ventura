import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const ConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText,
    cancelText
}: {
    isOpen: boolean,
    onClose: () => void,
    onConfirm: () => void,
    title: string,
    message: string,
    confirmText: string,
    cancelText: string
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/50 dark:bg-black/90 backdrop-blur-sm animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center space-y-4">
                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-2 text-rose-500">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{title}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{message}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className="flex-1 py-3 bg-rose-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-600 shadow-lg shadow-rose-500/20 transition-all"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};
