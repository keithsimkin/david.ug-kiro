import { SupabaseClient, Session, User as SupabaseUser } from '@supabase/supabase-js';
import type { SignUpData, SignInData, AuthProvider } from '../types/auth';
import type { User } from '../types';

export class AuthService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Sign up a new user with email and password
   */
  async signUp(data: SignUpData): Promise<{ user: SupabaseUser | null; error: Error | null }> {
    try {
      // Create auth user
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            full_name: data.fullName,
            username: data.username,
          },
        },
      });

      if (authError) {
        return { user: null, error: authError };
      }

      if (!authData.user) {
        return { user: null, error: new Error('User creation failed') };
      }

      // Create profile record
      const { error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          username: data.username,
          full_name: data.fullName,
          phone: data.phone,
          location: data.location,
        });

      if (profileError) {
        return { user: null, error: profileError };
      }

      return { user: authData.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Sign in with email and password
   */
  async signIn(data: SignInData): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data: authData, error } = await this.supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        return { session: null, error };
      }

      return { session: authData.session, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Sign in with social provider (Google or Apple)
   */
  async signInWithProvider(
    provider: AuthProvider, 
    redirectTo?: string
  ): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo,
        },
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.getSession();

      if (error) {
        return { session: null, error };
      }

      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Get the current user
   */
  async getCurrentUser(): Promise<{ user: SupabaseUser | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.getUser();

      if (error) {
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      return { user: null, error: error as Error };
    }
  }

  /**
   * Refresh the current session
   */
  async refreshSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();

      if (error) {
        return { session: null, error };
      }

      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error: error as Error };
    }
  }

  /**
   * Send password reset email
   */
  async resetPassword(email: string, redirectTo?: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Update user password
   */
  async updatePassword(newPassword: string): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error };
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (session: Session | null) => void) {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(
      (_event, session) => {
        callback(session);
      }
    );

    return subscription;
  }

  /**
   * Get user profile from database
   */
  async getUserProfile(userId: string): Promise<{ profile: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return { profile: null, error };
      }

      // Map database fields to User type
      const profile: User = {
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        email: '', // Will be populated from auth user
        phone: data.phone,
        location: data.location,
        avatarUrl: data.avatar_url,
        isAdmin: data.is_admin,
        isSuspended: data.is_suspended,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };

      return { profile, error: null };
    } catch (error) {
      return { profile: null, error: error as Error };
    }
  }
}
