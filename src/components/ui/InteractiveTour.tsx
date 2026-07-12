import React, { useState, useEffect, useLayoutEffect } from 'react';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

interface TourStep {
    selector: string;
    title: string;
    content: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
}

interface InteractiveTourProps {
    steps: TourStep[];
    isOpen: boolean;
    onClose: () => void;
}

export const InteractiveTour: React.FC<InteractiveTourProps> = ({ steps, isOpen, onClose }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

    const step = steps[currentStep];

    const updateCoords = (shouldScroll = false) => {
        if (!step) return;
        const element = document.querySelector(step.selector);
        if (element) {
            const rect = element.getBoundingClientRect();
            setCoords({
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height
            });
            if (shouldScroll) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    };

    useLayoutEffect(() => {
        if (isOpen) {
            // Pequeno delay para garantir que a transição do scroll termina ou começa
            setTimeout(() => updateCoords(true), 100);
            updateCoords(true);
        }
    }, [currentStep, isOpen]);

    useEffect(() => {
        const handleScrollOrResize = () => updateCoords(false);
        window.addEventListener('resize', handleScrollOrResize);
        window.addEventListener('scroll', handleScrollOrResize, true);
        return () => {
            window.removeEventListener('resize', handleScrollOrResize);
            window.removeEventListener('scroll', handleScrollOrResize, true);
        };
    }, [currentStep, isOpen]);

    if (!isOpen || !step) return null;

    const isLast = currentStep === steps.length - 1;

    return (
        <div id="ia-interactive-tour" className="fixed inset-0 z-[200] pointer-events-none">
            {/* Overlay com "buraco" (Spotlight) */}
            <div className="absolute inset-0 bg-black/60 dark:bg-black/80 transition-all duration-500" style={{
                clipPath: `polygon(0% 0%, 0% 100%, ${coords.left}px 100%, ${coords.left}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top + coords.height}px, ${coords.left}px ${coords.top + coords.height}px, ${coords.left}px 100%, 100% 100%, 100% 0%)`
            }} />

            {/* Borda de destaque */}
            <div
                className="absolute border-2 border-indigo-500 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0)] pointer-events-none transition-all duration-500"
                style={{
                    top: coords.top - 4,
                    left: coords.left - 4,
                    width: coords.width + 8,
                    height: coords.height + 8
                }}
            />

            {/* Tooltip */}
            <div
                className="absolute pointer-events-auto bg-white dark:bg-[#121214] border border-gray-200 dark:border-white/10 p-6 rounded-3xl shadow-2xl w-72 transition-all duration-500 animate-in zoom-in-95 fade-in-0"
                style={{
                    top: (coords.top + coords.height + 20 + 250 > window.innerHeight) 
                         ? Math.max(20, coords.top - 260) 
                         : coords.top + coords.height + 20,
                    left: Math.max(20, Math.min(window.innerWidth - 300, coords.left))
                }}
            >
                <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500">
                        Passo {currentStep + 1} de {steps.length}
                    </span>
                    <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
                        <X size={16} />
                    </button>
                </div>
                <h4 className="text-gray-900 dark:text-white font-black text-sm mb-2 uppercase tracking-tight">{step.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-6 italic">{step.content}</p>

                <div className="flex items-center justify-between">
                    <button
                        disabled={currentStep === 0}
                        onClick={() => setCurrentStep(prev => prev - 1)}
                        className={`p-2 rounded-xl transition-all ${currentStep === 0 ? 'opacity-30' : 'bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                    >
                        <ChevronLeft size={20} />
                    </button>

                    <button
                        onClick={() => isLast ? onClose() : setCurrentStep(prev => prev + 1)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-500/20 active:scale-95"
                    >
                        {isLast ? 'Finalizar' : 'Seguinte'}
                        {!isLast && <ChevronRight size={14} />}
                    </button>
                </div>
            </div>
        </div>
    );
};
