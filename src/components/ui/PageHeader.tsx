import React from 'react';
import { ChevronLeft } from 'lucide-react';

export const PageHeader = ({ t, title, subtitle, onBack }: { t: any, title: string, subtitle?: string, onBack: () => void }) => (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-4 group">
            <button
                onClick={onBack}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-gray-100 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-white/[0.08] hover:text-gray-900 dark:hover:text-white transition-all shadow-lg shrink-0"
            >
                <ChevronLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.back}</span>
            </button>
            <div>
                <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight">{title}</h2>
                {subtitle && <p className="text-slate-500 text-[10px] mt-1 font-bold uppercase tracking-widest">{subtitle}</p>}
            </div>
        </div>
    </div>
);
