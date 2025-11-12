import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { AuthService, User } from '@classified-marketplace/shared';
import { supabase } from '@/lib/supabase';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  authService: AuthService;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const authService = new AuthService(supabase);

  useEffect(() => {
    // Get initial session
    authService.getSession().then(({ session: initialSession }) => {
      setSession(initialSession);
      if (initialSession?.user) {
        loadUserProfile(initialSession.user.id);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const subscription = authService.onAuthStateChange((newSession: Session | null) => {
      setSession(newSession);
      if (newSession?.user) {
        loadUserProfile(newSession.user.id);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    const { profile, error } = await authService.getUserProfile(userId);
    if (profile && !error) {
      // Merge auth user email with profile
      setUser({ ...profile, email: session?.user?.email || '' });
    }
    setLoading(false);
  };

  const refreshUser = async () => {
    if (session?.user?.id) {
      const { profile, error } = await authService.getUserProfile(session.user.id);
      if (profile && !error) {
        setUser({ ...profile, email: session.user.email || '' });
      }
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, loading, authService, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
