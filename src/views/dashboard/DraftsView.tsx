import React, { useState, useEffect } from 'react';
import { FileText, Users2 } from 'lucide-react';
import { StoriesList } from './components/StoriesList';
import { ConfirmModal, PageHeader } from '@/components';
import { getLocalStories } from '@/services/story.services';
import { getCloudDrafts } from '@/services/services';
import { useAppStore } from '@/store/useAppStore';

export const DraftsView = ({ t, onResume, onArchive, onBack }: { t: any, onResume: (s: any) => void, onArchive: (id: string) => void, onBack: () => void }) => {
  const [soloDrafts, setSoloDrafts] = useState<any[]>([]);
  const [coopDrafts, setCoopDrafts] = useState<any[]>([]);
  const [selectedForDelete, setSelectedForDelete] = useState<any>(null);

  const { currentUser } = useAppStore();

  useEffect(() => {
    const fetchDrafts = async () => {
      const allLocalDrafts = getLocalStories().filter((s: any) => s.status !== 'completed');
      
      let allCloudDrafts: any[] = [];
      if (currentUser && currentUser.$id !== 'guest') {
        allCloudDrafts = await getCloudDrafts(currentUser.$id);
      }

      // Merge local and cloud drafts, prioritizing cloud if they have the same ID
      const mergedMap = new Map();
      allLocalDrafts.forEach((d: any) => mergedMap.set(d.id, d));
      allCloudDrafts.forEach((d: any) => mergedMap.set(d.id, d));
      
      const allDrafts = Array.from(mergedMap.values());
      
      setSoloDrafts(allDrafts.filter((s: any) => !s.sessionCode || s.storageType === 'cloud'));
      setCoopDrafts(allDrafts.filter((s: any) => !!s.sessionCode && s.storageType !== 'cloud'));
    };
    fetchDrafts();
  }, [currentUser]);

  const handleDeleteConfirm = () => {
    if (selectedForDelete) {
      onArchive(selectedForDelete.id);
      setSoloDrafts(prev => prev.filter(s => s.id !== selectedForDelete.id));
      setCoopDrafts(prev => prev.filter(s => s.id !== selectedForDelete.id));
      setSelectedForDelete(null);
    }
  };

  return (
    <>
      <PageHeader t={t} title={t.drafts} subtitle={t.draftsSubtitle} onBack={onBack} />
      
      <div className="space-y-12">
        {soloDrafts.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <FileText size={20} className="text-indigo-500" />
              Obras a Solo
            </h3>
            <StoriesList 
              t={t} 
              stories={soloDrafts} 
              onAction={onResume} 
              onDeleteClick={setSelectedForDelete} 
              onBack={onBack} 
              title={t.drafts} 
              subtitle={t.draftsSubtitle} 
              actionLabel={t.resume} 
              icon={FileText} 
              hideHeader={true}
            />
          </section>
        )}

        {coopDrafts.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Users2 size={20} className="text-emerald-500" />
              Obras Cooperativas
            </h3>
            <StoriesList 
              t={t} 
              stories={coopDrafts} 
              onAction={onResume} 
              onDeleteClick={setSelectedForDelete} 
              onBack={onBack} 
              title={t.drafts} 
              subtitle={t.draftsSubtitle} 
              actionLabel={t.resume} 
              icon={Users2} 
              hideHeader={true}
            />
          </section>
        )}

        {soloDrafts.length === 0 && coopDrafts.length === 0 && (
          <div className="py-32 text-center opacity-30 flex flex-col items-center gap-4">
            <FileText size={48} className="text-slate-700" />
            <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">{t.noStories}</p>
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={!!selectedForDelete} 
        onClose={() => setSelectedForDelete(null)} 
        onConfirm={handleDeleteConfirm}
        title={t.confirmDelete}
        message={t.confirmDelete}
        confirmText={t.confirm}
        cancelText={t.cancel}
      />
    </>
  );
};
