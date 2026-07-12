import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

export const Toast = ({ message, type, onClose }: { message: string, type: ToastType, onClose: () => void }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, 5000);
        return () => clearTimeout(timer);
    }, [onClose]);

    const styles = {
        success: 'bg-emerald-50 border-emerald-500/20 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-500',
        error: 'bg-rose-50 border-rose-500/20 text-rose-600 dark:bg-rose-500/10 dark:text-rose-500',
        info: 'bg-indigo-50 border-indigo-500/20 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-500',
    };

    const icons = {
        success: <CheckCircle size={18} />,
        error: <AlertCircle size={18} />,
        info: <Info size={18} />,
    };

    return (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 px-6 py-4 rounded-2xl border backdrop-blur-xl shadow-2xl animate-in slide-in-from-bottom-4 fade-in duration-300 ${styles[type]}`}>
            {icons[type]}
            <p className="text-[11px] font-black uppercase tracking-widest leading-none">{message}</p>
            <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity"><X size={14} /></button>
        </div>
    );
};
