export type Direction = 'N' | 'E' | 'S' | 'W';

export type ChampionClass = 'Fighter' | 'Ninja' | 'Wizard' | 'Priest';

export interface ChampionSkills {
    fighter: number;
    ninja: number;
    wizard: number;
    priest: number;
}

export interface InventoryItem {
    id: string;
    name: string;
    type: 'weapon' | 'shield' | 'armor' | 'potion' | 'scroll' | 'food' | 'water' | 'key' | 'torch' | 'misc';
    weight: number; // in kg or units
    icon: string;
    description: string;
    power?: number;
    durability?: number;
    charges?: number;
}

export interface Champion {
    id: string;
    name: string;
    title: string;
    avatar: string;
    gender: 'M' | 'F' | 'Other';
    classType: ChampionClass;
    hp: number;
    maxHp: number;
    stamina: number;
    maxStamina: number;
    mana: number;
    maxMana: number;
    food: number; // 0 - 100
    water: number; // 0 - 100
    load: number;
    maxLoad: number;
    skills: ChampionSkills;
    equipment: {
        mainHand: InventoryItem | null;
        offHand: InventoryItem | null;
        head: InventoryItem | null;
        chest: InventoryItem | null;
        legs: InventoryItem | null;
        feet: InventoryItem | null;
        necklace: InventoryItem | null;
        ring: InventoryItem | null;
    };
    backpack: (InventoryItem | null)[];
}

export type TileType = 'floor' | 'wall' | 'door' | 'stairs_down' | 'stairs_up' | 'pit' | 'teleport' | 'alcove' | 'fountain' | 'mirror';

export interface Tile {
    type: TileType;
    decorations?: string[];
    isLocked?: boolean;
    keyRequired?: string;
    isOpen?: boolean;
    items?: InventoryItem[];
    trigger?: string;
    description?: string;
}

export interface DungeonMonster {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    attack: number;
    defense: number;
    x: number;
    y: number;
    image: string;
    isAlive: boolean;
}

export interface DungeonFloor {
    level: number;
    name: string;
    width: number;
    height: number;
    grid: Tile[][];
    monsters: DungeonMonster[];
}

export type RunePower = 'Lo' | 'Um' | 'On' | 'Ee' | 'Pal' | 'Mon';
export type RuneElement = 'Ya' | 'Vi' | 'Oh' | 'Ful' | 'Des' | 'Zo';
export type RuneForm = 'Ven' | 'Ew' | 'Kath' | 'Ir' | 'Bro' | 'Gor';
export type RuneTarget = 'Ku' | 'Ros' | 'Dain' | 'Neta' | 'Ra' | 'Sar';

export interface RuneCombo {
    power: RunePower;
    element?: RuneElement;
    form?: RuneForm;
    target?: RuneTarget;
}

export interface SpellDefinition {
    name: string;
    formula: string; // Ex: "Ful Ir"
    manaCostMultiplier: number;
    type: 'combat' | 'healing' | 'utility' | 'buff';
    description: string;
}

export interface DungeonState {
    currentFloor: number;
    playerPos: { x: number; y: number };
    playerDir: Direction;
    party: Champion[];
    activeChampionIndex: number;
    lightLevel: number; // 0 (pitch dark) - 100 (bright)
    torchesActive: number;
    gameTime: number; // In game ticks
    floors: Record<number, DungeonFloor>;
    combatLog: string[];
    aiNarrative: string;
}
