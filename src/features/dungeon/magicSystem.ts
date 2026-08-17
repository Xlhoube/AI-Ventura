import { RunePower, RuneElement, RuneForm, RuneTarget, SpellDefinition } from './types';

export const RUNE_POWERS: { symbol: RunePower; name: string; powerMultiplier: number; cost: number }[] = [
    { symbol: 'Lo', name: 'Lo (Nível 1)', powerMultiplier: 1, cost: 2 },
    { symbol: 'Um', name: 'Um (Nível 2)', powerMultiplier: 1.5, cost: 4 },
    { symbol: 'On', name: 'On (Nível 3)', powerMultiplier: 2.2, cost: 7 },
    { symbol: 'Ee', name: 'Ee (Nível 4)', powerMultiplier: 3.0, cost: 11 },
    { symbol: 'Pal', name: 'Pal (Nível 5)', powerMultiplier: 4.0, cost: 16 },
    { symbol: 'Mon', name: 'Mon (Nível 6)', powerMultiplier: 5.5, cost: 22 },
];

export const RUNE_ELEMENTS: { symbol: RuneElement; name: string; domain: string }[] = [
    { symbol: 'Ya', name: 'Ya (Terra / Estabilidade)', domain: 'Earth' },
    { symbol: 'Vi', name: 'Vi (Água / Vida / Cura)', domain: 'Water/Life' },
    { symbol: 'Oh', name: 'Oh (Ar / Movimento / Veneno)', domain: 'Air' },
    { symbol: 'Ful', name: 'Ful (Fogo / Luz / Destruição)', domain: 'Fire' },
    { symbol: 'Des', name: 'Des (Vazio / Fraqueza)', domain: 'Void' },
    { symbol: 'Zo', name: 'Zo (Espírito / Mana / Espaço)', domain: 'Spirit' },
];

export const RUNE_FORMS: { symbol: RuneForm; name: string; type: string }[] = [
    { symbol: 'Ven', name: 'Ven (Poção / Físico)', type: 'Potion' },
    { symbol: 'Ew', name: 'Ew (Projétil / Nuvem)', type: 'Cloud/Missile' },
    { symbol: 'Kath', name: 'Kath (Escudo / Proteção)', type: 'Shield' },
    { symbol: 'Ir', name: 'Ir (Esfera / Explosão)', type: 'Blast' },
    { symbol: 'Bro', name: 'Bro (Aprimoramento / Encantamento)', type: 'Buff' },
    { symbol: 'Gor', name: 'Gor (Golpe Brutal / Corte)', type: 'Strike' },
];

export const RUNE_TARGETS: { symbol: RuneTarget; name: string }[] = [
    { symbol: 'Ku', name: 'Ku (Guerreiro / Força)' },
    { symbol: 'Ros', name: 'Ros (Destreza / Agilidade)' },
    { symbol: 'Dain', name: 'Dain (Sabedoria / Mente)' },
    { symbol: 'Neta', name: 'Neta (Vitalidade / Resistência)' },
    { symbol: 'Ra', name: 'Ra (Poder Superior / Místico)' },
    { symbol: 'Sar', name: 'Sar (Alvo Específico / Inimigo)' },
];

export const SPELL_BOOK: Record<string, SpellDefinition> = {
    'Ful': {
        name: 'Magic Torch',
        formula: 'Ful',
        manaCostMultiplier: 1,
        type: 'utility',
        description: 'Cria uma esfera brilhante de luz mágica que ilumina o ambiente.'
    },
    'Ful Ir': {
        name: 'Fireball',
        formula: 'Ful Ir',
        manaCostMultiplier: 2.5,
        type: 'combat',
        description: 'Lança uma esfera crepitante de fogo causando elevado dano de área.'
    },
    'Vi Bro': {
        name: 'Heal Party',
        formula: 'Vi Bro',
        manaCostMultiplier: 2.0,
        type: 'healing',
        description: 'Canaliza energias vitais e restaura pontos de vida do grupo.'
    },
    'Ya Bro': {
        name: 'Stamina Infusion',
        formula: 'Ya Bro',
        manaCostMultiplier: 1.5,
        type: 'buff',
        description: 'Revigora os músculos e restaura a estamina dos heróis.'
    },
    'Oh Ven': {
        name: 'Poison Cloud',
        formula: 'Oh Ven',
        manaCostMultiplier: 2.0,
        type: 'combat',
        description: 'Emite uma névoa venenosa que sufoca os inimigos próximos.'
    },
    'Zo Kath Ra': {
        name: 'Plasma Bolt / Core Key',
        formula: 'Zo Kath Ra',
        manaCostMultiplier: 4.0,
        type: 'combat',
        description: 'Conjura a pura energia do Lord Chaos, capaz de romper selos ancestrais.'
    },
    'Des Ven': {
        name: 'Harm Non-Material',
        formula: 'Des Ven',
        manaCostMultiplier: 2.2,
        type: 'combat',
        description: 'Distorce o plano etéreo, ferindo fantasmas e seres incorpóreos.'
    }
};
