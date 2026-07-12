import React, { useState } from 'react';
import { HelpCircle, X, ChevronRight, ChevronLeft, Check, PlusCircle, FileText, Library, Globe, Users2, History } from 'lucide-react';

export const TutorialModal = ({ t, isOpen, onClose }: { t: any, isOpen: boolean, onClose: () => void }) => {
    const [currentStep, setCurrentStep] = useState(0);
    
    if (!isOpen) return null;
    
    const steps = [
        { 
            title: t.tutorialStep1, 
            desc: t.tutorialStep1Desc,
            icon: <PlusCircle className="w-12 h-12 text-indigo-500 mb-4" strokeWidth={1.5} />,
            color: 'from-indigo-500/20 to-transparent',
            badge: `${t.step || 'Passo'} 1`
        },
        { 
            title: t.tutorialStep2, 
            desc: t.tutorialStep2Desc,
            icon: <FileText className="w-12 h-12 text-amber-500 mb-4" strokeWidth={1.5} />,
            color: 'from-amber-500/20 to-transparent',
            badge: `${t.step || 'Passo'} 2`
        },
        { 
            title: t.tutorialStep3, 
            desc: t.tutorialStep3Desc,
            icon: <Library className="w-12 h-12 text-emerald-500 mb-4" strokeWidth={1.5} />,
            color: 'from-emerald-500/20 to-transparent',
            badge: `${t.step || 'Passo'} 3`
        },
        { 
            title: t.tutorialStep4, 
            desc: t.tutorialStep4Desc,
            icon: <Globe className="w-12 h-12 text-blue-500 mb-4" strokeWidth={1.5} />,
            color: 'from-blue-500/20 to-transparent',
            badge: `${t.step || 'Passo'} 4`
        },
        { 
            title: t.tutorialStep5, 
            desc: t.tutorialStep5Desc,
            icon: <Users2 className="w-12 h-12 text-rose-500 mb-4" strokeWidth={1.5} />,
            color: 'from-rose-500/20 to-transparent',
            badge: `${t.step || 'Passo'} 5`
        },
        { 
            title: t.tutorialStep6, 
            desc: t.tutorialStep6Desc,
            icon: <History className="w-12 h-12 text-slate-500 mb-4" strokeWidth={1.5} />,
            color: 'from-slate-500/20 to-transparent',
            badge: `${t.step || 'Passo'} 6`
        },
    ];

    const nextStep = () => {
        if (currentStep < steps.length - 1) setCurrentStep(c => c + 1);
    };

    const prevStep = () => {
        if (currentStep > 0) setCurrentStep(c => c - 1);
    };

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 w-full max-w-xl rounded-[32px] shadow-2xl overflow-hidden flex flex-col relative transition-all">
                
                {/* Header */}
                <div className="p-6 sm:p-8 flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                            <HelpCircle className="text-indigo-500" size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white leading-tight">{t.tutorialTitle}</h3>
                            <p className="text-[10px] sm:text-xs uppercase font-black tracking-widest text-slate-500 mt-0.5">{t.tutorialSubtitle || 'Como utilizar o AI-Ventura'}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => { setCurrentStep(0); onClose(); }} 
                        className="p-2 sm:p-2.5 bg-gray-100 dark:bg-white/5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 transition-colors group"
                    >
                        <X size={18} className="text-slate-500 group-hover:text-gray-900 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="px-6 sm:px-8 flex gap-2 mb-6">
                    {steps.map((_, i) => (
                        <div key={i} className="h-1 flex-1 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-indigo-500' : 'bg-transparent'}`} 
                            />
                        </div>
                    ))}
                </div>

                {/* Carousel Content */}
                <div className="flex-1 overflow-hidden relative min-h-[250px] sm:min-h-[280px]">
                    <div 
                        className="flex transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] h-full"
                        style={{ transform: `translateX(-${currentStep * 100}%)` }}
                    >
                        {steps.map((step, i) => (
                            <div key={i} className="min-w-full w-full h-full px-6 sm:px-8 pb-8 flex flex-col justify-center items-center text-center">
                                <div className={`absolute inset-0 bg-gradient-to-b ${step.color} opacity-20 pointer-events-none -z-10`} />
                                
                                <span className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-4">
                                    {step.badge}
                                </span>
                                
                                {step.icon}
                                
                                <h4 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mb-3">
                                    {step.title}
                                </h4>
                                
                                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-md">
                                    {step.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 sm:p-8 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/5 flex items-center justify-between gap-4">
                    <button 
                        onClick={prevStep}
                        disabled={currentStep === 0}
                        className="p-3 sm:px-6 sm:py-3.5 rounded-xl text-slate-500 font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-gray-200 dark:hover:bg-white/5 disabled:opacity-30 disabled:pointer-events-none transition-all flex items-center gap-2"
                    >
                        <ChevronLeft size={16} /> <span className="hidden sm:inline">{t.previous || 'Anterior'}</span>
                    </button>
                    
                    {currentStep < steps.length - 1 ? (
                        <button 
                            onClick={nextStep}
                            className="px-6 py-3.5 sm:px-8 sm:py-3.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-black text-xs sm:text-sm uppercase tracking-widest hover:scale-105 transition-all shadow-lg flex items-center gap-2"
                        >
                            {t.next || 'Próximo'} <ChevronRight size={16} />
                        </button>
                    ) : (
                        <button 
                            onClick={() => { setCurrentStep(0); onClose(); }}
                            className="px-6 py-3.5 sm:px-8 sm:py-3.5 rounded-xl bg-indigo-600 text-white font-black text-xs sm:text-sm uppercase tracking-widest hover:bg-indigo-500 hover:scale-105 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-2"
                        >
                            {t.start || 'Começar'} <Check size={16} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
