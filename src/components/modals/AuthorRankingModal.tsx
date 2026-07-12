import React, { useState } from 'react';
import { Trophy, X, Calendar, Medal } from 'lucide-react';

export const AuthorRankingModal = ({ t, isOpen, onClose }: { t: any, isOpen: boolean, onClose: () => void }) => {
    const [quarter, setQuarter] = useState(1);

    if (!isOpen) return null;

    // Dados fictícios para demonstração (Poderiam vir do Appwrite no futuro)
    const rankingData: Record<number, any[]> = {
        1: [
            { name: 'Afonso Cruz', works: 42, points: 1250, medal: 'gold' },
            { name: 'Beatriz Pereira', works: 38, points: 1100, medal: 'silver' },
            { name: 'Carlos Silva', works: 35, points: 950, medal: 'bronze' },
            { name: 'Diana Martins', works: 30, points: 800 },
            { name: 'Eduardo Santos', works: 28, points: 750 },
        ],
        2: [
            { name: 'Beatriz Pereira', works: 45, points: 1300, medal: 'gold' },
            { name: 'Afonso Cruz', works: 40, points: 1200, medal: 'silver' },
            { name: 'Eduardo Santos', works: 36, points: 1050, medal: 'bronze' },
            { name: 'Filipa Rocha', works: 32, points: 850 },
            { name: 'Carlos Silva', works: 30, points: 800 },
        ],
        3: [
            { name: 'Gabriel Sousa', works: 50, points: 1500, medal: 'gold' },
            { name: 'Beatriz Pereira', works: 48, points: 1450, medal: 'silver' },
            { name: 'Diana Martins', works: 42, points: 1250, medal: 'bronze' },
            { name: 'Afonso Cruz', works: 38, points: 1100 },
            { name: 'Helena Costa', works: 35, points: 950 },
        ]
    };

    const currentRanking = rankingData[quarter] || [];

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/50 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-2xl rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center">
                            <Trophy className="text-amber-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{t.authorRankingTitle || 'Ranking de Autores'}</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t.topAuthors || 'Os melhores do trimestre'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X size={20} className="text-slate-500 dark:text-white" /></button>
                </div>

                <div className="p-6 bg-gray-50 dark:bg-white/5 flex gap-2">
                    {[1, 2, 3].map(q => (
                        <button
                            key={q}
                            onClick={() => setQuarter(q)}
                            className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${quarter === q ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'bg-white dark:bg-white/5 text-slate-500 border border-gray-200 dark:border-white/10'}`}
                        >
                            <Calendar size={14} />
                            {q}º Trimestre
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-4">
                        {currentRanking.map((author, index) => (
                            <div key={index} className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:border-indigo-500/50 transition-all group">
                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-white/5 shadow-sm flex items-center justify-center font-black text-slate-400 group-hover:text-indigo-500 transition-colors">
                                    {index + 1}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        {author.name}
                                        {author.medal === 'gold' && <Medal size={16} className="text-amber-500" />}
                                        {author.medal === 'silver' && <Medal size={16} className="text-slate-400" />}
                                        {author.medal === 'bronze' && <Medal size={16} className="text-amber-700" />}
                                    </h4>
                                    <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{author.works} Obras Publicadas</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-indigo-500">{author.points}</p>
                                    <p className="text-[9px] uppercase font-black tracking-widest text-slate-400">Pontos</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 dark:border-white/5 bg-gray-50 dark:bg-black/40 flex justify-center">
                    <button onClick={onClose} className="px-12 py-4 rounded-2xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all">
                        {t.close}
                    </button>
                </div>
            </div>
        </div>
    );
};
