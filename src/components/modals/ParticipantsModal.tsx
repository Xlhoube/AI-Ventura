import React, { useState } from 'react';
import { Users, CheckCircle, Copy, RefreshCw, Mail, Link as LinkIcon, Bell, Trash2, X } from 'lucide-react';
import { kickParticipant } from '@/services/services';
import { ConfirmModal } from './ConfirmModal';

export const ParticipantsModal = ({
    t,
    isOpen,
    onClose,
    sessionCode,
    participants,
    currentUserId,
    isHost,
    currentTurnIndex,
    onNudge,
    onRenovate
}: {
    t: any,
    isOpen: boolean,
    onClose: () => void,
    sessionCode: string,
    participants: any[],
    currentUserId: string,
    isHost: boolean,
    currentTurnIndex?: number,
    onNudge?: (playerId: string) => void,
    onRenovate?: () => void
}) => {
    const [copiedLink, setCopiedLink] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);
    const [selectedToKick, setSelectedToKick] = useState<string | null>(null);

    // Renovate State
    const [confirmRenovate, setConfirmRenovate] = useState(false);

    if (!isOpen || !sessionCode) return null;

    const inviteLink = `${window.location.origin}?session=${sessionCode}`;

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(inviteLink);
            setCopiedLink(true);
            setTimeout(() => setCopiedLink(false), 2000);
        } catch (e) { console.error(e); }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(sessionCode);
            setCopiedCode(true);
            setTimeout(() => setCopiedCode(false), 2000);
        } catch (e) { console.error(e); }
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(t.inviteSubject);
        const body = encodeURIComponent(t.inviteBody(sessionCode, inviteLink));
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const handleKick = async (id: string) => {
        try {
            await kickParticipant(sessionCode, id);
        } catch (e) { console.error(e); }
        setSelectedToKick(null);
    };

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/60 dark:bg-black/90 backdrop-blur-md animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-lg rounded-[40px] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 relative max-h-[90vh]">
                <div className="p-8 border-b border-gray-200 dark:border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <Users className="text-indigo-500" size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">{t.managePlayers}</h3>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{t.inviteDesc}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"><X size={20} className="text-slate-500 dark:text-white" /></button>
                </div>

                <div className="flex-1 p-8 space-y-8 overflow-y-auto">
                    {/* SECÇÃO DE CÓDIGO */}
                    <div className="space-y-4">
                        <div className="bg-gray-100 dark:bg-white/5 rounded-3xl p-6 text-center space-y-3 border border-gray-200 dark:border-white/10 relative group">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">{t.enterCode}</span>
                            <div className="text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-widest font-mono selection:bg-indigo-500/30">{sessionCode}</div>

                            <button
                                onClick={handleCopyCode}
                                className="absolute top-2 right-2 p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-slate-400 hover:text-indigo-500 transition-all"
                                title={t.copy}
                            >
                                {copiedCode ? <CheckCircle size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>

                            {isHost && onRenovate && (
                                <button
                                    onClick={() => setConfirmRenovate(true)}
                                    className="absolute top-2 left-2 p-2 rounded-xl hover:bg-white dark:hover:bg-white/10 text-slate-400 hover:text-amber-500 transition-all"
                                    title={t.renovateCode}
                                >
                                    <RefreshCw size={16} />
                                </button>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleEmail} className="flex-1 py-3 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all border border-gray-200 dark:border-white/10">
                                <Mail size={16} /> {t.sendEmail}
                            </button>
                            <button onClick={handleCopyLink} className={`flex-1 py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold transition-all border border-transparent ${copiedLink ? 'bg-emerald-500 text-white' : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300 border-gray-200 dark:border-white/10'}`}>
                                {copiedLink ? <CheckCircle size={16} /> : <LinkIcon size={16} />} {copiedLink ? t.linkCopied : t.copyLink}
                            </button>
                        </div>
                    </div>

                    {/* LISTA DE PARTICIPANTES */}
                    <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-gray-200 dark:border-white/10 pb-2 mb-2">{t.turnParticipants} ({participants.length})</h4>
                        {participants.map((p, i) => {
                            const isTurn = currentTurnIndex === i;
                            return (
                                <div key={p.id} className={`flex items-center justify-between p-3 rounded-2xl transition-colors ${isTurn ? 'bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20' : 'hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-white/10">
                                            {p.avatar ? <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">{p.name?.[0]}</div>}
                                            {isTurn && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-black"></span>}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                {p.name}
                                                {p.id === currentUserId && <span className="text-[9px] bg-emerald-100 text-emerald-600 px-2 rounded-full">{t.assignedToYou}</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        {isTurn && p.id !== currentUserId && onNudge && (
                                            <button
                                                onClick={() => onNudge(p.id)}
                                                className="p-2 text-amber-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all"
                                                title={t.nudge}
                                            >
                                                <Bell size={16} />
                                            </button>
                                        )}
                                        {isHost && p.id !== currentUserId && (
                                            <button
                                                onClick={() => setSelectedToKick(p.id)}
                                                className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                                                title={t.kick}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <ConfirmModal
                isOpen={!!selectedToKick}
                onClose={() => setSelectedToKick(null)}
                onConfirm={() => selectedToKick && handleKick(selectedToKick)}
                title={t.kick}
                message={t.confirmKick}
                confirmText={t.kick}
                cancelText={t.cancel}
            />

            <ConfirmModal
                isOpen={confirmRenovate}
                onClose={() => setConfirmRenovate(false)}
                onConfirm={() => { onRenovate && onRenovate(); setConfirmRenovate(false); }}
                title={t.renovateCode}
                message={t.confirmRenovate}
                confirmText={t.renovateCode}
                cancelText={t.cancel}
            />
        </div>
    );
};
