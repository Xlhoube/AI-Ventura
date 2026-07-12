import { Client, Account, Databases, ID, Query } from 'appwrite';

// --- CONFIGURAÇÃO ---
export const getEnv = (key: string) => {
  if (key === 'API_KEY') {
    const localKey = localStorage.getItem('ia_ventura_api_key');
    if (localKey) return localKey;
  }

  const value = (import.meta as any).env?.[`VITE_${key}`] ||
    (import.meta as any).env?.[key] ||
    (window as any)._env_?.[key] ||
    (window as any).process?.env?.[key] || 
    (process as any).env?.[key] ||
    '';

  return value;
};

export const APPWRITE_ENDPOINT = getEnv('APPWRITE_ENDPOINT') || 'https://cloud.appwrite.io/v1';
export const APPWRITE_PROJECT_ID = getEnv('APPWRITE_PROJECT_ID');
export const isCloudEnabled = Boolean(APPWRITE_ENDPOINT && APPWRITE_PROJECT_ID);

export const client = new Client();
if (isCloudEnabled) {
  client.setEndpoint(APPWRITE_ENDPOINT).setProject(APPWRITE_PROJECT_ID);
}

export const account = new Account(client);
export const databases = new Databases(client);

// PADRÃO DE IDS PARA O APPWRITE (O usuário deverá criar estes no painel)
export const DATABASE_ID = 'ai_ventura_db';
export const COL_SESSIONS = 'sessions';
export const COL_PUBLIC_STORIES = 'public_stories';
export const COL_STORY_LIKES = 'story_likes';
export const COL_PROFILES = 'profiles';

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

// Helpers para lidar com dados JSON que no Appwrite serão salvos como Strings longas
const parseJsonObj = (data: any, fieldName: string) => {
  if (data && data[fieldName]) {
    try {
      if (typeof data[fieldName] === 'string') {
        data[fieldName] = JSON.parse(data[fieldName]);
      }
    } catch (e) {
      console.warn(`Failed to parse ${fieldName}:`, e);
      data[fieldName] = {};
    }
  }
  return data;
};

// --- SESSÕES E COLABORAÇÃO ---

export const createSessionCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export const createCollaborationSession = async (story: any, hostId: string, hostName: string, hostAvatar?: string) => {
  if (!isCloudEnabled) throw new Error("Cloud disabled");

  const code = createSessionCode();
  const storyWithTurnData = {
    ...story,
    participants: [{ id: hostId, name: hostName, avatar: hostAvatar }],
    currentTurnIndex: 0
  };

  const doc = await databases.createDocument(DATABASE_ID, COL_SESSIONS, ID.unique(), {
    code,
    host_id: hostId,
    story_data: JSON.stringify(storyWithTurnData),
    status: 'active'
  });
  
  return parseJsonObj(doc, 'story_data');
};

export const createLobbySession = async (hostId: string, hostName: string, hostAvatar?: string) => {
  if (!isCloudEnabled) throw new Error("Cloud disabled");

  const code = createSessionCode();
  const initialStoryData = {
    participants: [{ id: hostId, name: hostName, avatar: hostAvatar }],
    currentTurnIndex: 0,
    config: { charProfiles: [] }
  };

  const payload: any = {
    code,
    story_data: JSON.stringify(initialStoryData),
    status: 'lobby'
  };

  if (hostId && !hostId.startsWith('guest_')) {
    payload.host_id = hostId;
  }

  const doc = await databases.createDocument(DATABASE_ID, COL_SESSIONS, ID.unique(), payload);
  return parseJsonObj(doc, 'story_data');
};

export const regenerateSessionCode = async (oldCode: string, storyData: any, hostId: string) => {
  if (!isCloudEnabled) return null;

  const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  const payload: any = {
    code: newCode,
    story_data: JSON.stringify(storyData),
    status: 'lobby'
  };

  try {
    const response = await databases.listDocuments(DATABASE_ID, COL_SESSIONS, [Query.equal('code', oldCode)]);
    if (response.documents.length === 0) throw new Error("Session not found");
    
    const docId = response.documents[0].$id;
    const updated = await databases.updateDocument(DATABASE_ID, COL_SESSIONS, docId, payload);
    return parseJsonObj(updated, 'story_data');
  } catch (error) {
    console.error("[regenerateSessionCode] Erro ao atualizar:", error);
    throw error;
  }
};

export const updateSessionPhase = async (code: string, status: 'lobby' | 'setup' | 'active', storyData?: any) => {
  if (!isCloudEnabled) return;

  const payload: any = { status };
  if (storyData) payload.story_data = JSON.stringify(storyData);

  const response = await databases.listDocuments(DATABASE_ID, COL_SESSIONS, [Query.equal('code', code)]);
  if (response.documents.length > 0) {
    await databases.updateDocument(DATABASE_ID, COL_SESSIONS, response.documents[0].$id, payload);
  }
};

export const kickParticipant = async (code: string, participantId: string) => {
  if (!isCloudEnabled) return;

  const response = await databases.listDocuments(DATABASE_ID, COL_SESSIONS, [Query.equal('code', code)]);
  if (response.documents.length === 0) throw new Error("Session not found");
  
  const data = parseJsonObj(response.documents[0], 'story_data');
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

  await databases.updateDocument(DATABASE_ID, COL_SESSIONS, data.$id, { 
    story_data: JSON.stringify(updatedStoryData) 
  });
  return newParticipants;
};

export const joinCollaborationSession = async (code: string, userId: string, userName: string, userAvatar?: string) => {
  if (!isCloudEnabled) throw new Error("Cloud disabled");

  const response = await databases.listDocuments(DATABASE_ID, COL_SESSIONS, [Query.equal('code', code.toUpperCase())]);
  if (response.documents.length === 0) return null;
  
  const data = parseJsonObj(response.documents[0], 'story_data');

  if (data && data.story_data) {
    const currentParticipants = data.story_data.participants || [];
    const isAlreadyParticipant = currentParticipants.some((p: any) => p.id === userId);

    if (!isAlreadyParticipant) {
      const updatedParticipants = [...currentParticipants, { id: userId, name: userName, avatar: userAvatar }];
      const updatedStoryData = {
        ...data.story_data,
        participants: updatedParticipants
      };
      
      await databases.updateDocument(DATABASE_ID, COL_SESSIONS, data.$id, { 
        story_data: JSON.stringify(updatedStoryData) 
      });
      return { ...data, story_data: updatedStoryData };
    } else {
      return data;
    }
  }
  return data;
};

export const updateSessionStory = async (code: string, storyData: any) => {
  if (!isCloudEnabled) return;
  try {
    const response = await databases.listDocuments(DATABASE_ID, COL_SESSIONS, [Query.equal('code', code)]);
    if (response.documents.length > 0) {
      await databases.updateDocument(DATABASE_ID, COL_SESSIONS, response.documents[0].$id, { 
        story_data: JSON.stringify(storyData) 
      });
    }
  } catch (error) {
    console.error("Erro ao sincronizar história:", error);
  }
};

export const notifyTurnByEmail = async (targetUserId: string, sessionCode: string, storyTitle: string) => {
  // Edge functions will be implemented differently in Appwrite
  console.log("Appwrite Edge function integration needed for notifyTurnByEmail");
};

// --- FUNÇÕES SOCIAIS E PÚBLICAS ---

export const publishStoryToGlobal = async (story: any, userId: string, authorName: string, originalLang: string = 'en') => {
  if (!isCloudEnabled) throw new Error("Cloud disabled");

  const existing = await databases.listDocuments(DATABASE_ID, COL_PUBLIC_STORIES, [
    Query.equal('title', story.title),
    Query.equal('author_id', userId)
  ]);

  if (existing.documents.length > 0) {
    return { success: false, message: 'already_exists' };
  }

  await databases.createDocument(DATABASE_ID, COL_PUBLIC_STORIES, ID.unique(), {
    title: story.title,
    messages: JSON.stringify(story.messages),
    config: JSON.stringify(story.config),
    author_id: userId,
    author_name: authorName,
    original_language: originalLang,
    votes: 0
  });

  return { success: true };
};

export const unpublishStoryFromGlobal = async (storyId: string, userId: string) => {
  if (!isCloudEnabled) throw new Error("Cloud disabled");
  // Certifique-se de que o autor é o mesmo (verificando antes ou via Database Rules)
  await databases.deleteDocument(DATABASE_ID, COL_PUBLIC_STORIES, storyId);
  return { success: true };
};

export const unpublishStoryByTitle = async (title: string, userId: string) => {
  if (!isCloudEnabled) throw new Error("Cloud disabled");
  const response = await databases.listDocuments(DATABASE_ID, COL_PUBLIC_STORIES, [
    Query.equal('title', title),
    Query.equal('author_id', userId)
  ]);
  for (const doc of response.documents) {
    await databases.deleteDocument(DATABASE_ID, COL_PUBLIC_STORIES, doc.$id);
  }
  return { success: true };
};

export const getUserLikes = async (userId: string) => {
  if (!isCloudEnabled) return [];
  try {
    const { documents } = await databases.listDocuments(DATABASE_ID, COL_STORY_LIKES, [Query.equal('user_id', userId)]);
    return documents.map((item: any) => item.story_id);
  } catch(e) { return []; }
};

export const toggleStoryLike = async (storyId: string, userId: string) => {
  if (!isCloudEnabled) throw new Error("Cloud disabled");
  
  const { documents } = await databases.listDocuments(DATABASE_ID, COL_STORY_LIKES, [
    Query.equal('story_id', storyId),
    Query.equal('user_id', userId)
  ]);

  if (documents.length > 0) {
    // Retirar curtida
    await databases.deleteDocument(DATABASE_ID, COL_STORY_LIKES, documents[0].$id);
    
    // Atualizar votos
    const storyResponse = await databases.getDocument(DATABASE_ID, COL_PUBLIC_STORIES, storyId);
    if (storyResponse) {
      await databases.updateDocument(DATABASE_ID, COL_PUBLIC_STORIES, storyId, { 
        votes: Math.max(0, (storyResponse.votes || 0) - 1) 
      });
    }
    return 'unliked';
  } else {
    // Dar curtida
    await databases.createDocument(DATABASE_ID, COL_STORY_LIKES, ID.unique(), { story_id: storyId, user_id: userId });
    
    // Atualizar votos
    const storyResponse = await databases.getDocument(DATABASE_ID, COL_PUBLIC_STORIES, storyId);
    if (storyResponse) {
      await databases.updateDocument(DATABASE_ID, COL_PUBLIC_STORIES, storyId, { 
        votes: (storyResponse.votes || 0) + 1 
      });
    }
    return 'liked';
  }
};

// --- SERVIÇOS DE PERFIL E PREFERÊNCIAS ---

export const updateProfileLanguage = async (userId: string, lang: string) => {
  if (!isCloudEnabled) return;
  try {
    await databases.updateDocument(DATABASE_ID, COL_PROFILES, userId, { language_preference: lang });
  } catch(e) { console.warn(e); }
};

export const getProfileLanguage = async (userId: string) => {
  if (!isCloudEnabled) return null;
  try {
    const data = await databases.getDocument(DATABASE_ID, COL_PROFILES, userId);
    return data?.language_preference;
  } catch(e) { return null; }
};

export const updateProfileSettings = async (userId: string, settings: any) => {
  try {
    const currentLocal = localStorage.getItem(`user_settings_${userId}`);
    const parsedLocal = currentLocal ? JSON.parse(currentLocal) : {};
    const newSettings = { ...parsedLocal, ...settings };
    localStorage.setItem(`user_settings_${userId}`, JSON.stringify(newSettings));
  } catch (e) {
    console.warn("LocalStorage save error:", e);
  }

  if (!isCloudEnabled) return;

  try {
    await databases.updateDocument(DATABASE_ID, COL_PROFILES, userId, { settings: JSON.stringify(settings) });
  } catch (err) {
    console.warn("DB Sync error:", err);
  }
};

export const getProfileSettings = async (userId: string): Promise<any> => {
  let remoteSettings: any = {};
  if (isCloudEnabled) {
    try {
      const data = await databases.getDocument(DATABASE_ID, COL_PROFILES, userId);
      if (data?.settings) {
        remoteSettings = typeof data.settings === 'string' ? JSON.parse(data.settings) : data.settings;
      }
    } catch (err) { }
  }

  let localSettings = {};
  try {
    const local = localStorage.getItem(`user_settings_${userId}`);
    if (local) localSettings = JSON.parse(local);
  } catch (e) { }

  return { ...localSettings, ...remoteSettings };
};

export const syncStoriesCount = async (userId: string, count: number) => {
  if (!isCloudEnabled) return;
  try {
    await databases.updateDocument(DATABASE_ID, COL_PROFILES, userId, { stories_count: count });
  } catch (e) {
    console.warn("Error syncing stories count:", e);
  }
};

export const getSpectatorSession = async (code: string) => {
  if (!isCloudEnabled) return null;
  const { documents } = await databases.listDocuments(DATABASE_ID, COL_SESSIONS, [Query.equal('code', code.toUpperCase())]);
  if (documents.length === 0) return null;
  return parseJsonObj(documents[0], 'story_data');
};