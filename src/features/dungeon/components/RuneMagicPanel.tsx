import React, { useState } from 'react';
import { Sparkles, X, Flame, ShieldAlert, Zap, RefreshCw } from 'lucide-react';
import { RUNE_POWERS, RUNE_ELEMENTS, RUNE_FORMS, RUNE_TARGETS, SPELL_BOOK } from '../magicSystem';
import { RunePower, RuneElement, RuneForm, RuneTarget, Champion } from '../types';

interface RuneMagicPanelProps {
    caster: Champion;
    onCastSpell: (spellName: string, formula: string, powerCost: number) => void;
    onClose?: () => void;
}

export const RuneMagicPanel: React.FC<RuneMagicPanelProps> = ({
    caster,
    onCastSpell,
    onClose
}) => {
    const [selectedPower, setSelectedPower] = useState<RunePower | null>(null);
    const [selectedElement, setSelectedElement] = useState<RuneElement | null>(null);
    const [selectedForm, setSelectedForm] = useState<RuneForm | null>(null);
    const [selectedTarget, setSelectedTarget] = useState<RuneTarget | null>(null);

    // Etapa atual de seleção (0: Power, 1: Element, 2: Form, 3: Target / Cast)
    const currentStep = !selectedPower ? 0 : !selectedElement ? 1 : !selectedForm ? 2 : 3;

    const currentFormula = [selectedElement, selectedForm, selectedTarget].filter(Boolean).join(' ');
    const matchedSpell = SPELL_BOOK[currentFormula];

    const getPowerCost = () => {
        if (!selectedPower) return 0;
        const pObj = RUNE_POWERS.find(p => p.symbol === selectedPower);
        const mult = pObj ? pObj.cost : 2;
        const spellMult = matchedSpell ? matchedSpell.manaCostMultiplier : 1;
        return Math.round(mult * spellMult);
    };

    const handleClear = () => {
        setSelectedPower(null);
        setSelectedElement(null);
        setSelectedForm(null);
        setSelectedTarget(null);
    };

    const handleCast = () => {
        if (!selectedPower) return;
        const formula = [selectedElement, selectedForm, selectedTarget].filter(Boolean).join(' ');
        const name = matchedSpell ? matchedSpell.name : (formula || 'Faísca Espiritual');
        onCastSpell(name, `${selectedPower} ${formula}`, getPowerCost());
        handleClear();
    };

    return (
        <div className="bg-slate-950/95 border border-purple-900/50 rounded-2xl p-4 shadow-2xl backdrop-blur-md flex flex-col gap-3 max-w-md w-full">
            {/* Header com Nome do Conjurador e Mana */}
            <div className="flex items-center justify-between border-b border-purple-900/40 pb-2">
                <div className="flex items-center gap-2">
                    <span className="text-xl">{caster.avatar}</span>
                    <div>
                        <div className="text-sm font-bold text-purple-200">{caster.name}</div>
                        <div className="text-xs text-purple-400 font-mono">Mana: {caster.mana}/{caster.maxMana}</div>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleClear}
                        title="Limpar Runas"
                        className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Display de Runas Selecionadas */}
            <div className="bg-slate-900 border border-purple-900/30 rounded-xl p-3 flex items-center justify-between min-h-[52px]">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-purple-400/80 font-mono uppercase">Grimório:</span>
                    <div className="flex items-center gap-1.5 font-mono text-sm font-bold text-amber-300">
                        {selectedPower && <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded">{selectedPower}</span>}
                        {selectedElement && <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/40 rounded">{selectedElement}</span>}
                        {selectedForm && <span className="px-2 py-0.5 bg-emerald-500/20 border border-emerald-500/40 rounded">{selectedForm}</span>}
                        {selectedTarget && <span className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/40 rounded">{selectedTarget}</span>}
                        {!selectedPower && <span className="text-slate-500 italic text-xs">Selecione uma runa de poder...</span>}
                    </div>
                </div>
                {selectedPower && (
                    <div className="text-xs font-mono text-cyan-400">
                        Custo: {getPowerCost()} MP
                    </div>
                )}
            </div>

            {/* Teclados Rúnicos Baseados no Passo Atual */}
            <div className="grid grid-cols-3 gap-2">
                {currentStep === 0 && (
                    <>
                        <div className="col-span-3 text-xs font-semibold text-amber-400/90 font-mono uppercase mb-1">1. Escolha a Potência (Power Rune)</div>
                        {RUNE_POWERS.map(p => (
                            <button
                                key={p.symbol}
                                onClick={() => setSelectedPower(p.symbol)}
                                className="p-2.5 bg-slate-900/80 hover:bg-amber-950/50 border border-slate-800 hover:border-amber-500/40 rounded-lg text-left transition active:scale-95 flex flex-col"
                            >
                                <span className="font-bold text-amber-300 font-mono text-sm">{p.symbol}</span>
                                <span className="text-[10px] text-slate-400">{p.name.split(' ')[1]}</span>
                            </button>
                        ))}
                    </>
                )}

                {currentStep === 1 && (
                    <>
                        <div className="col-span-3 text-xs font-semibold text-blue-400/90 font-mono uppercase mb-1">2. Escolha o Elemento (Element Rune)</div>
                        {RUNE_ELEMENTS.map(e => (
                            <button
                                key={e.symbol}
                                onClick={() => setSelectedElement(e.symbol)}
                                className="p-2.5 bg-slate-900/80 hover:bg-blue-950/50 border border-slate-800 hover:border-blue-500/40 rounded-lg text-left transition active:scale-95 flex flex-col"
                            >
                                <span className="font-bold text-blue-300 font-mono text-sm">{e.symbol}</span>
                                <span className="text-[10px] text-slate-400">{e.domain}</span>
                            </button>
                        ))}
                    </>
                )}

                {currentStep === 2 && (
                    <>
                        <div className="col-span-3 text-xs font-semibold text-emerald-400/90 font-mono uppercase mb-1">3. Escolha a Forma / Efeito (Form Rune)</div>
                        {RUNE_FORMS.map(f => (
                            <button
                                key={f.symbol}
                                onClick={() => setSelectedForm(f.symbol)}
                                className="p-2.5 bg-slate-900/80 hover:bg-emerald-950/50 border border-slate-800 hover:border-emerald-500/40 rounded-lg text-left transition active:scale-95 flex flex-col"
                            >
                                <span className="font-bold text-emerald-300 font-mono text-sm">{f.symbol}</span>
                                <span className="text-[10px] text-slate-400">{f.type}</span>
                            </button>
                        ))}
                    </>
                )}

                {currentStep === 3 && (
                    <>
                        <div className="col-span-3 text-xs font-semibold text-purple-400/90 font-mono uppercase mb-1">4. Direcionamento (Target Rune - Opcional)</div>
                        {RUNE_TARGETS.map(t => (
                            <button
                                key={t.symbol}
                                onClick={() => setSelectedTarget(t.symbol)}
                                className="p-2.5 bg-slate-900/80 hover:bg-purple-950/50 border border-slate-800 hover:border-purple-500/40 rounded-lg text-left transition active:scale-95 flex flex-col"
                            >
                                <span className="font-bold text-purple-300 font-mono text-sm">{t.symbol}</span>
                                <span className="text-[10px] text-slate-400">{t.name.split(' ')[1]}</span>
                            </button>
                        ))}
                    </>
                )}
            </div>

            {/* Descrição do Feitiço Identificado */}
            {matchedSpell && (
                <div className="bg-purple-950/30 border border-purple-800/40 p-2.5 rounded-lg text-xs text-purple-200">
                    <div className="font-bold text-amber-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        {matchedSpell.name}
                    </div>
                    <div className="text-purple-300/80 mt-0.5">{matchedSpell.description}</div>
                </div>
            )}

            {/* Botão de Conjurar */}
            <button
                disabled={!selectedPower || caster.mana < getPowerCost()}
                onClick={handleCast}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:from-purple-700 active:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <Zap className="w-4 h-4 text-amber-300" />
                Conjurar Feitiço
            </button>
        </div>
    );
};
