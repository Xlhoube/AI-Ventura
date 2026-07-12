import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Language } from '@/utils/constants';

import { Models } from 'appwrite';

export interface AppUser extends Models.User<Models.Preferences> {
    name: string;
    email: string;
    $id: string;
    prefs: {
        avatar_url?: string;
        [key: string]: any;
    };
}

export type AIProvider = 'google' | 'openai' | 'anthropic';

interface AppState {
    currentUser: AppUser | null;
    userLang: Language;
    theme: 'dark' | 'light';
    isHost: boolean;
    apiKeys: {
        google: string;
        openai: string;
        anthropic: string;
    };
    apiKeysStatus: {
        google: 'valid' | 'exceeded';
        openai: 'valid' | 'exceeded';
        anthropic: 'valid' | 'exceeded';
    };
    activeProvider: AIProvider;
    setCurrentUser: (user: AppUser | null) => void;
    setUserLang: (lang: Language) => void;
    setTheme: (theme: 'dark' | 'light') => void;
    toggleTheme: () => void;
    setIsHost: (isHost: boolean) => void;
    setApiKeys: (keys: Partial<AppState['apiKeys']>) => void;
    setApiKeyStatus: (provider: AIProvider, status: 'valid' | 'exceeded') => void;
    setActiveProvider: (provider: AIProvider) => void;
    logout: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            currentUser: null,
            userLang: 'pt',
            theme: 'dark',
            isHost: false,
            apiKeys: { google: '', openai: '', anthropic: '' },
            apiKeysStatus: { google: 'valid', openai: 'valid', anthropic: 'valid' },
            activeProvider: 'google',
            setCurrentUser: (user) => set({ currentUser: user }),
            setUserLang: (lang) => set({ userLang: lang }),
            setTheme: (theme) => set({ theme }),
            toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
            setIsHost: (isHost) => set({ isHost }),
            setApiKeys: (keys) => set((state) => ({ apiKeys: { ...state.apiKeys, ...keys } })),
            setApiKeyStatus: (provider, status) => set((state) => ({ apiKeysStatus: { ...state.apiKeysStatus, [provider]: status } })),
            setActiveProvider: (provider) => set({ activeProvider: provider }),
            logout: () => set({ currentUser: null, isHost: false })
        }),
        {
            name: 'aiventura-app-storage',
            partialize: (state) => ({ 
                userLang: state.userLang, 
                theme: state.theme, 
                currentUser: state.currentUser,
                apiKeys: state.apiKeys,
                apiKeysStatus: state.apiKeysStatus,
                activeProvider: state.activeProvider 
            }),
        }
    )
);
