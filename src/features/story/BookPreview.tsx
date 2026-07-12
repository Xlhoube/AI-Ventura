import React, { useState } from 'react';
import { ChevronLeft, Download, Edit3, Globe, Loader2 } from 'lucide-react';
import { renderNarrativeWithBreaks } from '@/utils/utils';
import { translateManuscript } from '@/services/ai';
import { Language } from '@/utils/constants';
import { ConfirmModal } from '@/components';

export const BookPreview = ({ t, story, onBack, onReopen, userLang }: { t: any, story: any, onBack: () => void, onReopen: (s: any) => void, userLang?: Language }) => {
    const [isTranslated, setIsTranslated] = useState(false);
    const [translationLoading, setTranslationLoading] = useState(false);
    const [translationCache, setTranslationCache] = useState<Partial<Record<Language, { title: string, content: string }>>>({});
    const [currentTranslatedLang, setCurrentTranslatedLang] = useState<Language | null>(null);

    const [confirmReopen, setConfirmReopen] = useState(false);

    const manuscriptContent = story.manuscript?.content || story.messages?.filter((m: any) => m.role === 'ai').map((m: any) => m.content).join('\n\n') || '';

    const manuscript = {
        title: story.manuscript?.title || story.title,
        synopsis: story.manuscript?.synopsis || '',
        content: manuscriptContent
    };

    const originalLang = story.original_language || 'en';
    // Permitir tradução sempre que houver um idioma de utilizador definido, para garantir acessibilidade
    const showTranslateButton = !!userLang;

    const handleTranslate = async (targetLang: Language) => {
        if (isTranslated && currentTranslatedLang === targetLang) {
            setIsTranslated(false);
            return;
        }

        setCurrentTranslatedLang(targetLang);

        if (translationCache[targetLang]) {
            setIsTranslated(true);
            return;
        }

        setTranslationLoading(true);
        try {
            const tTitle = await translateManuscript(manuscript.title, targetLang);
            const tContent = await translateManuscript(manuscript.content, targetLang);
            setTranslationCache(prev => ({
                ...prev,
                [targetLang]: { title: tTitle, content: tContent }
            }));
            setIsTranslated(true);
        } catch (e) {
            console.error("Translation failed", e);
        } finally {
            setTranslationLoading(false);
        }
    };

    const displayTitle = isTranslated && currentTranslatedLang && translationCache[currentTranslatedLang] ? translationCache[currentTranslatedLang]!.title : manuscript.title;
    const displayContent = isTranslated && currentTranslatedLang && translationCache[currentTranslatedLang] ? translationCache[currentTranslatedLang]!.content : manuscript.content;

    return (
        <div className="max-w-6xl mx-auto pb-20 animate-in fade-in duration-1000">
            <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
                <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-gray-900 dark:hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"><ChevronLeft size={18} /> {t.back}</button>

                <div className="flex items-center gap-2">
                    {['pt', 'en', 'fr'].filter(l => l !== originalLang).map((lang) => {
                        const isThisLang = isTranslated && currentTranslatedLang === lang;
                        const isLoadingThis = translationLoading && currentTranslatedLang === lang;
                        return (
                            <button
                                key={lang}
                                onClick={() => handleTranslate(lang as Language)}
                                disabled={translationLoading && !isLoadingThis}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border ${isThisLang ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20'}`}
                                title={`Traduzir para ${lang.toUpperCase()}`}
                            >
                                {isLoadingThis ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} />}
                                {isLoadingThis ? t.translating : (isThisLang ? t.showOriginal : `${t.translate} (${lang.toUpperCase()})`)}
                            </button>
                        );
                    })}

                    <button onClick={() => setConfirmReopen(true)} className="flex items-center gap-2 px-6 py-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-500/20">
                        <Edit3 size={16} /> {t.reopenBook}
                    </button>
                    <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-gray-200 dark:border-white/10">
                        <Download size={16} /> {t.downloadPDF}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1a1a1c] p-12 md:p-24 rounded-[60px] shadow-2xl border border-gray-100 dark:border-white/5 space-y-16 print:bg-white print:text-black print:p-8 transition-colors duration-300">
                <div className="text-center space-y-8">
                    <h1 className="text-4xl md:text-6xl font-serif text-gray-900 dark:text-white italic leading-tight print:text-black">{displayTitle}</h1>
                    <div className="w-20 h-1 bg-indigo-500 mx-auto rounded-full opacity-50"></div>
                    <p className="text-[12px] font-black uppercase tracking-[0.4em] text-indigo-500 dark:text-indigo-400">{story.author_name}</p>
                </div>

                {manuscript.synopsis && !isTranslated && (
                    <div className="py-12 border-y border-gray-200 dark:border-white/5 space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{t.synopsis}</h4>
                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic text-lg">{manuscript.synopsis}</p>
                    </div>
                )}

                <div className="prose prose-lg dark:prose-invert max-w-none">
                    <div className="font-serif text-xl leading-[2] text-gray-800 dark:text-slate-200 print:text-black first-letter:text-6xl first-letter:font-black first-letter:mr-3 first-letter:float-left first-letter:text-indigo-500">
                        {renderNarrativeWithBreaks(displayContent)}
                    </div>
                </div>
            </div>

            <div className="mt-16 flex justify-center">
                <button
                    onClick={onBack}
                    className="px-12 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest text-xs transition-all shadow-lg border border-transparent dark:border-white/5"
                >
                    {t.backToHome}
                </button>
            </div>

            <ConfirmModal
                isOpen={confirmReopen}
                onClose={() => setConfirmReopen(false)}
                onConfirm={() => onReopen(story)}
                title={t.reopenBook}
                message={t.reopenWarn}
                confirmText={t.confirm}
                cancelText={t.cancel}
            />
        </div>
    );
};
