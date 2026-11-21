import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type { Profile, UserRole } from '../types/database';

export interface AuthUserState {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthContextValue {
  user: AuthUserState | null;
  loading: boolean;
  signInWithSupabase: (email: string, password: string) => Promise<AuthUserState>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchUserProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .eq('id', userId)
    .single();

  if (error || !data) {
    throw new Error(error?.message || 'Unable to load user profile role.');
  }
  return data as Profile;
}

export function isStaffRole(role: UserRole): boolean {
  return role === 'admin' || role === 'staff';
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUserState | null>(null);
  const [loading, setLoading] = useState(true);

  const restoreSession = useCallback(async () => {
    setLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const sessionUser = sessionData.session?.user;
      if (sessionUser) {
        const profile = await fetchUserProfile(sessionUser.id);
        setUser({
          id: sessionUser.id,
          email: sessionUser.email ?? '',
          fullName: profile.full_name || sessionUser.email || 'Barangay User',
          role: profile.role,
        });
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        setUser(null);
        return;
      }
      if (session?.user) {
        try {
          const profile = await fetchUserProfile(session.user.id);
          setUser({
            id: session.user.id,
            email: session.user.email ?? '',
            fullName: profile.full_name || session.user.email || 'Barangay User',
            role: profile.role,
          });
        } catch {
          setUser(null);
        }
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [restoreSession]);

  const signInWithSupabase = useCallback(async (email: string, password: string): Promise<AuthUserState> => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      throw new Error(error?.message || 'Invalid email or password.');
    }

    const profile = await fetchUserProfile(data.user.id);
    const nextUser: AuthUserState = {
      id: data.user.id,
      email: data.user.email ?? email.trim(),
      fullName: profile.full_name || data.user.email || 'Barangay User',
      role: profile.role,
    };
    setUser(nextUser);
    return nextUser;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithSupabase,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
