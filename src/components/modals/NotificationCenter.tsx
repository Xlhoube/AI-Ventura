import React, { useState, useEffect } from 'react';
import { Bell, Book, Loader2 } from 'lucide-react';
import { supabase } from '@/services/services';

export const NotificationCenter = ({ t, currentUser, isOpen, onClose, onReadStory }: { t: any, currentUser: any, isOpen: boolean, onClose: () => void, onReadStory: (s: any) => void }) => {
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = async () => {
        if (!currentUser || !supabase || !isOpen) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select('*, actor:profiles!actor_id(username), story:public_stories!story_id(title, messages, config, author_name)')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .limit(10);
            if (!error) setNotifications(data || []);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchNotifications(); }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="absolute right-0 top-16 w-80 md:w-96 bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-[32px] shadow-2xl z-[100] flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2">
            <div className="p-6 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                <h3 className="text-gray-900 dark:text-white font-black flex items-center gap-2"><Bell size={18} className="text-indigo-500 dark:text-indigo-400" /> {t.notifications}</h3>
                <button onClick={onClose} className="text-[10px] uppercase font-black tracking-widest text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors">{t.close}</button>
            </div>
            <div className="max-h-[400px] overflow-y-auto">
                {loading ? (
                    <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-500" /></div>
                ) : notifications.length > 0 ? (
                    notifications.map(n => (
                        <div
                            key={n.id}
                            onClick={() => { if (n.story) { onReadStory(n.story); onClose(); } }}
                            className="p-5 border-b border-gray-100 dark:border-white/5 cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-white/[0.03] flex items-start gap-4"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0"><Book size={18} /></div>
                            <div className="flex-1">
                                <p className="text-xs text-slate-600 dark:text-slate-200 leading-relaxed"><span className="font-bold text-gray-900 dark:text-white">{n.actor?.username}</span> {t.friendNewBook} <span className="italic">"{n.story?.title}"</span></p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="p-10 text-center opacity-40 flex flex-col items-center">
                        <Bell size={40} className="mb-4 text-slate-400 dark:text-slate-700" />
                        <p className="text-sm text-slate-500">{t.noNotifications}</p>
                    </div>
                )}
            </div>
        </div>
    );
};
