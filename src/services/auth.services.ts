





// Fix: Importação de React adicionada para resolver o erro no namespace React.FormEvent (Linha 21)
import React from 'react';
import { supabase } from '@/services/services';

export const ensureProfileExists = async (user: any) => {
  if (!supabase || !user) return;
  try {
    // Tenta obter o nome de várias fontes possíveis nos metadados
    // PRIORIDADE: username (custom) > full_name (google/social) > name > email
    const meta = user.user_metadata || {};
    const name = meta.username || meta.full_name || meta.name || user.email?.split('@')[0];
    
    // Tenta obter a imagem de perfil
    const avatarUrl = meta.avatar_url || meta.picture || null;

    // Usamos UPSERT diretamente. Se o registo já existir, ele não faz nada ou atualiza.
    // Atualiza o avatar se disponível
    await supabase.from('profiles').upsert({
      id: user.id,
      username: name,
      avatar_url: avatarUrl,
      stories_count: 0
    }, { onConflict: 'id' });
    
  } catch (e) {
    console.error("Erro ao garantir existência de perfil:", e);
  }
};

export const handleAuthSubmit = async (e: React.FormEvent, mode: 'login' | 'signup') => {
  if (!supabase) throw new Error("Supabase não configurado");
  const formData = new FormData(e.target as HTMLFormElement);
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const username = formData.get('username') as string;
  
  const auth = (supabase as any).auth;
  if (mode === 'signup') {
    // Fix: Redirecionamento explícito adicionado para evitar "requested path is invalid"
    const { error } = await auth.signUp({ 
      email, 
      password, 
      options: { 
        emailRedirectTo: window.location.origin, // FORÇA O REGRESSO À URL ATUAL
        data: { 
          username,
          display_name: username, // OBRIGATÓRIO para aparecer na coluna "User" do Supabase Auth
          full_name: username     // Boa prática para compatibilidade com outros sistemas
        }
      } 
    });
    if (error) throw error;
    return { success: true, mode: 'signup' };
  } else { 
    const { error } = await auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { success: true, mode: 'login' };
  }
};

export const handleSocialLogin = async (provider: 'google') => {
  if (!supabase) throw new Error("Supabase não configurado");
  const auth = (supabase as any).auth;
  
  const { error } = await auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) throw error;
};