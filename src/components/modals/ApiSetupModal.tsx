import React, { useState } from 'react';
import { Key, ShieldCheck, HelpCircle, X, Check, ArrowRight, Info, Trash2, AlertTriangle } from 'lucide-react';
import { useAppStore, AIProvider } from '@/store/useAppStore';

interface ApiSetupModalProps {
    isOpen: boolean;
    onClose?: () => void;
    forceSetup?: boolean;
    t?: any;
}

export const ApiSetupModal: React.FC<ApiSetupModalProps> = ({ isOpen, onClose, forceSetup = false, t }) => {
    const { apiKeys, activeProvider, apiKeysStatus, setApiKeys, setApiKeyStatus, setActiveProvider } = useAppStore();
    const [currentProvider, setCurrentProvider] = useState<AIProvider>(activeProvider || 'google');
    const [keyValue, setKeyValue] = useState(apiKeys[activeProvider || 'google'] || '');
    const [saved, setSaved] = useState(false);

    if (!isOpen) return null;

    const providers = [
        { id: 'google', name: 'Google Gemini', color: 'text-blue-500', bg: 'bg-blue-500/10' },
        { id: 'openai', name: 'OpenAI (ChatGPT)', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        { id: 'anthropic', name: 'Anthropic (Claude)', color: 'text-amber-500', bg: 'bg-amber-500/10' }
    ] as const;

    const handleSave = () => {
        setApiKeys({ [currentProvider]: keyValue });
        setApiKeyStatus(currentProvider, 'valid');
        setActiveProvider(currentProvider);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        if (onClose && keyValue.trim() !== '') {
            setTimeout(onClose, 1000);
        }
    };

    const getHelpContent = (provider: AIProvider) => {
        switch (provider) {
            case 'google':
                return {
                    title: t?.howToGetGoogleKey || 'Como obter a chave da Google?',
                    steps: t?.googleSteps || [
                        'Acede ao Google AI Studio',
                        'Inicia sessão com a tua conta Google',
                        'Clica em "Get API key" no menu lateral',
                        'Clica no botão "Create API key"'
                    ],
                    link: 'https://aistudio.google.com/app/apikey'
                };
            case 'openai':
                return {
                    title: t?.howToGetOpenAIKey || 'Como obter a chave da OpenAI?',
                    steps: t?.openAISteps || [
                        'Acede à plataforma da OpenAI',
                        'Inicia sessão e adiciona saldo (é um serviço pago)',
                        'Vai a "API keys" no menu lateral',
                        'Clica em "Create new secret key"'
                    ],
                    link: 'https://platform.openai.com/api-keys'
                };
            case 'anthropic':
                return {
                    title: t?.howToGetAnthropicKey || 'Como obter a chave da Anthropic?',
                    steps: t?.anthropicSteps || [
                        'Acede à Consola da Anthropic',
                        'Inicia sessão e adiciona fundos',
                        'Vai a "Settings" > "API Keys"',
                        'Clica en "Create Key"'
                    ],
                    link: 'https://console.anthropic.com/settings/keys'
                };
        }
    };

    const helpContent = getHelpContent(currentProvider);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
                
                {/* Left Side: Setup Form */}
                <div className="flex-1 p-6 md:p-8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 dark:text-white">{t?.aiEngineTitle || 'Motor de IA'}</h2>
                            <p className="text-sm text-slate-500 mt-1">{t?.aiEngineDesc || 'Configura o teu assistente literário.'}</p>
                        </div>
                        {!forceSetup && onClose && (
                            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                                <X size={20} />
                            </button>
                        )}
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 rounded-xl p-3 mb-4 flex gap-3">
                        <Info className="text-blue-500 shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed font-medium">
                            {t?.apiKeyDesc || 'Para utilizar a Inteligência Artificial de forma ilimitada e gratuita, precisas de usar a tua própria chave (API Key) diretamente do fornecedor. As chaves de nível básico costumam ser gratuitas.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">{t?.provider || 'FORNECEDOR'}</label>
                            <div className="grid grid-cols-1 gap-2">
                                {providers.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => {
                                            setCurrentProvider(p.id as AIProvider);
                                            setKeyValue(apiKeys[p.id as AIProvider] || '');
                                        }}
                                        className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${
                                            currentProvider === p.id 
                                                ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' 
                                                : 'border-gray-200 dark:border-white/10 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-gray-50 dark:hover:bg-white/5'
                                        }`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${currentProvider === p.id ? p.bg : 'bg-gray-100 dark:bg-white/5'}`}>
                                            <ShieldCheck size={16} className={currentProvider === p.id ? p.color : 'text-slate-400'} />
                                        </div>
                                        <span className={`font-bold text-sm ${currentProvider === p.id ? 'text-gray-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {p.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t?.apiKeyLabel || 'CHAVE DE API (SECRET KEY)'}</label>
                                <a 
                                    href={helpContent.link} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="text-[10px] font-bold text-indigo-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
                                    title={`${t?.getKey || 'Obter chave'} ${providers.find(p => p.id === currentProvider)?.name}`}
                                >
                                    {t?.getKey || 'Obter Chave'} <ArrowRight size={10} />
                                </a>
                            </div>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Key size={16} className="text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={keyValue}
                                    onChange={(e) => setKeyValue(e.target.value)}
                                    placeholder="sk-..."
                                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:ring-2 ring-indigo-500/20 transition-all"
                                />
                            </div>
                            <p className="text-[10px] text-slate-400">{t?.apiKeyLocalSecurity || 'A chave é guardada localmente no teu dispositivo e nunca é enviada para os nossos servidores.'}</p>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={!keyValue.trim()}
                            className="w-full py-3.5 bg-indigo-600 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 text-white font-black uppercase tracking-widest text-xs rounded-xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10 flex items-center justify-center gap-2"
                        >
                            {saved ? <><Check size={16}/> {t?.saved || 'Guardado'}</> : (t?.saveAndContinue || 'Guardar e Continuar')}
                        </button>
                    </div>
                </div>

                {/* Right Side: Help Instructions */}
                <div className="w-full md:w-64 bg-gray-50 dark:bg-white/[0.02] p-6 border-t md:border-t-0 md:border-l border-gray-200 dark:border-white/5 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-500 mb-4">
                            <HelpCircle size={20} />
                            <h3 className="font-black text-sm">{t?.help || 'Ajuda'}</h3>
                        </div>

                        <div className="space-y-3">
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                            {helpContent.title}
                        </h4>
                        <ol className="space-y-3">
                            {helpContent.steps.map((step, i) => (
                                <li key={i} className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-2">
                                    <span className="font-bold text-slate-300 dark:text-slate-600">{i + 1}.</span>
                                    <span>{step}</span>
                                </li>
                            ))}
                        </ol>
                    </div>

                        <div className="mt-6 mb-4 pt-4 border-t border-gray-200 dark:border-white/10">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                                {t?.savedKeys || 'Chaves Guardadas'}
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                                {providers.filter(p => apiKeys[p.id as AIProvider]).length === 0 ? (
                                    <p className="text-xs text-slate-400 italic">Nenhuma chave guardada.</p>
                                ) : (
                                    providers.filter(p => apiKeys[p.id as AIProvider]).map(p => {
                                        const isExceeded = apiKeysStatus[p.id as AIProvider] === 'exceeded';
                                        const isActive = activeProvider === p.id;
                                        return (
                                            <div 
                                                key={p.id}
                                                onClick={() => {
                                                    setActiveProvider(p.id as AIProvider);
                                                    setCurrentProvider(p.id as AIProvider);
                                                    setKeyValue(apiKeys[p.id as AIProvider]);
                                                }}
                                                className={`group flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-all ${
                                                    isActive 
                                                        ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' 
                                                        : 'bg-white dark:bg-[#1A1A1E] border-gray-200 dark:border-white/5 hover:border-indigo-300 dark:hover:border-indigo-500/30'
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <div className={`w-2 h-2 rounded-full shrink-0 ${isExceeded ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                                                    <span className="text-xs font-bold text-gray-700 dark:text-slate-300 truncate">
                                                        {p.name.split(' ')[0]}
                                                    </span>
                                                    {isExceeded && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setApiKeys({ [p.id]: '' });
                                                        setApiKeyStatus(p.id as AIProvider, 'valid');
                                                        if (currentProvider === p.id) setKeyValue('');
                                                    }}
                                                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Apagar chave"
                                                >
                                                    <Trash2 size={12} />
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    <a 
                        href={helpContent.link} 
                        target="_blank" 
                        rel="noreferrer"
                        className="mt-4 flex items-center justify-center gap-2 py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                    >
                        {t?.getKey || 'Obter Chave'} <ArrowRight size={14} />
                    </a>
                </div>

            </div>
        </div>
    );
};
