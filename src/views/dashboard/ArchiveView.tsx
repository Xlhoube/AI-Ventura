import React, { useState, useEffect } from 'react';
import { History, AlertTriangle, Undo2, Trash2 } from 'lucide-react';
import { PageHeader, ConfirmModal } from '@/components';
import { getArchivedStories, restoreArchivedStory, deletePermanentArchived } from '@/services/story.services';

export const ArchiveView = ({ t, onBack }: { t: any, onBack: () => void }) => {
  const [archived, setArchived] = useState<any[]>([]);
  const [selectedForDelete, setSelectedForDelete] = useState<any>(null);

  useEffect(() => { setArchived(getArchivedStories()); }, []);

  const handleRestore = (id: string) => { restoreArchivedStory(id); setArchived(getArchivedStories()); };
  
  const handlePermanentDelete = () => {
    if (selectedForDelete) {
       deletePermanentArchived(selectedForDelete.id);
       setArchived(getArchivedStories());
       setSelectedForDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader t={t} title={t.archive} subtitle={t.archiveSubtitle} onBack={onBack} />
      <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex items-center gap-4 mb-8">
        <AlertTriangle className="text-amber-500 shrink-0" />
        <p className="text-xs text-amber-500/80 font-bold uppercase tracking-wide">{t.archiveWarning}</p>
      </div>
      {archived.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archived.map(s => (
            <div key={s.id} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-[32px] p-8 space-y-4 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-1">{s.title}</h3>
              <div className="flex items-center justify-between gap-4 pt-4">
                <button onClick={() => handleRestore(s.id)} className="flex-1 py-3 bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2"><Undo2 size={16}/> {t.restore}</button>
                <button onClick={() => setSelectedForDelete(s)} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-32 text-center opacity-30 flex flex-col items-center gap-4">
          <History size={48} className="text-slate-700" />
          <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">{t.noArchived}</p>
        </div>
      )}
      
      <ConfirmModal 
        isOpen={!!selectedForDelete} 
        onClose={() => setSelectedForDelete(null)} 
        onConfirm={handlePermanentDelete}
        title={t.deletePermanent}
        message={t.deletePermanentlyConfirm}
        confirmText={t.delete}
        cancelText={t.cancel}
      />
    </div>
  );
};
