import React from 'react';
import { account, databases, DATABASE_ID, COL_PROFILES, isCloudEnabled } from '@/services/services';
import { ID, OAuthProvider } from 'appwrite';

export const ensureProfileExists = async (user: any) => {
  if (!isCloudEnabled || !user) return;
  try {
    const name = user.name || user.email?.split('@')[0];
    const avatarUrl = user.prefs?.avatar_url || null;

    try {
      // Verifica se o documento do perfil já existe
      await databases.getDocument(DATABASE_ID, COL_PROFILES, user.$id);
    } catch (e: any) {
      if (e.code === 404) {
        // Cria perfil se não existir
        await databases.createDocument(DATABASE_ID, COL_PROFILES, user.$id, {
          username: name,
          avatar_url: avatarUrl,
          stories_count: 0
        });
      }
    }
  } catch (e) {
    console.error("Erro ao garantir existência de perfil:", e);
  }
};

export const handleAuthSubmit = async (e: React.FormEvent, mode: 'login' | 'signup') => {
  if (!isCloudEnabled) throw new Error("Appwrite não configurado");
  const formData = new FormData(e.target as HTMLFormElement);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  
  if (mode === 'signup') {
    const user = await account.create(ID.unique(), email, password, username);
    // Auto-login logo após registrar
    await account.createEmailPasswordSession(email, password);
    return { success: true, mode: 'signup', user };
  } else { 
    const session = await account.createEmailPasswordSession(email, password);
    return { success: true, mode: 'login', session };
  }
};

export const handleSocialLogin = async (provider: 'google') => {
  if (!isCloudEnabled) throw new Error("Appwrite não configurado");
  
  account.createOAuth2Session(
    OAuthProvider.Google,
    window.location.origin, // redirect de sucesso
    window.location.origin  // redirect de falha
  );
};