import React, { useState } from 'react';
import { Sparkles, Shield, Compass, BookOpen, User, Wand2, ArrowRight } from 'lucide-react';
import { DMCampaign, CampaignSetting, DMStyle, DMCharacter } from './types';

interface CampaignSetupProps {
    onStartCampaign: (campaign: DMCampaign) => void;
    onCancel?: () => void;
}

const SETTINGS_OPTIONS: { id: CampaignSetting; name: string; desc: string; icon: string }[] = [
    { id: 'dark_fantasy', name: 'Fantasia Sombria & Mistério', desc: 'Reinos decadentes, maldições antigas, ruínas e segredos esquecidos.', icon: '🏰' },
    { id: 'high_fantasy', name: 'Alta Fantasia & Lendas', desc: 'Magia vibrante, criaturas míticas, reinos épicos e grandes profecias.', icon: '🐉' },
    { id: 'cosmic_horror', name: 'Terror Cósmico & Ocultismo', desc: 'Segredos ancestrais, cultos sombrios e o confronto com o desconhecido.', icon: '🐙' },
    { id: 'cyberpunk', name: 'Cyberpunk & Distopia', desc: 'Megacorporações, implantes neurais, ruas chuvosas e conspirações digitais.', icon: '🌆' },
    { id: 'steampunk_mystery', name: 'Mistério Vitoriano Steampunk', desc: 'Dirigíveis a vapor, engrenagens douradas e conspirações na névoa.', icon: '⚙️' },
    { id: 'post_apocalyptic', name: 'Ermos Pós-Apocalípticos', desc: 'Mundos em ruínas, escassez de recursos, sobrevivência e mistérios do passado.', icon: '☢️' },
];

const PRESET_CHARACTERS: DMCharacter[] = [
    {
        id: 'c-1',
        name: 'Valerius de Ravencrest',
        title: 'O Investigador Arcano',
        archetype: 'Erudito & Ocultista',
        avatar: '🧙‍♂️',
        biography: 'Ex-membro do Conselho dos Magos que viaja em busca de grimórios proibidos para decifrar a névoa do destino.',
        traits: ['Mente Analítica', 'Curiosidade Insaciável', 'Conhecimento Proibido'],
        inventory: ['Grimório de Notas', 'Lanterna de Óleo Arcano', 'Adaga de Prata Antiga'],
        specialAbilities: ['Decifrar Línguas Mortas', 'Sentir Perturbações Mágicas']
    },
    {
        id: 'c-2',
        name: 'Lyra das Sombras',
        title: 'A Espia do Vento',
        archetype: 'Ladina & Batedora',
        avatar: '🧝‍♀️',
        biography: 'Criada nas ruelas e telhados das grandes capitais, mestre em infiltração, pistas e camuflagem.',
        traits: ['Passos Silenciosos', 'Olhar Atento a Detalhes', 'Astúcia Urbana'],
        inventory: ['Gazuas de Aço Forjado', 'Manto Camaleónico', 'Frasco de Fumo Ilusório'],
        specialAbilities: ['Desarmar Mecanismos Complexos', 'Desaparecer nas Sombras']
    },
    {
        id: 'c-3',
        name: 'Gareth Machado-de-Ferro',
        title: 'O Veterano Errante',
        archetype: 'Cavaleiro Andante',
        avatar: '🛡️',
        biography: 'Um guerreiro que jurou proteger os inocentes e desvendar a verdade por trás da queda do seu antigo batalhão.',
        traits: ['Honra Inabalável', 'Resistência Férrea', 'Intuição Tática'],
        inventory: ['Espada Bastarda Hereditária', 'Escudo com Brasão Desgastado', 'Rações de Viagem'],
        specialAbilities: ['Liderança Inspiradora', 'Postura Defensiva']
    }
];

export const CampaignSetup: React.FC<CampaignSetupProps> = ({ onStartCampaign, onCancel }) => {
    const [title, setTitle] = useState('A Maldição das Brumas Esquecidas');
    const [setting, setSetting] = useState<CampaignSetting>('dark_fantasy');
    const [dmStyle, setDmStyle] = useState<DMStyle>('mysterious');
    const [selectedChar, setSelectedChar] = useState<DMCharacter>(PRESET_CHARACTERS[0]);
    const [customIdea, setCustomIdea] = useState('');

    const handleCreate = () => {
        const campaign: DMCampaign = {
            id: `camp-${Date.now()}`,
            title: title || 'Aventura Sem Título',
            synopsis: customIdea || 'Uma viagem guiada pelo Dungeon Master em busca de respostas e segredos.',
            setting,
            customSettingPrompt: customIdea,
            dmStyle,
            characters: [selectedChar],
            activeCharacterId: selectedChar.id,
            currentLocation: 'O Início da Jornada',
            nodes: [
                {
                    id: `node-${Date.now()}`,
                    timestamp: Date.now(),
                    sender: 'dm',
                    text: `O ar torna-se denso e o silêncio da noite é apenas quebrado pelo murmúrio do vento nas pedras antigas. Diante de ti, ${selectedChar.name}, abre-se um caminho envolto em mistério. O teu passado trouxe-te a este limiar, e agora o destino do reino aguarda as tuas escolhas.`,
                    locationName: 'Pórtico dos Antigos',
                    choices: [
                        { id: '1', text: 'Examinar os símbolos arcanos esculpidos nas colunas à entrada', intent: 'investigate' },
                        { id: '2', text: 'Empunhar a tua arma e avançar com cautela para o interior', intent: 'action' },
                        { id: '3', text: 'Procurar sinais ou pegadas recentes no solo lamacento', intent: 'stealth' }
                    ]
                }
            ],
            quests: [
                {
                    id: 'q-1',
                    title: 'O Mistério Inicial',
                    description: 'Investigar a origem das anomalias e encontrar o primeiro rasto do enigma.',
                    status: 'active',
                    cluesFound: ['Chegada aos limites da terra esquecida']
                }
            ],
            npcs: [],
            worldLore: ['Diz a lenda que estas terras outrora foram o centro de um império esquecido.'],
            summary: 'Início da aventura narrada pelo Dungeon Master.',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };

        onStartCampaign(campaign);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-slate-900/90 border border-amber-900/40 rounded-3xl shadow-2xl backdrop-blur-md">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-amber-900/40 pb-5 mb-6">
                <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-700 rounded-2xl shadow-lg text-slate-950 font-bold text-2xl flex items-center justify-center">
                    🎲
                </div>
                <div>
                    <h2 className="text-2xl font-serif font-bold text-amber-300">Dungeon Master: Criador de Campanha</h2>
                    <p className="text-sm text-slate-400">Define o cenário, o teu herói e o estilo do Mestre para esta aventura narrativa.</p>
                </div>
            </div>

            {/* Configuração da Campanha */}
            <div className="space-y-6">
                {/* Título & Ideia Base */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1 font-mono">
                            Título da Campanha
                        </label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-100 placeholder-slate-500 outline-none transition"
                            placeholder="Ex: O Enigma da Torre de Ébano..."
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-1 font-mono">
                            Estilo do Mestre (Tom Narrativo)
                        </label>
                        <select
                            value={dmStyle}
                            onChange={(e) => setDmStyle(e.target.value as DMStyle)}
                            className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl px-4 py-2.5 text-slate-100 outline-none transition"
                        >
                            <option value="mysterious">Enigmático & Tenso (Foco em Segredos)</option>
                            <option value="epic">Épico & Lendário (Grandes Reviravoltas)</option>
                            <option value="gritty">Realista & Cru (Dilemas e Consequências)</option>
                            <option value="whimsical">Fabulesco & Criativo (Magia e Encantamento)</option>
                        </select>
                    </div>
                </div>

                {/* Escolha do Cenário */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-2 font-mono">
                        Cenário do Mundo
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {SETTINGS_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setSetting(opt.id)}
                                className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between ${
                                    setting === opt.id
                                        ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20 text-white shadow-lg'
                                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span className="text-xl">{opt.icon}</span>
                                    <span className="font-bold text-sm text-amber-200">{opt.name}</span>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-2">{opt.desc}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Escolha do Personagem Protagonista */}
                <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400/90 mb-2 font-mono">
                        Escolhe o Teu Protagonista
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {PRESET_CHARACTERS.map((char) => (
                            <button
                                key={char.id}
                                type="button"
                                onClick={() => setSelectedChar(char)}
                                className={`p-4 rounded-2xl border text-left transition flex flex-col gap-2 ${
                                    selectedChar.id === char.id
                                        ? 'bg-purple-950/40 border-purple-500 ring-2 ring-purple-500/20 text-white shadow-lg'
                                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl p-2 bg-slate-900 border border-slate-700 rounded-xl">{char.avatar}</div>
                                    <div>
                                        <div className="font-bold text-sm text-purple-200">{char.name}</div>
                                        <div className="text-xs text-purple-400/80 font-mono">{char.archetype}</div>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 line-clamp-3">{char.biography}</p>
                                <div className="flex flex-wrap gap-1 mt-auto pt-2 border-t border-slate-800/80">
                                    {char.traits.map((t, idx) => (
                                        <span key={idx} className="text-[10px] bg-slate-900 px-2 py-0.5 rounded text-amber-300/80 border border-slate-800">
                                            {t}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-amber-900/30">
                    {onCancel && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="px-5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-sm font-semibold transition"
                        >
                            Cancelar
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleCreate}
                        className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-700 hover:brightness-110 active:scale-95 text-slate-950 font-bold text-sm shadow-xl flex items-center gap-2 transition"
                    >
                        <span>Começar Sessão com o Mestre</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
