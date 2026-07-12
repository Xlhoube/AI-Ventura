// ... (previous imports)
import { createClient } from '@supabase/supabase-js';

// --- CONFIGURAÇÃO ---
export const getEnv = (key: string) => {
  if (key === 'API_KEY') {
    const localKey = localStorage.getItem('ia_ventura_api_key');
    if (localKey) return localKey;
  }

  const value = (import.meta as any).env?.[`VITE_${key}`] ||
    (import.meta as any).env?.[key] ||
    (window as any)._env_?.[key] ||
    (window as any).process?.env?.[key] || // Adicionado suporte para index.html config
    (process as any).env?.[key] ||
    '';

  if (!value) {
    if (key === 'SUPABASE_URL') return 'https://jvnefjwgndyeiohlbovs.supabase.co';
    if (key === 'SUPABASE_ANON_KEY') return 'sb_publishable_eFXcxoN0UmnYntj6Xwj8Bg_-PZR8cTf';
  }
  return value;
};

export const SUPABASE_URL = getEnv('SUPABASE_URL');
export const SUPABASE_ANON_KEY = getEnv('SUPABASE_ANON_KEY');
export const isCloudEnabled = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = isCloudEnabled ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

// --- UTILITÁRIOS GERAIS ---
export const generateUUID = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (e) { }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// ... (other functions: createSessionCode, createCollaborationSession, createLobbySession, regenerateSessionCode, updateSessionPhase, kickParticipant, joinCollaborationSession, updateSessionStory, notifyTurnByEmail) ...

export const createSessionCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createCollaborationSession = async (story: any, hostId: string, hostName: string, hostAvatar?: string) => {
  if (!supabase) throw new Error("Cloud disabled");

  const code = createSessionCode();

  const storyWithTurnData = {
    ...story,
    participants: [{ id: hostId, name: hostName, avatar: hostAvatar }],
    currentTurnIndex: 0
  };

  const { data, error } = await supabase.from('sessions').insert({
    code,
    host_id: hostId,
    story_data: storyWithTurnData,
    status: 'active'
  }).select().single();

  if (error) throw error;
  return data;
};

export const createLobbySession = async (hostId: string, hostName: string, hostAvatar?: string) => {
  if (!supabase) throw new Error("Cloud disabled");

  const code = createSessionCode();

  const initialStoryData = {
    participants: [{ id: hostId, name: hostName, avatar: hostAvatar }],
    currentTurnIndex: 0,
    config: { charProfiles: [] }
  };

  const payload: any = {
    code,
    story_data: initialStoryData,
    status: 'lobby'
  };

  // Skip host_id if it's a guest ID (to avoid UUID syntax errors)
  if (hostId && !hostId.startsWith('guest_')) {
    payload.host_id = hostId;
  }

  const { data, error } = await supabase.from('sessions').insert(payload).select().single();

  if (error) throw error;
  return data;
};

export const regenerateSessionCode = async (oldCode: string, storyData: any, hostId: string) => {
  if (!supabase) return null;

  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  const payload: any = {
    code: newCode,
    story_data: storyData,
    status: 'lobby'
  };

  const { data, error } = await supabase.from('sessions')
    .update(payload)
    .eq('code', oldCode)
    .select()
    .single();

  if (error) {
    console.error("[regenerateSessionCode] Erro ao atualizar:", error);
    throw error;
  }
  return data;
};

export const updateSessionPhase = async (code: string, status: 'lobby' | 'setup' | 'active', storyData?: any) => {
  if (!supabase) return;

  const payload: any = { status };
  if (storyData) payload.story_data = storyData;

  const { error } = await supabase.from('sessions').update(payload).eq('code', code);
  if (error) throw error;
};

export const kickParticipant = async (code: string, participantId: string) => {
  if (!supabase) return;

  const { data, error } = await supabase.from('sessions').select('*').eq('code', code).single();
  if (error || !data) throw error || new Error("Session not found");

  const storyData = data.story_data || {};
  let participants = storyData.participants || [];
  let turnIndex = storyData.currentTurnIndex || 0;

  const newParticipants = participants.filter((p: any) => p.id !== participantId);

  if (turnIndex >= newParticipants.length) {
    turnIndex = 0;
  }

  const updatedStoryData = {
    ...storyData,
    participants: newParticipants,
    currentTurnIndex: turnIndex
  };

  await supabase.from('sessions').update({ story_data: updatedStoryData }).eq('code', code);
  return newParticipants;
};

export const joinCollaborationSession = async (code: string, userId: string, userName: string, userAvatar?: string) => {
  if (!supabase) throw new Error("Cloud disabled");

  const { data, error } = await supabase.from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .maybeSingle();

  if (error || !data) return null;

  if (data && data.story_data) {
    const currentParticipants = data.story_data.participants || [];
    const isAlreadyParticipant = currentParticipants.some((p: any) => p.id === userId);

    if (!isAlreadyParticipant) {
      const updatedParticipants = [...currentParticipants, { id: userId, name: userName, avatar: userAvatar }];
      const updatedStoryData = {
        ...data.story_data,
        participants: updatedParticipants
      };
      await supabase.from('sessions')
        .update({ story_data: updatedStoryData })
        .eq('code', code.toUpperCase());
      return { ...data, story_data: updatedStoryData };
    } else {
      return data;
    }
  }
  return data;
};

export const updateSessionStory = async (code: string, storyData: any) => {
  if (!supabase) return;
  const { error } = await supabase.from('sessions')
    .update({ story_data: storyData })
    .eq('code', code);
  if (error) console.error("Erro ao sincronizar história:", error);
};

export const notifyTurnByEmail = async (targetUserId: string, sessionCode: string, storyTitle: string) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.functions.invoke('notify-turn', {
      body: { targetUserId, sessionCode, storyTitle }
    });
    if (error) console.warn("Email notification failed (backend config needed):", error);
  } catch (e) {
    console.warn("Notification error:", e);
  }
};

// ... (existing social functions: publishStoryToGlobal, unpublishStoryFromGlobal, getUserLikes, toggleStoryLike) ...

export const publishStoryToGlobal = async (story: any, userId: string, authorName: string, originalLang: string = 'en') => {
  if (!supabase) throw new Error("Cloud disabled");

  const { data: existing } = await supabase
    .from('public_stories')
    .select('id')
    .eq('title', story.title)
    .eq('author_id', userId)
    .single();

  if (existing) {
    return { success: false, message: 'already_exists' };
  }

  const { error } = await supabase.from('public_stories').insert({
    title: story.title,
    messages: story.messages,
    config: story.config,
    author_id: userId,
    author_name: authorName,
    original_language: originalLang,
    votes: 0
  });

  if (error) throw error;
  return { success: true };
};

export const unpublishStoryFromGlobal = async (storyId: string, userId: string) => {
  if (!supabase) throw new Error("Cloud disabled");
  const { error } = await supabase
    .from('public_stories')
    .delete()
    .eq('id', storyId)
    .eq('author_id', userId);
  if (error) throw error;
  return { success: true };
};

export const unpublishStoryByTitle = async (title: string, userId: string) => {
  if (!supabase) throw new Error("Cloud disabled");
  const { error } = await supabase
    .from('public_stories')
    .delete()
    .eq('title', title)
    .eq('author_id', userId);
  if (error) throw error;
  return { success: true };
};

export const getUserLikes = async (userId: string) => {
  if (!supabase) return [];
  const { data } = await supabase
    .from('story_likes')
    .select('story_id')
    .eq('user_id', userId);
  return data?.map((item: any) => item.story_id) || [];
};

export const toggleStoryLike = async (storyId: string, userId: string) => {
  if (!supabase) throw new Error("Cloud disabled");
  const { data: existingLike } = await supabase
    .from('story_likes')
    .select('*')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .single();

  if (existingLike) {
    await supabase.from('story_likes').delete().eq('story_id', storyId).eq('user_id', userId);
    const { data: story } = await supabase.from('public_stories').select('votes').eq('id', storyId).single();
    if (story) {
      await supabase.from('public_stories').update({ votes: Math.max(0, (story.votes || 0) - 1) }).eq('id', storyId);
    }
    return 'unliked';
  } else {
    await supabase.from('story_likes').insert({ story_id: storyId, user_id: userId });
    const { data: story } = await supabase.from('public_stories').select('votes').eq('id', storyId).single();
    if (story) {
      await supabase.from('public_stories').update({ votes: (story.votes || 0) + 1 }).eq('id', storyId);
    }
    return 'liked';
  }
};

// --- SERVIÇOS DE PERFIL E PREFERÊNCIAS ---

export const updateProfileLanguage = async (userId: string, lang: string) => {
  if (!supabase) return;
  await supabase.from('profiles').update({ language_preference: lang }).eq('id', userId);
};

export const getProfileLanguage = async (userId: string) => {
  if (!supabase) return null;
  const { data } = await supabase.from('profiles').select('language_preference').eq('id', userId).single();
  return data?.language_preference;
};

// NEW: User Settings (Font Size, etc) - Stored in a JSONB column 'settings' or specific column if available.
// Robust implementation with LocalStorage fallback
export const updateProfileSettings = async (userId: string, settings: any) => {
  // 1. Always save to LocalStorage first (immediate UI feedback & offline support)
  try {
    const currentLocal = localStorage.getItem(`user_settings_${userId}`);
    const parsedLocal = currentLocal ? JSON.parse(currentLocal) : {};
    const newSettings = { ...parsedLocal, ...settings };
    localStorage.setItem(`user_settings_${userId}`, JSON.stringify(newSettings));
  } catch (e) {
    console.warn("LocalStorage save error:", e);
  }

  if (!supabase) return;

  // 2. Try to sync with Supabase
  try {
    const { error } = await supabase.from('profiles').update({ settings: settings }).eq('id', userId);
    if (error) {
      // Silent fail for DB (user still has local settings)
      console.warn("DB Sync skipped (settings column might be missing):", error.message);
    }
  } catch (err) {
    console.warn("DB Sync error:", err);
  }
};

export const getProfileSettings = async (userId: string): Promise<any> => {
  let remoteSettings: any = {};

  // 1. Try to fetch from Supabase
  if (supabase) {
    try {
      const { data, error } = await supabase.from('profiles').select('settings').eq('id', userId).single();
      if (!error && data?.settings) {
        remoteSettings = data.settings;
      }
    } catch (err) {
      // Ignore DB errors, fall back to local
    }
  }

  // 2. Fetch from LocalStorage
  let localSettings = {};
  try {
    const local = localStorage.getItem(`user_settings_${userId}`);
    if (local) localSettings = JSON.parse(local);
  } catch (e) { }

  // 3. Merge (Remote takes precedence if available, otherwise Local)
  return { ...localSettings, ...remoteSettings };
};

export const syncStoriesCount = async (userId: string, count: number) => {
  if (!supabase) return;
  try {
    const { error } = await supabase.from('profiles').update({ stories_count: count }).eq('id', userId);
    if (error) console.warn("Error syncing stories count:", error.message);
  } catch (e) {
    console.warn("Error syncing stories count:", e);
  }
};

export const getSpectatorSession = async (code: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !data) return null;
  return data;
};