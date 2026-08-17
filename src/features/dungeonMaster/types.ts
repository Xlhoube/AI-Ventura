export type CampaignSetting = 
    | 'dark_fantasy' 
    | 'high_fantasy' 
    | 'cyberpunk' 
    | 'cosmic_horror' 
    | 'steampunk_mystery' 
    | 'post_apocalyptic' 
    | 'custom';

export type DMStyle = 
    | 'epic' // Grandioso, lendário, descritivo
    | 'mysterious' // Enigmático, tenso, focado em segredos
    | 'gritty' // Realista, cru, focado em sobrevivência e escolhas difíceis
    | 'whimsical'; // Fabulesco, criativo, mágico

export interface CharacterTrait {
    name: string;
    description: string;
}

export interface CharacterArtifact {
    name: string;
    description: string;
    origin?: string;
}

export interface DMCharacter {
    id: string;
    name: string;
    title: string;
    archetype: string; // Ex: "O Alquimista Renegado", "A Guardiã do Farol"
    biography: string;
    avatar: string; // Emoji ou URL
    traits: string[];
    inventory: string[];
    specialAbilities: string[];
}

export interface NPC {
    id: string;
    name: string;
    role: string; // Ex: "Taverneiro Enigmático", "Conselheira Real"
    disposition: 'friendly' | 'neutral' | 'hostile' | 'mysterious';
    description: string;
    notes: string;
}

export interface QuestLog {
    id: string;
    title: string;
    description: string;
    status: 'active' | 'completed' | 'failed';
    cluesFound: string[];
}

export interface DMChoice {
    id: string;
    text: string;
    intent?: 'investigate' | 'dialogue' | 'action' | 'magic' | 'stealth' | 'risky';
    hint?: string;
}

export interface DMNarrativeNode {
    id: string;
    timestamp: number;
    sender: 'dm' | 'player';
    playerName?: string;
    text: string;
    sceneImage?: string;
    locationName?: string;
    choices?: DMChoice[];
    dmNotes?: string;
    questsUpdated?: string[];
    npcsMentioned?: string[];
}

export interface DMCampaign {
    id: string;
    title: string;
    synopsis: string;
    setting: CampaignSetting;
    customSettingPrompt?: string;
    dmStyle: DMStyle;
    characters: DMCharacter[];
    activeCharacterId: string;
    currentLocation: string;
    nodes: DMNarrativeNode[];
    quests: QuestLog[];
    npcs: NPC[];
    worldLore: string[];
    summary: string;
    createdAt: number;
    updatedAt: number;
}
