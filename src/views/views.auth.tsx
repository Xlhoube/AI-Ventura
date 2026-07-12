
import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader2, PenTool, Users, FileText, Globe, BookOpen } from 'lucide-react';
import { handleSocialLogin } from '@/services/auth.services'; // Importar função social

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

export const LandingView = ({ t, onAuth, onGuestLogin }: { t: any, onAuth: (e: any, mode: 'login' | 'signup') => Promise<void>, onGuestLogin: () => void }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [successMode, setSuccessMode] = useState(false);

  const [hasInvite, setHasInvite] = useState(false);
  const [oauthError, setOauthError] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('session')) {
      setMode('signup');
      setHasInvite(true);
    }
    if (params.get('error') === 'oauth_failed') {
      setOauthError(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try { 
      await onAuth(e, mode); 
      if (mode === 'signup') setSuccessMode(true);
    } catch (err) { 
      // Feedback tratado pelo App via Toast
    } finally { 
      setLoading(false); 
    }
  };

  const handleSocialClick = async () => {
    try {
      await handleSocialLogin('google');
    } catch (error) {
      console.error(error);
      // O erro será tratado pelo sistema global se necessário, ou redirecionado
    }
  };

  const features = [
    { icon: PenTool, title: t.feature1Title, desc: t.feature1Desc },
    { icon: Users, title: t.feature2Title, desc: t.feature2Desc },
    { icon: FileText, title: t.feature3Title, desc: t.feature3Desc },
    { icon: Globe, title: t.feature4Title, desc: t.feature4Desc },
  ];

  if (successMode) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in zoom-in duration-500">
        <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#121214] p-12 rounded-[40px] border border-emerald-500/20 text-center shadow-2xl">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="text-emerald-500" size={40} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{t.successTitle}</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{t.signupSuccess}</p>
          <button 
            onClick={() => { setSuccessMode(false); setMode('login'); }}
            className="w-full py-4 mt-8 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
          >
            {t.goToLogin}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4 animate-in fade-in duration-1000">
      <div className="w-full max-w-7xl grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        
        {/* LADO ESQUERDO: FEATURES CARD */}
        <div className="h-full bg-white dark:bg-[#121214] p-8 md:p-10 rounded-[40px] border border-gray-200 dark:border-white/5 shadow-2xl flex flex-col justify-center space-y-8 animate-in slide-in-from-left-4 duration-700 order-1">
          <div className="space-y-4">
             <h3 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white leading-tight">{t.landingDesc}</h3>
             <div className="w-20 h-1 bg-indigo-500 rounded-full"></div>
          </div>
          
          <div className="space-y-6">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t.featuresTitle}</h4>
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                {features.map((feat, i) => (
                  <div key={i} className="bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 p-5 rounded-3xl space-y-3 hover:bg-white dark:hover:bg-white/5 transition-colors shadow-sm">
                     <feat.icon className="text-indigo-500" size={24} />
                     <h5 className="font-bold text-gray-900 dark:text-white">{feat.title}</h5>
                     <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feat.desc}</p>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* LADO DIREITO: LOGIN CARD */}
        <div className="w-full h-full space-y-6 bg-white dark:bg-[#121214] p-8 md:p-10 rounded-[40px] border border-gray-200 dark:border-white/5 shadow-2xl transition-colors duration-300 flex flex-col justify-center relative overflow-hidden animate-in slide-in-from-right-4 duration-700 order-2">
          {/* Fundo subtil para dar profundidade ao logo */}
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent dark:from-indigo-900/10 pointer-events-none"></div>

          <div className="text-center space-y-4 mb-2">
            {/* LOGÓTIPO AI-VENTURA - Link Assinado */}
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-3">
                  {!logoError ? (
                      <img 
                          src="/logo.png" 
                          alt="AI-Ventura Logo" 
                          onError={() => setLogoError(true)}
                          className="w-20 h-20 rounded-[2rem] shadow-2xl shadow-indigo-500/40 rotate-3 hover:rotate-6 transition-transform object-cover"
                      />
                  ) : (
                      <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center rotate-3 shadow-2xl shadow-indigo-500/20 hover:rotate-6 transition-transform">
                          <BookOpen className="w-10 h-10 text-indigo-500" />
                      </div>
                  )}
                  <h1 className="font-black text-3xl tracking-tighter bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                      IA VENTURA
                  </h1>
              </div>
            </div>
            
            <div>
              <p className="text-slate-500 font-bold text-xs tracking-widest uppercase mb-1">{mode === 'login' ? t.login : t.signup}</p>
              {hasInvite ? (
                 <p className="text-indigo-500 text-[10px] font-black uppercase tracking-widest animate-pulse">🎉 Foste convidado para uma sessão!</p>
              ) : (
                 <p className="text-slate-400 text-[10px] font-medium">{t.landingTitle}</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <button onClick={handleSocialClick} className="w-full flex items-center justify-center gap-3 py-4 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/10 transition-all text-sm font-bold text-gray-700 dark:text-white shadow-sm group">
              <GoogleIcon />
              <span>Continuar com Google</span>
            </button>
            {oauthError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-xs rounded-xl text-center font-medium">
                Ocorreu um erro no login. Por favor verifica se ativaste o Google OAuth na consola do Appwrite.
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Ou continue com e-mail</span>
            <div className="h-px bg-gray-200 dark:bg-white/10 flex-1"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{t.username}</label>
                <input name="username" required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-gray-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="PenName" />
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{t.email}</label>
              <input name="email" type="email" required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-gray-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="autor@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">{t.password}</label>
              <input name="password" type="password" required className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl px-6 py-4 text-gray-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all" placeholder="••••••••" />
            </div>
            <button disabled={loading} className="w-full py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? t.login : t.signup)}
            </button>
          </form>
          <div className="text-center pt-4">
            <button onClick={() => setMode(mode === 'login' ? 'signup' : 'login')} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 transition-colors">
              {mode === 'login' ? t.noAccount : t.haveAccount}
            </button>
          </div>
          
          {/* SECÇÃO GUEST MODE */}
          <div className="pt-4 border-t border-gray-200 dark:border-white/10 mt-4 space-y-3">
              <button onClick={onGuestLogin} className="w-full py-3 border border-gray-200 dark:border-white/5 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/5 rounded-xl transition-all">
                  {t.guestLogin}
              </button>
              <p className="text-[10px] text-slate-400 text-center px-4 leading-relaxed font-medium">
                  {t.guestLoginDesc}
              </p>
          </div>
        </div>

      </div>
    </div>
  );
};
