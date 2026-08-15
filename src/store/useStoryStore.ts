import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'ai';
    content: string;
    authorId?: string;
    timestamp: string;
}

export interface StoryConfig {
    genre?: string;
    setting?: string;
    mainCharacter?: string;
    tone?: string;
    idea?: string;
    characters?: string;
    [key: string]: any;
}

export interface Participant {
    id: string;
    username: string;
    avatar_url?: string;
    isHost?: boolean;
}

export interface ManuscriptResult {
    titleOptions: string[];
    synopsis: string;
    content: string;
    title?: string;
}

export interface Story {
    id: string;
    title: string;
    messages: Message[];
    config: StoryConfig;
    author_name: string;
    updated_at: string;
    status: 'draft' | 'completed' | 'archived';
    sessionCode?: string | null;
    storageType?: 'local' | 'cloud';
    manuscript?: ManuscriptResult;
    participants?: Participant[];
    currentTurnIndex?: number;
    inventory?: string[];
    relationships?: Record<string, number>;
    original_language?: string;
    [key: string]: any;
}

interface StoryState {
    sessionCode: string | null | undefined;
    messages: Message[];
    config: StoryConfig | null;
    participants: Participant[];
    isCoop: boolean;
    currentTurnIndex: number;
    sessionPhase: 'lobby' | 'setup' | 'active';

    // Estado da história activa (persistido para sobreviver a refresh)
    currentStory: Story | null;
    pendingManuscript: ManuscriptResult | null;
    pendingMessages: Message[];

    setSessionCode: (code: string | null | undefined) => void;
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    setConfig: (config: StoryConfig | null) => void;
    setParticipants: (participants: Participant[]) => void;
    setIsCoop: (isCoop: boolean) => void;
    setCurrentTurnIndex: (index: number) => void;
    setSessionPhase: (phase: 'lobby' | 'setup' | 'active') => void;
    setCurrentStory: (story: Story | null | ((prev: Story | null) => Story | null)) => void;
    setPendingManuscript: (manuscript: ManuscriptResult | null) => void;
    setPendingMessages: (messages: Message[]) => void;
    resetStory: () => void;
}

export const useStoryStore = create<StoryState>()(
    persist(
        (set) => ({
            sessionCode: undefined,
            messages: [],
            config: null,
            participants: [],
            isCoop: false,
            currentTurnIndex: 0,
            sessionPhase: 'lobby',
            currentStory: null,
            pendingManuscript: null,
            pendingMessages: [],

            setSessionCode: (code) => set({ sessionCode: code }),
            setMessages: (msgs) => set((state) => ({
                messages: typeof msgs === 'function' ? msgs(state.messages) : msgs
            })),
            setConfig: (config) => set({ config }),
            setParticipants: (participants) => set({ participants }),
            setIsCoop: (isCoop) => set({ isCoop }),
            setCurrentTurnIndex: (index) => set({ currentTurnIndex: index }),
            setSessionPhase: (phase) => set({ sessionPhase: phase }),
            setCurrentStory: (story) => set((state) => ({
                currentStory: typeof story === 'function' ? story(state.currentStory) : story
            })),
            setPendingManuscript: (manuscript) => set({ pendingManuscript: manuscript }),
            setPendingMessages: (messages) => set({ pendingMessages: messages }),

            resetStory: () => set({
                sessionCode: undefined,
                messages: [],
                config: null,
                participants: [],
                isCoop: false,
                currentTurnIndex: 0,
                sessionPhase: 'lobby',
                currentStory: null,
                pendingManuscript: null,
                pendingMessages: [],
            })
        }),
        {
            name: 'story-storage',
            // Persistir apenas o essencial para restaurar a sessão após refresh
            partialize: (state) => ({
                currentStory: state.currentStory,
                sessionCode: state.sessionCode,
            })
        }
    )
);
