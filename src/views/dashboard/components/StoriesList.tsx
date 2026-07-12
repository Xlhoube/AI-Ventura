import React from 'react';
import { Trash2, Loader2, UploadCloud, CloudOff } from 'lucide-react';
import { PageHeader } from '@/components';
import { ConfirmModal } from '@/components';

interface StoriesListProps {
  t: any;
  stories: any[];
  onAction: (s: any) => void;
  onDeleteClick?: (s: any) => void;
  onSecondaryAction?: (s: any) => void;
  secondaryLabel?: string;
  secondaryIcon?: any;
  publishedIds?: Set<string>;
  onBack: () => void;
  title: string;
  subtitle: string;
  actionLabel: string;
  icon: any;
}

export const StoriesList = ({ 
  t, stories, onAction, onDeleteClick, onSecondaryAction, 
  secondaryLabel, secondaryIcon: SecIcon, publishedIds, onBack, title, subtitle, actionLabel, icon: Icon, hideHeader = false
}: StoriesListProps & { hideHeader?: boolean }) => (
  <div className="animate-in fade-in duration-500">
    {!hideHeader && <PageHeader t={t} title={title} subtitle={subtitle} onBack={onBack} />}
    {stories.length > 0 ? (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map(s => {
          const isPublished = publishedIds?.has(s.id);
          return (
          <div key={s.id} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-[32px] overflow-hidden flex flex-col group hover:border-gray-300 dark:hover:border-white/10 transition-all shadow-sm relative">
            <div className="p-8 flex-1 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center"><Icon className="text-indigo-500 dark:text-indigo-400" size={20} /></div>
                <div className="flex flex-col items-end gap-2">
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-600 bg-gray-100 dark:bg-white/5 px-3 py-1 rounded-full">{new Date(s.updated_at).toLocaleDateString()}</span>
                   {isPublished && (
                     <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border border-emerald-500/20 flex items-center gap-1.5">
                       <UploadCloud size={12} /> Publicada
                     </div>
                   )}
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 leading-tight">{s.title}</h3>
              <p className="text-slate-500 text-xs line-clamp-3 italic font-medium">"{s.messages?.[0]?.content?.substring(0, 100)}..."</p>
            </div>
            <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex gap-2">
              <button onClick={() => onAction(s)} className="flex-1 py-3 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-500 transition-all">{actionLabel}</button>
              
              {/* Botão Secundário (ex: Publicar) */}
              {onSecondaryAction && (
                <button 
                  onClick={() => onSecondaryAction(s)} 
                  className={`p-3 rounded-xl transition-all ${isPublished ? 'text-emerald-500 hover:text-rose-500 hover:bg-rose-500/10 bg-emerald-500/10' : 'text-slate-500 hover:text-emerald-500 hover:bg-emerald-500/10'}`} 
                  title={isPublished ? t.removeFromGlobal : secondaryLabel}
                >
                  {isPublished ? <CloudOff size={18} /> : (SecIcon ? <SecIcon size={18} /> : secondaryLabel)}
                </button>
              )}

              {onDeleteClick && (
                <button onClick={() => onDeleteClick(s)} className="p-3 text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
              )}
            </div>
          </div>
        )})}
      </div>
    ) : (
      <div className="py-32 text-center opacity-30 flex flex-col items-center gap-4">
        <Icon size={48} className="text-slate-700" />
        <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">{t.noStories}</p>
      </div>
    )}
  </div>
);
