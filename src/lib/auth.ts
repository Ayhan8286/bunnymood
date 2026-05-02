import { supabase } from './supabase';

export interface AuthUser {
  id: string;
  name: string;
}

const SESSION_KEY = 'bunny_session';

export const getSession = (): AuthUser | null => {
  const s = localStorage.getItem(SESSION_KEY);
  return s ? JSON.parse(s) : null;
};

const saveSession = (user: AuthUser) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
};

export const login = async (name: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name')
    .eq('name', name.toLowerCase().trim())
    .eq('password', password)
    .single();

  if (error || !data) return { user: null, error: 'Wrong name or password 🐰' };
  const user: AuthUser = { id: data.id, name: data.name };
  saveSession(user);
  return { user, error: null };
};

export const register = async (name: string, password: string): Promise<{ user: AuthUser | null; error: string | null }> => {
  const cleanName = name.toLowerCase().trim();

  // Check if name exists
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('name', cleanName)
    .single();

  if (existing) return { user: null, error: 'That name is taken 💕 try another?' };

  const { data, error } = await supabase
    .from('users')
    .insert({ name: cleanName, password })
    .select('id, name')
    .single();

  if (error || !data) return { user: null, error: 'Couldn\'t create account, try again 🌸' };
  const user: AuthUser = { id: data.id, name: data.name };
  saveSession(user);
  return { user, error: null };
};
