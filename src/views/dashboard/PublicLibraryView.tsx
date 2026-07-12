import React, { useState, useEffect } from 'react';
import { Globe, Loader2, Feather, GlobeLock } from 'lucide-react';
import { PageHeader, ConfirmModal } from '@/components';
import { supabase, getUserLikes, toggleStoryLike, unpublishStoryFromGlobal } from '@/services/services';

export const PublicLibraryView = ({ t, authorId, onRead, onBack }: { t: any, authorId?: string, onRead: (s: any) => void, onBack: () => void }) => {
  const [stories, setStories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [likedStories, setLikedStories] = useState<Set<string>>(new Set());
  
  const [selectedForRemoval, setSelectedForRemoval] = useState<any>(null);

  useEffect(() => {
    supabase?.auth.getUser().then(({ data }) => setCurrentUser(data.user?.id || null));
  }, []);

  useEffect(() => {
    const fetch = async () => {
      if (!supabase) return;
      
      // Carregar utilizador atual se ainda não carregou
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      setCurrentUser(userId || null);

      let query = supabase.from('public_stories').select('*');
      if (authorId) query = query.eq('author_id', authorId);
      const { data } = await query.order('votes', { ascending: false }); // Ordenar por aclamação
      setStories(data || []);

      // Carregar likes do utilizador
      if (userId) {
         const likes = await getUserLikes(userId);
         setLikedStories(new Set(likes));
      }

      setLoading(false);
    };
    fetch();
  }, [authorId]);

  const handleLike = async (story: any) => {
    if (!currentUser) return;
    
    const isAlreadyLiked = likedStories.has(story.id);
    const voteModifier = isAlreadyLiked ? -1 : 1;
    
    // Otimistic Update na Lista de Histórias
    setStories(prev => prev.map(s => {
       if (s.id === story.id) {
          // Garante que não desce abaixo de zero
          return { ...s, votes: Math.max(0, (s.votes || 0) + voteModifier) };
       }
       return s;
    }));

    // Otimistic Update no Estado Local de Likes
    setLikedStories(prev => {
       const newSet = new Set(prev);
       if (isAlreadyLiked) newSet.delete(story.id);
       else newSet.add(story.id);
       return newSet;
    });

    try {
      await toggleStoryLike(story.id, currentUser);
    } catch (e) {
      console.error(e);
      // Opcional: Reverter estado em caso de erro, mas para likes geralmente não é crítico
    }
  };

  const handleRemovePublic = async () => {
     if (!selectedForRemoval || !currentUser) return;
     try {
        await unpublishStoryFromGlobal(selectedForRemoval.id, currentUser);
        setStories(prev => prev.filter(s => s.id !== selectedForRemoval.id));
        alert(t.removedSuccess);
     } catch (e) {
        console.error(e);
     } finally {
        setSelectedForRemoval(null);
     }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader t={t} title={authorId ? t.authorBooksTitle : t.publicLibrary} subtitle={authorId ? '' : t.publicLibrarySubtitle} onBack={onBack} />
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
      ) : stories.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map(s => {
            const isLiked = likedStories.has(s.id);
            return (
              <div key={s.id} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-[32px] p-8 flex flex-col group hover:border-indigo-500/30 transition-all shadow-sm">
                <div className="flex justify-between items-start mb-2">
                   <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2">{s.title}</h3>
                   
                   <div className="flex flex-col gap-2">
                      {/* BOTÃO DE ACLAMAÇÃO (LIKE) */}
                      <button 
                          onClick={(e) => { e.stopPropagation(); handleLike(s); }}
                          className={`
                            flex flex-col items-center justify-center p-2 rounded-xl transition-all active:scale-90
                            ${isLiked 
                               ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' 
                               : 'bg-amber-50 dark:bg-amber-500/5 text-amber-500/60 hover:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-500/10'
                            }
                          `}
                          title={t.acclaim}
                      >
                          <Feather size={18} className={isLiked ? "fill-current" : ""} />
                          <span className="text-[9px] font-black">{s.votes || 0}</span>
                      </button>
                      
                      {/* BOTÃO DE REMOÇÃO (Se for o autor) */}
                      {currentUser === s.author_id && (
                         <button
                            onClick={(e) => { e.stopPropagation(); setSelectedForRemoval(s); }}
                            className="flex flex-col items-center justify-center p-2 rounded-xl bg-gray-50 dark:bg-white/5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                            title={t.removePublic}
                         >
                            <GlobeLock size={16} />
                         </button>
                      )}
                   </div>
                </div>
                <p className="text-slate-500 text-xs mb-6 italic">{t.author}: {s.author_name}</p>
                <button onClick={() => onRead(s)} className="mt-auto w-full py-4 bg-gray-100 dark:bg-white/5 group-hover:bg-indigo-600 text-gray-900 dark:text-white group-hover:text-white text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all">{t.readBook}</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-32 text-center opacity-30 flex flex-col items-center gap-4">
          <Globe size={48} className="text-slate-700" />
          <p className="font-bold text-slate-500 uppercase tracking-widest text-xs">{authorId ? t.noAuthorWorks : t.noStories}</p>
        </div>
      )}
      
      <ConfirmModal 
         isOpen={!!selectedForRemoval}
         onClose={() => setSelectedForRemoval(null)}
         onConfirm={handleRemovePublic}
         title={t.removePublic}
         message={t.confirmRemovePublic}
         confirmText={t.confirm}
         cancelText={t.cancel}
      />
    </div>
  );
};
