



import React, { useState, useEffect } from 'react';
import { Users2, Copy, Play, CheckCircle, Wifi, UserPlus, Loader2, Sparkles, Trash2, X, RefreshCw, Mail, Share2, MessageCircle, Facebook, Instagram, HelpCircle } from 'lucide-react';
import { PageHeader, ConfirmModal, Toast, InteractiveTour } from '@/components';
import { joinCollaborationSession, updateSessionPhase, kickParticipant, regenerateSessionCode } from '@/services/services';

export const LobbyView = ({
   t,
   user,
   sessionCode: initialCode,
   onBack,
   onStartSetup,
   onSessionCodeChange
}: {
   t: any,
   user: any,
   sessionCode: string,
   onBack: () => void,
   onStartSetup: () => void,
   onSessionCodeChange?: (newCode: string) => void
}) => {
   const [sessionCode, setSessionCode] = useState(initialCode);
   const [participants, setParticipants] = useState<any[]>([]);
   const [isHost, setIsHost] = useState(false);
   const [copied, setCopied] = useState(false);
   const [loading, setLoading] = useState(false);
   const [showTour, setShowTour] = useState(false);

   // Kick Logic
   const [selectedToKick, setSelectedToKick] = useState<string | null>(null);
   const [kicked, setKicked] = useState(false);

   // Renovate Logic
   const [confirmRenovate, setConfirmRenovate] = useState(false);

   useEffect(() => {
      let interval: any;

      const fetchSession = async () => {
         try {
            const username = user.user_metadata?.username || user.email?.split('@')[0];
            const avatar = user.user_metadata?.avatar_url || user.user_metadata?.picture;

            // Faz join/refresh para obter lista atualizada
            const session = await joinCollaborationSession(sessionCode, user.id, username, avatar);

            if (session) {
               if (session.host_id === user.id) setIsHost(true);

               if (session.story_data?.participants) {
                  const parts = session.story_data.participants;
                  setParticipants(parts);

                  // Verificar se fui expulso (não estou na lista e não sou o host)
                  // Nota: O Host nunca se expulsa a si mesmo por engano nesta lógica simples
                  const amIHere = parts.some((p: any) => p.id === user.id);
                  if (!amIHere) {
                     setKicked(true);
                     setTimeout(() => onBack(), 3000); // Redirect after notice
                  }
               }

               // Se o status mudar para 'setup' ou 'active', avança automaticamente
               if (session.status === 'setup' || session.status === 'active') {
                  if (!kicked) onStartSetup();
               }
            }
         } catch (e) {
            console.error("Lobby sync error:", e);
         }
      };

      fetchSession(); // Initial fetch
      interval = setInterval(fetchSession, 2000); // Poll every 2s

      return () => clearInterval(interval);
   }, [sessionCode, user, kicked]);

   const handleCopyCode = async () => {
      try {
         await navigator.clipboard.writeText(sessionCode);
         setCopied(true);
         setTimeout(() => setCopied(false), 2000);
      } catch (e) { }
   };

   const getShareUrl = () => {
      return `${window.location.origin}?session=${sessionCode}`;
   };

   const handleShare = async () => {
      const url = getShareUrl();
      const text = `👋 Olá! Convido-te para escrevermos uma história juntos no IA Ventura.\n\n🔑 Código da Sessão: *${sessionCode}*\n\n🔗 Entra aqui: ${url}`;

      if (navigator.share) {
         try {
            await navigator.share({
               title: 'Convite para IA Ventura',
               text: text
            });
         } catch (e) {
            console.error("Erro ao partilhar:", e);
         }
      } else {
         // Fallback para clipboard se share nativo não suportado
         try {
            await navigator.clipboard.writeText(text);
            alert("Convite copiado para a área de transferência!");
         } catch (e) {
            handleCopyCode();
         }
      }
   };

   const handleStart = async () => {
      if (!isHost) return;
      setLoading(true);
      try {
         // Atualiza o estado da sessão para 'setup' na base de dados
         await updateSessionPhase(sessionCode, 'setup');
         onStartSetup();
      } catch (e) {
         console.error(e);
      } finally {
         setLoading(false);
      }
   };

   const executeKick = async () => {
      if (!selectedToKick || !isHost) return;
      try {
         await kickParticipant(sessionCode, selectedToKick);
         // A lista atualizará no próximo poll
      } catch (e) { console.error(e); }
      setSelectedToKick(null);
   };

   const handleRenovate = async () => {
      if (!isHost) return;
      try {
         // Usa dados mínimos para renovar o lobby
         const storyData = { participants, currentTurnIndex: 0, config: { charProfiles: [] } };
         const newSession = await regenerateSessionCode(sessionCode, storyData, user.id);
         if (newSession) {
            setSessionCode(newSession.code);
            if (onSessionCodeChange) onSessionCodeChange(newSession.code);
         }
      } catch (e) { console.error(e); }
      setConfirmRenovate(false);
   };

   if (kicked) {
      return (
         <div className="flex h-screen items-center justify-center p-6 text-center animate-in fade-in">
            <div className="space-y-4">
               <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                  <X size={40} />
               </div>
               <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t.kickedMessage}</h2>
               <p className="text-slate-500">A regressar ao menu...</p>
            </div>
         </div>
      );
   }

   const lobbyTourSteps = [
      {
         selector: '.tour-lobby-code',
         title: 'Código da Sessão',
         content: 'Este é o código único da tua sala. Partilha-o com os teus amigos para eles se juntarem a ti!',
         position: 'right' as const,
      },
      {
         selector: '.tour-lobby-share',
         title: 'Convite Rápido',
         content: 'Usa estes botões para copiar um link direto ou partilhar imediatamente nas redes sociais.',
         position: 'bottom' as const,
      },
      {
         selector: '.tour-lobby-participants',
         title: 'Autores na Sessão',
         content: 'Aqui vais ver quem já entrou na sala. O Anfitrião tem o poder de remover quem não foi convidado.',
         position: 'left' as const,
      },
      {
         selector: '.tour-lobby-start',
         title: 'Arrancar a Aventura',
         content: 'Quando todos os teus amigos estiverem na lista, o Anfitrião clica aqui para avançar para a configuração da história!',
         position: 'top' as const,
      }
   ];

   return (
      <div className="max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500 pb-20">
         <PageHeader t={t} title={t.lobbyTitle} subtitle={isHost ? t.host : t.waitingForPlayers} onBack={onBack} />

         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Lado Esquerdo: Info da Sessão */}
            <div className="space-y-6">
               <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-[40px] p-10 shadow-xl flex flex-col items-center text-center space-y-6 relative">

                  {/* Help Button */}
                  <button
                     onClick={(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         setShowTour(true);
                     }}
                     className="absolute top-6 left-6 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-gray-100 dark:bg-white/5 text-slate-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all flex items-center gap-1.5"
                     title={t.help}
                  >
                     <HelpCircle size={14} />
                     {t.help}
                  </button>

                  {/* Renovate Button (Host Only) */}
                  {isHost && (
                     <button
                        onClick={() => setConfirmRenovate(true)}
                        className="absolute top-6 right-6 p-2 text-slate-300 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl transition-all"
                        title={t.renovateCode}
                     >
                        <RefreshCw size={18} />
                     </button>
                  )}

                  <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-full flex items-center justify-center text-indigo-500 mb-2">
                     <Wifi size={40} />
                  </div>
                  <div className="relative group cursor-pointer tour-lobby-code" onClick={handleCopyCode}>
                     <h3 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-widest font-mono mb-2 flex items-center gap-3">
                        {sessionCode}
                        <div className={`p-2 rounded-xl transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-gray-100 dark:bg-white/5 text-slate-400 group-hover:text-indigo-500 group-hover:bg-indigo-50'}`}>
                           {copied ? <CheckCircle size={20} /> : <Copy size={20} />}
                        </div>
                     </h3>
                     <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{copied ? t.linkCopied : t.inviteCode}</p>
                  </div>

                  <div className="flex flex-col w-full gap-3 tour-lobby-share">
                     <button onClick={handleShare} className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-indigo-600 text-white hover:bg-indigo-500 rounded-2xl transition-all font-black uppercase tracking-widest text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5">
                        <Share2 size={18} />
                        {t.shareInvite || "Partilhar Convite"}
                     </button>

                     <div className="flex gap-2 w-full">
                        <button onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank')} className="flex-1 py-3 bg-[#1877F2]/10 text-[#1877F2] hover:bg-[#1877F2]/20 rounded-2xl transition-all flex items-center justify-center" title="Facebook">
                           <Facebook size={20} />
                        </button>
                        <button onClick={() => { handleCopyCode(); alert("Link copiado! Abre o Instagram e cola nas Stories ou DMs."); }} className="flex-1 py-3 bg-[#E4405F]/10 text-[#E4405F] hover:bg-[#E4405F]/20 rounded-2xl transition-all flex items-center justify-center" title="Instagram">
                           <Instagram size={20} />
                        </button>
                     </div>

                  </div>
               </div>

               {isHost ? (
                  <button
                     onClick={handleStart}
                     disabled={loading}
                     className="tour-lobby-start w-full py-6 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-[32px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 text-lg"
                  >
                     {loading ? <Loader2 className="animate-spin" /> : <Play size={24} className="fill-current" />}
                     {t.startGame}
                  </button>
               ) : (
                  <div className="tour-lobby-start p-6 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-3xl text-center">
                     <Loader2 className="animate-spin mx-auto mb-3 text-indigo-500" size={24} />
                     <p className="text-sm font-bold text-slate-500 animate-pulse">{t.setupWait}</p>
                  </div>
               )}
            </div>

            {/* Lado Direito: Lista de Participantes */}
            <div className="tour-lobby-participants bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/5 rounded-[40px] p-8 shadow-xl">
               <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                  <Users2 size={24} className="text-indigo-500" />
                  {t.turnParticipants}
                  <span className="bg-gray-100 dark:bg-white/10 text-slate-500 px-3 py-1 rounded-full text-xs font-black">{participants.length}</span>
               </h3>

               <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {participants.map((p, i) => (
                     <div key={p.id || i} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 rounded-3xl animate-in slide-in-from-right-2" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white dark:border-[#121214] shadow-sm">
                              {p.avatar ? (
                                 <img src={p.avatar} alt={p.name} className="w-full h-full object-cover" />
                              ) : (
                                 <div className="w-full h-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black text-lg">
                                    {p.name?.substring(0, 1)}
                                 </div>
                              )}
                           </div>
                           <div>
                              <h4 className="font-bold text-gray-900 dark:text-white text-lg">{p.name}</h4>
                              {p.id === user.id && <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 block">{t.assignedToYou}</span>}
                              {participants[0].id === p.id && p.id !== user.id && <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 block">{t.host}</span>}
                           </div>
                        </div>

                        {/* KICK BUTTON */}
                        {isHost && p.id !== user.id && (
                           <button
                              onClick={() => setSelectedToKick(p.id)}
                              className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                              title={t.kick}
                           >
                              <Trash2 size={18} />
                           </button>
                        )}
                     </div>
                  ))}

                  <div className="border-2 border-dashed border-gray-200 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center justify-center text-slate-400 gap-2 opacity-50">
                     <UserPlus size={24} />
                     <span className="text-xs font-bold uppercase tracking-widest">{t.waitingForPlayers}</span>
                  </div>
               </div>
            </div>
         </div>

         <ConfirmModal
            isOpen={!!selectedToKick}
            onClose={() => setSelectedToKick(null)}
            onConfirm={executeKick}
            title={t.kick}
            message={t.confirmKick}
            confirmText={t.kick}
            cancelText={t.cancel}
         />

         <ConfirmModal
            isOpen={confirmRenovate}
            onClose={() => setConfirmRenovate(false)}
            onConfirm={handleRenovate}
            title={t.renovateCode}
            message={t.confirmRenovate}
            confirmText={t.renovateCode}
            cancelText={t.cancel}
         />

         {showTour && (
            <InteractiveTour
               isOpen={true}
               steps={lobbyTourSteps}
               onClose={() => setShowTour(false)}
            />
         )}
      </div>
   );
};