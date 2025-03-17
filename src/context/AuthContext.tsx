
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { transformUser } from '@/utils/userTransform';
import { User } from '@/types/user';
import { useAuthState } from '@/hooks/useAuthState';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  authInitialized: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  refreshProfile: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Use the useAuthState hook to handle auth state changes
  useAuthState({
    setUser,
    setSession,
    setIsLoading,
    setIsAdmin,
    setAuthInitialized
  });

  // Sign out function
  const signOut = async (): Promise<void> => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: 'Sign out failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Login function
  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
      }

      // User data will be set by useAuthState hook
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected login error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred during login' };
    } finally {
      setIsLoading(false);
    }
  };

  // Login with Google function
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        console.error('Google login error:', error);
        return { success: false, error: error.message };
      }

      // This will redirect the user, so we won't reach here normally
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected Google login error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred during Google login' };
    }
  };

  // Register function
  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      // Create the auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
        },
      });

      if (error) {
        console.error('Registration error:', error);
        return { success: false, error: error.message };
      }

      // Update the profile with names
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            first_name: firstName,
            last_name: lastName,
          })
          .eq('id', data.user.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }

      // User data will be set by useAuthState hook
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected registration error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred during registration' };
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for signOut to maintain both naming conventions
  const logout = signOut;

  // Forgot password function
  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error('Forgot password error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Unexpected forgot password error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  // Reset password function
  const resetPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Unexpected reset password error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  // Update profile function
  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user?.id) {
        return { success: false, error: 'User not authenticated' };
      }

      // Update auth metadata if needed
      if (data.email) {
        const { error } = await supabase.auth.updateUser({
          email: data.email,
        });

        if (error) {
          return { success: false, error: error.message };
        }
      }

      // Update profile data
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName ?? user.firstName,
          last_name: data.lastName ?? user.lastName,
          avatar_url: data.avatarUrl ?? user.avatarUrl,
          department: data.department ?? user.department,
          position: data.position ?? user.position,
        })
        .eq('id', user.id);

      if (error) {
        console.error('Error updating profile:', error);
        return { success: false, error: error.message };
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...data } : null);
      return { success: true };
    } catch (error: any) {
      console.error('Unexpected profile update error:', error);
      return { success: false, error: error.message || 'An unexpected error occurred' };
    }
  };

  // Refresh profile function
  const refreshProfile = async (): Promise<boolean> => {
    try {
      if (!session?.user) {
        return false;
      }

      const userData = await transformUser(session.user, session);
      
      if (userData) {
        setUser(userData);
        setIsAdmin(userData.role === 'admin');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing profile:', error);
      return false;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session,
      signOut, 
      isLoading, 
      isAuthenticated: !!user,
      isAdmin,
      authInitialized,
      login,
      loginWithGoogle,
      register,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile,
      refreshProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// Original hook
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

// Alias for compatibility with existing code
export const useAuth = useAuthContext;
