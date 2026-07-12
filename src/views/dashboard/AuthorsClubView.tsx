import React, { useState, useEffect } from 'react';
import { Loader2, UserCircle } from 'lucide-react';
import { PageHeader } from '@/components';
import { databases, client, DATABASE_ID, COL_PUBLIC_STORIES, isCloudEnabled } from '@/services/services';
import { Query } from 'appwrite';

export const AuthorsClubView = ({ t, onViewAuthor, onBack }: { t: any, onViewAuthor: (id: string) => void, onBack: () => void }) => {
  const [authors, setAuthors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [publishedCounts, setPublishedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetch = async () => {
      if (!isCloudEnabled) return;

      try {
          // 1. Obter perfis
          const profilesRes = await databases.listDocuments(DATABASE_ID, 'profiles', [Query.orderDesc('stories_count')]);
          const profiles = profilesRes.documents;

          // 2. Obter contagem de obras publicadas
          const publicStoriesRes = await databases.listDocuments(DATABASE_ID, COL_PUBLIC_STORIES);
          const publicStories = publicStoriesRes.documents;

          const counts: Record<string, number> = {};
          publicStories?.forEach((s: any) => {
            counts[s.author_id] = (counts[s.author_id] || 0) + 1;
          });

          setPublishedCounts(counts);
          setAuthors(profiles || []);
      } catch(e) {}
      
      setLoading(false);
    };

    fetch();

    if (!isCloudEnabled) return;

    const unsubscribe = client.subscribe([
        `databases.${DATABASE_ID}.collections.profiles.documents`,
        `databases.${DATABASE_ID}.collections.${COL_PUBLIC_STORIES}.documents`
    ], response => {
        fetch();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="animate-in fade-in duration-500">
      <PageHeader t={t} title={t.authorsClub} subtitle={t.authorsSubtitle} onBack={onBack} />
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {authors.map(a => (
            <div key={a.$id} className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-[32px] p-8 flex flex-col items-center text-center space-y-4 group hover:bg-gray-50 dark:hover:bg-white/[0.03] transition-all shadow-sm">
              <div className="w-20 h-20 rounded-3xl bg-indigo-50 dark:bg-indigo-600/10 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform overflow-hidden">
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt={a.username} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={40} />
                )}
              </div>
              <div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white">{a.username}</h3>
                <div className="flex flex-col gap-1 mt-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{a.stories_count || 0} {t.privateWorks}</p>
                  <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">{publishedCounts[a.$id] || 0} {t.publishedWorks}</p>
                </div>
              </div>
              <button onClick={() => onViewAuthor(a.$id)} className="w-full py-3 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 hover:border-indigo-600 hover:text-white transition-all">{t.viewAuthorWorks}</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
