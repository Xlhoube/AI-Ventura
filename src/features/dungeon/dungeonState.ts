import { Champion, DungeonFloor, DungeonState, Direction } from './types';

export const INITIAL_CHAMPIONS: Champion[] = [
    {
        id: 'hero-1',
        name: 'Iaido Ruyisan',
        title: 'Master Swordsman',
        avatar: '⚔️',
        gender: 'M',
        classType: 'Fighter',
        hp: 75,
        maxHp: 75,
        stamina: 80,
        maxStamina: 80,
        mana: 10,
        maxMana: 10,
        food: 90,
        water: 90,
        load: 18.5,
        maxLoad: 45,
        skills: { fighter: 3, ninja: 1, wizard: 0, priest: 0 },
        equipment: {
            mainHand: { id: 'sword-1', name: 'Falchion', type: 'weapon', weight: 4.5, icon: '🗡️', description: 'Uma lâmina de aço forjado afiada.', power: 12 },
            offHand: { id: 'shield-1', name: 'Wooden Shield', type: 'shield', weight: 3.0, icon: '🛡️', description: 'Um escudo de madeira reforçado.', power: 5 },
            head: null,
            chest: { id: 'armor-1', name: 'Leather Jerkin', type: 'armor', weight: 6.0, icon: '🥋', description: 'Proteção de couro endurecido.', power: 4 },
            legs: null,
            feet: { id: 'boots-1', name: 'Leather Boots', type: 'armor', weight: 2.0, icon: '🥾', description: 'Botas confortáveis para explorar.', power: 1 },
            necklace: null,
            ring: null
        },
        backpack: [
            { id: 'torch-1', name: 'Torch', type: 'torch', weight: 1.0, icon: '🔥', description: 'Tocha para iluminar corredores escuros.', charges: 100 },
            { id: 'apple-1', name: 'Bread & Cheese', type: 'food', weight: 0.8, icon: '🍞', description: 'Rações de viagem para saciar a fome.' }
        ]
    },
    {
        id: 'hero-2',
        name: 'Wu Tse',
        title: 'Son of Heaven',
        avatar: '🥷',
        gender: 'M',
        classType: 'Ninja',
        hp: 55,
        maxHp: 55,
        stamina: 95,
        maxStamina: 95,
        mana: 25,
        maxMana: 25,
        food: 85,
        water: 85,
        load: 9.0,
        maxLoad: 35,
        skills: { fighter: 1, ninja: 4, wizard: 1, priest: 0 },
        equipment: {
            mainHand: { id: 'dagger-1', name: 'Throwing Dagger', type: 'weapon', weight: 1.2, icon: '🗡️', description: 'Adaga leve e balanceada.', power: 8 },
            offHand: null,
            head: null,
            chest: { id: 'robe-1', name: 'Shadow Tunic', type: 'armor', weight: 2.5, icon: '🥋', description: 'Túnica escura e flexível.', power: 2 },
            legs: null,
            feet: null,
            necklace: null,
            ring: null
        },
        backpack: [
            { id: 'water-1', name: 'Water Flask', type: 'water', weight: 1.5, icon: '🏺', description: 'Odre de água fresca.' }
        ]
    },
    {
        id: 'hero-3',
        name: 'Chani Sayyadina',
        title: 'Daughter of the Desert',
        avatar: '🧙‍♀️',
        gender: 'F',
        classType: 'Wizard',
        hp: 45,
        maxHp: 45,
        stamina: 60,
        maxStamina: 60,
        mana: 80,
        maxMana: 80,
        food: 80,
        water: 95,
        load: 6.5,
        maxLoad: 30,
        skills: { fighter: 0, ninja: 1, wizard: 4, priest: 1 },
        equipment: {
            mainHand: { id: 'staff-1', name: 'Yew Staff', type: 'weapon', weight: 2.5, icon: '🪄', description: 'Cajado de teixo canalizador de mana.', power: 4 },
            offHand: null,
            head: null,
            chest: { id: 'robe-2', name: 'Silk Robe', type: 'armor', weight: 1.8, icon: '🥻', description: 'Vestes de seda encantadas.', power: 1 },
            legs: null,
            feet: null,
            necklace: null,
            ring: null
        },
        backpack: [
            { id: 'scroll-1', name: 'Rune Scroll', type: 'scroll', weight: 0.2, icon: '📜', description: 'Pergaminho com os dizeres: "Ful Ir incendiará os teus inimigos".' }
        ]
    },
    {
        id: 'hero-4',
        name: 'Elija',
        title: 'The Lion Priest',
        avatar: '📿',
        gender: 'M',
        classType: 'Priest',
        hp: 60,
        maxHp: 60,
        stamina: 70,
        maxStamina: 70,
        mana: 65,
        maxMana: 65,
        food: 90,
        water: 80,
        load: 12.0,
        maxLoad: 38,
        skills: { fighter: 1, ninja: 0, wizard: 1, priest: 4 },
        equipment: {
            mainHand: { id: 'mace-1', name: 'Blessed Club', type: 'weapon', weight: 3.5, icon: '🔨', description: 'Clava abençoada para purificar o mal.', power: 7 },
            offHand: null,
            head: null,
            chest: { id: 'vestment-1', name: 'Priest Vestment', type: 'armor', weight: 3.0, icon: '🎽', description: 'Vestes sacerdotais de proteção divina.', power: 3 },
            legs: null,
            feet: null,
            necklace: null,
            ring: null
        },
        backpack: [
            { id: 'potion-1', name: 'Vi Potion (Healing)', type: 'potion', weight: 0.5, icon: '🧪', description: 'Poção curativa formulada com o elemento Vi.' }
        ]
    }
];

export const createSampleFloor1 = (): DungeonFloor => {
    // 8x8 Grid clássico com paredes, portas, tocha e alcova
    const width = 8;
    const height = 8;
    const grid: any[][] = [];

    for (let y = 0; y < height; y++) {
        const row: any[] = [];
        for (let x = 0; x < width; x++) {
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                row.push({ type: 'wall' });
            } else {
                row.push({ type: 'floor' });
            }
        }
        grid.push(row);
    }

    // Paredes internas e layout da masmorra
    grid[2][2] = { type: 'wall' };
    grid[2][3] = { type: 'door', isOpen: false, description: 'Uma pesada grade de ferro trancada por mecanismo.' };
    grid[2][4] = { type: 'wall' };
    grid[4][2] = { type: 'alcove', items: [{ id: 'torch-floor', name: 'Torch', type: 'torch', weight: 1.0, icon: '🔥', description: 'Uma tocha descansando numa alcova de pedra.', charges: 100 }] };
    grid[4][5] = { type: 'fountain', description: 'Uma fonte de pedra cristalina com água fresca dos subterrâneos.' };
    grid[6][3] = { type: 'stairs_down', description: 'Degraus de pedra fria que descem para o Nível 2 (Deceiver\'s Tomb).' };

    return {
        level: 1,
        name: 'The Entrance & Hall of Champions',
        width,
        height,
        grid,
        monsters: [
            {
                id: 'm-1',
                name: 'Giant Mummy',
                hp: 40,
                maxHp: 40,
                attack: 8,
                defense: 3,
                x: 3,
                y: 1,
                image: '🧟‍♂️',
                isAlive: true
            }
        ]
    };
};

export const getInitialDungeonState = (): DungeonState => {
    const floor1 = createSampleFloor1();
    return {
        currentFloor: 1,
        playerPos: { x: 3, y: 5 }, // Em frente à porta/corredor
        playerDir: 'N',
        party: INITIAL_CHAMPIONS,
        activeChampionIndex: 0,
        lightLevel: 80,
        torchesActive: 1,
        gameTime: 0,
        floors: {
            1: floor1
        },
        combatLog: [
            'Entraste nos subterrâneos de Mount Anaias...',
            'O ar é frio e húmido. As tochas tremulam nas paredes de pedra.'
        ],
        aiNarrative: 'Diante de vós ergue-se o arco de entrada do Hall dos Campeões. O eco distante de correntes e rosnados ressoa pelas profundezas. Prepara o teu grupo e as tuas runas.'
    };
};

export const getNextPosition = (pos: { x: number; y: number }, dir: Direction, step: 'forward' | 'backward' | 'left' | 'right') => {
    let dx = 0;
    let dy = 0;

    const dirMap: Record<Direction, { f: [number, number]; b: [number, number]; l: [number, number]; r: [number, number] }> = {
        'N': { f: [0, -1], b: [0, 1], l: [-1, 0], r: [1, 0] },
        'E': { f: [1, 0], b: [-1, 0], l: [0, -1], r: [0, 1] },
        'S': { f: [0, 1], b: [0, -1], l: [1, 0], r: [-1, 0] },
        'W': { f: [-1, 0], b: [1, 0], l: [0, 1], r: [0, -1] },
    };

    const mapping = dirMap[dir];
    const offset = step === 'forward' ? mapping.f : step === 'backward' ? mapping.b : step === 'left' ? mapping.l : mapping.r;

    return { x: pos.x + offset[0], y: pos.y + offset[1] };
};

export const rotateDirection = (current: Direction, turn: 'left' | 'right'): Direction => {
    const clockwise: Direction[] = ['N', 'E', 'S', 'W'];
    let idx = clockwise.indexOf(current);
    if (turn === 'right') {
        return clockwise[(idx + 1) % 4];
    } else {
        return clockwise[(idx + 3) % 4];
    }
};
