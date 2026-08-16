import React, { useState, useEffect, useRef } from 'react';
import { Library, Loader2, UploadCloud, Users2, Download } from 'lucide-react';
import { StoriesList } from './components/StoriesList';
import { ConfirmModal, PageHeader } from '@/components';
import { getLocalStories, saveLocalStory } from '@/services/story.services';
import { account, databases, DATABASE_ID, COL_PUBLIC_STORIES, publishStoryToGlobal, unpublishStoryByTitle, syncStoriesCount, isCloudEnabled } from '@/services/services';
import { Query } from 'appwrite';

export const PrivateLibraryView = ({ t, onRead, onArchive, onBack, onShowToast }: { t: any, onRead: (s: any) => void, onArchive: (id: string) => void, onBack: () => void, onShowToast?: (msg: string, type: 'success' | 'error' | 'info') => void }) => {
  const [soloLibrary, setSoloLibrary] = useState<any[]>([]);
  const [coopLibrary, setCoopLibrary] = useState<any[]>([]);
  const [selectedForDelete, setSelectedForDelete] = useState<any>(null);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [publishedIds, setPublishedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadStories = async () => {
      const localStories = getLocalStories().filter((s: any) => s.status === 'completed');
      setSoloLibrary(localStories.filter((s: any) => !s.sessionCode));
      setCoopLibrary(localStories.filter((s: any) => !!s.sessionCode));

      // Verificar quais histórias já estão publicadas
      if (isCloudEnabled) {
        try {
          const user = await account.get();
          if (user) {
            // Sincronizar contagem de histórias concluídas com o perfil
            syncStoriesCount(user.$id, localStories.length);

            const data = await databases.listDocuments(
               DATABASE_ID,
               COL_PUBLIC_STORIES,
               [Query.equal('author_id', user.$id)]
            );
            
            if (data && data.documents) {
              const publishedTitles = new Set(data.documents.map((d: any) => d.title));
              // Mapear títulos para IDs locais
              const ids = new Set<string>();
              localStories.forEach(s => {
                if (publishedTitles.has(s.title)) {
                  ids.add(s.id);
                }
              });
              setPublishedIds(ids);
            }
          }
        } catch(e) {}
      }
    };
    loadStories();
  }, []);

  const handleDeleteConfirm = () => {
    if (selectedForDelete) {
      onArchive(selectedForDelete.id);
      setSoloLibrary(prev => prev.filter(s => s.id !== selectedForDelete.id));
      setCoopLibrary(prev => prev.filter(s => s.id !== selectedForDelete.id));
      setSelectedForDelete(null);
    }
  };

  const handlePublish = async (story: any) => {
    setIsPublishing(story.id);
    try {
      let user;
      try {
         user = await account.get();
      } catch(e) {}
      if (!user) return;

      // Se já estiver publicada, remover
      if (publishedIds.has(story.id)) {
         await unpublishStoryByTitle(story.title, user.id);
         setPublishedIds(prev => {
            const next = new Set(prev);
            next.delete(story.id);
            return next;
         });
         if (onShowToast) {
            onShowToast(t.unpublishSuccess || "Obra removida da Biblioteca Global.", 'success');
         } else {
            alert(t.unpublishSuccess || "Obra removida da Biblioteca Global.");
         }
         return;
      }
      
      const userName = user.name || user.email?.split('@')[0] || 'Author';
      
      // INCLUI AGORA O IDIOMA ATUAL DO UTILIZADOR COMO IDIOMA ORIGINAL
      // A preferência de idioma da app (t) é inferida, mas aqui usamos o idioma local
      const currentLang = localStorage.getItem('ia_ventura_lang') || 'en';
      
      const res = await publishStoryToGlobal(story, user.$id, userName, currentLang);
      
      if (res.success) {
        if (onShowToast) onShowToast(t.publishedSuccess, 'success');
        else alert(t.publishedSuccess);
        setPublishedIds(prev => new Set(prev).add(story.id));
      } else if (res.message === 'already_exists') {
        if (onShowToast) onShowToast(t.alreadyPublished, 'info');
        else alert(t.alreadyPublished);
        setPublishedIds(prev => new Set(prev).add(story.id));
      }
    } catch (e) {
      console.error(e);
      if (onShowToast) onShowToast(t.publishError, 'error');
      else alert(t.publishError);
    } finally {
      setIsPublishing(null);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentLang = localStorage.getItem('ia_ventura_lang') || 'en';
    const isPt = currentLang === 'pt';

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json && json.id && json.messages) {
          saveLocalStory(json);
          // Update state instantly
          if (json.sessionCode) {
            setCoopLibrary(prev => {
              const filtered = prev.filter(s => s.id !== json.id);
              return [json, ...filtered];
            });
          } else {
            setSoloLibrary(prev => {
              const filtered = prev.filter(s => s.id !== json.id);
              return [json, ...filtered];
            });
          }
          if (onShowToast) onShowToast(isPt ? "Obra importada com sucesso!" : "Story imported successfully!", 'success');
          else alert(isPt ? "Obra importada com sucesso!" : "Story imported successfully!");
        } else {
          if (onShowToast) onShowToast(isPt ? "Ficheiro inválido. Certifique-se de que é um backup do AI Ventura." : "Invalid file. Make sure it's an AI Ventura backup.", 'error');
          else alert(isPt ? "Ficheiro inválido. Certifique-se de que é um backup do AI Ventura." : "Invalid file. Make sure it's an AI Ventura backup.");
        }
      } catch (err) {
        console.error(err);
        if (onShowToast) onShowToast(isPt ? "Erro ao ler o ficheiro." : "Error reading file.", 'error');
        else alert(isPt ? "Erro ao ler o ficheiro." : "Error reading file.");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  return (
    <>
      <PageHeader t={t} title={t.privateLibrary} subtitle={t.privateLibrarySubtitle} onBack={onBack} />
      
      <div className="flex justify-end mb-6 -mt-4">
        <input 
          type="file" 
          accept=".json" 
          hidden 
          ref={fileInputRef} 
          onChange={handleImport} 
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-slate-600 dark:text-slate-300 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm font-bold shadow-sm"
        >
          <Download size={16} />
          {localStorage.getItem('ia_ventura_lang') === 'pt' ? 'Importar Obra' : 'Import Story'}
        </button>
      </div>

      <div className="space-y-12">
        {soloLibrary.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Library size={20} className="text-indigo-500" />
              Obras a Solo
            </h3>
            <StoriesList 
              t={t} 
              stories={soloLibrary} 
              onAction={onRead} 
              onSecondaryAction={handlePublish}
              secondaryLabel={t.publishToGlobal}
              secondaryIcon={isPublishing ? Loader2 : UploadCloud}
              publishedIds={publishedIds}
              onDeleteClick={setSelectedForDelete} 
              onBack={onBack} 
              title={t.privateLibrary} 
              subtitle={t.privateLibrarySubtitle} 
              actionLabel={t.readBook} 
              icon={Library} 
              hideHeader={true}
            />
          </section>
        )}

        {coopLibrary.length > 0 && (
          <section>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Users2 size={20} className="text-emerald-500" />
              Obras Cooperativas
            </h3>
            <StoriesList 
              t={t} 
              stories={coopLibrary} 
              onAction={onRead} 
              onSecondaryAction={handlePublish}
              secondaryLabel={t.publishToGlobal}
              secondaryIcon={isPublishing ? Loader2 : UploadCloud}
              publishedIds={publishedIds}
              onDeleteClick={setSelectedForDelete} 
              onBack={onBack} 
              title={t.privateLibrary} 
              subtitle={t.privateLibrarySubtitle} 
              actionLabel={t.readBook} 
              icon={Users2} 
              hideHeader={true}
            />
          </section>
        )}

        {soloLibrary.length === 0 && coopLibrary.length === 0 && (
          <div className="py-32 text-center opacity-30 flex flex-col items-center gap-4">
            <Library size={48} className="text-slate-700" />
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
