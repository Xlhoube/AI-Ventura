import React from 'react';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, RotateCw, Hand } from 'lucide-react';
import { Direction } from '../types';

interface CompassControlsProps {
    currentDir: Direction;
    onMove: (step: 'forward' | 'backward' | 'left' | 'right') => void;
    onTurn: (turn: 'left' | 'right') => void;
    onInteract: () => void;
    disabled?: boolean;
}

export const CompassControls: React.FC<CompassControlsProps> = ({
    currentDir,
    onMove,
    onTurn,
    onInteract,
    disabled = false
}) => {
    return (
        <div className="bg-slate-900/90 border border-amber-900/40 rounded-xl p-4 shadow-2xl backdrop-blur flex flex-col items-center select-none">
            {/* Header com Bússola */}
            <div className="flex items-center justify-between w-full mb-3 px-2">
                <span className="text-xs uppercase tracking-widest text-amber-500/80 font-mono font-semibold">Navegação</span>
                <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-0.5 rounded-full border border-amber-800/40 text-xs font-mono font-bold text-amber-400">
                    <span>DIR:</span>
                    <span className="text-white">{currentDir}</span>
                </div>
            </div>

            {/* Teclado Direcional Dungeon Master */}
            <div className="grid grid-cols-3 gap-2">
                {/* Linha Superior: Virar Esquerda, Frente, Virar Direita */}
                <button
                    disabled={disabled}
                    onClick={() => onTurn('left')}
                    title="Virar à Esquerda"
                    className="p-3 bg-slate-800 hover:bg-amber-950/60 active:bg-amber-800/40 text-amber-300 border border-slate-700 hover:border-amber-600/50 rounded-lg flex items-center justify-center transition shadow active:scale-95 disabled:opacity-50"
                >
                    <RotateCcw className="w-5 h-5" />
                </button>

                <button
                    disabled={disabled}
                    onClick={() => onMove('forward')}
                    title="Avançar (Frente)"
                    className="p-3 bg-gradient-to-b from-amber-600/30 to-amber-950/50 hover:from-amber-600/50 hover:to-amber-900/70 active:from-amber-500 active:to-amber-700 text-amber-200 border border-amber-500/40 rounded-lg flex items-center justify-center transition shadow-lg active:scale-95 disabled:opacity-50"
                >
                    <ArrowUp className="w-6 h-6" />
                </button>

                <button
                    disabled={disabled}
                    onClick={() => onTurn('right')}
                    title="Virar à Direita"
                    className="p-3 bg-slate-800 hover:bg-amber-950/60 active:bg-amber-800/40 text-amber-300 border border-slate-700 hover:border-amber-600/50 rounded-lg flex items-center justify-center transition shadow active:scale-95 disabled:opacity-50"
                >
                    <RotateCw className="w-5 h-5" />
                </button>

                {/* Linha Central: Strafe Esquerda, Interagir / Manipular, Strafe Direita */}
                <button
                    disabled={disabled}
                    onClick={() => onMove('left')}
                    title="Passo Lateral Esquerdo (Strafe)"
                    className="p-3 bg-slate-800 hover:bg-amber-950/60 active:bg-amber-800/40 text-amber-300 border border-slate-700 hover:border-amber-600/50 rounded-lg flex items-center justify-center transition shadow active:scale-95 disabled:opacity-50"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>

                <button
                    disabled={disabled}
                    onClick={onInteract}
                    title="Interagir / Examinar Alvo"
                    className="p-3 bg-emerald-950/40 hover:bg-emerald-900/60 active:bg-emerald-800 text-emerald-300 border border-emerald-600/40 rounded-lg flex items-center justify-center transition shadow active:scale-95 disabled:opacity-50"
                >
                    <Hand className="w-5 h-5" />
                </button>

                <button
                    disabled={disabled}
                    onClick={() => onMove('right')}
                    title="Passo Lateral Direito (Strafe)"
                    className="p-3 bg-slate-800 hover:bg-amber-950/60 active:bg-amber-800/40 text-amber-300 border border-slate-700 hover:border-amber-600/50 rounded-lg flex items-center justify-center transition shadow active:scale-95 disabled:opacity-50"
                >
                    <ArrowRight className="w-5 h-5" />
                </button>

                {/* Linha Inferior: Espaço Vazio, Recuar, Espaço Vazio */}
                <div />
                <button
                    disabled={disabled}
                    onClick={() => onMove('backward')}
                    title="Recuar (Trás)"
                    className="p-3 bg-slate-800 hover:bg-amber-950/60 active:bg-amber-800/40 text-amber-300 border border-slate-700 hover:border-amber-600/50 rounded-lg flex items-center justify-center transition shadow active:scale-95 disabled:opacity-50"
                >
                    <ArrowDown className="w-5 h-5" />
                </button>
                <div />
            </div>
        </div>
    );
};
