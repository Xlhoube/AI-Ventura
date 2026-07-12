import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
    id: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    authorId?: string;
    timestamp: string;
}

export interface StoryConfig {
    genre?: string;
    setting?: string;
    mainCharacter?: string;
    tone?: string;
    [key: string]: any;
}

export interface Participant {
    id: string;
    username: string;
    avatar_url?: string;
    isHost?: boolean;
}

interface StoryState {
    sessionCode: string | undefined;
    messages: Message[];
    config: StoryConfig | null;
    participants: Participant[];
    isCoop: boolean;
    currentTurnIndex: number;
    sessionPhase: 'lobby' | 'setup' | 'active';

    setSessionCode: (code: string | undefined) => void;
    setMessages: (messages: Message[] | ((prev: Message[]) => Message[])) => void;
    setConfig: (config: StoryConfig | null) => void;
    setParticipants: (participants: Participant[]) => void;
    setIsCoop: (isCoop: boolean) => void;
    setCurrentTurnIndex: (index: number) => void;
    setSessionPhase: (phase: 'lobby' | 'setup' | 'active') => void;
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

            setSessionCode: (code) => set({ sessionCode: code }),
            setMessages: (msgs) => set((state) => ({
                messages: typeof msgs === 'function' ? msgs(state.messages) : msgs
            })),
            setConfig: (config) => set({ config }),
            setParticipants: (participants) => set({ participants }),
            setIsCoop: (isCoop) => set({ isCoop }),
            setCurrentTurnIndex: (index) => set({ currentTurnIndex: index }),
            setSessionPhase: (phase) => set({ sessionPhase: phase }),

            resetStory: () => set({
                sessionCode: undefined,
                messages: [],
                config: null,
                participants: [],
                isCoop: false,
                currentTurnIndex: 0,
                sessionPhase: 'lobby'
            })
        }),
        {
            name: 'story-storage', // nome da chave no localStorage
        }
    )
);
