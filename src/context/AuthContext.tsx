
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'user' | 'admin';
  avatarUrl?: string;
  user_metadata?: {
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);

  // Mock signOut function
  const signOut = async () => {
    // In a real implementation, this would call the Supabase signOut method
    setUser(null);
  };

  // Mock login function
  const login = async (email: string, password: string) => {
    // This would actually validate credentials in a real app
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email && password) {
      setUser({
        id: '123',
        email: email,
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        role: email.includes('admin') ? 'admin' : 'user',
        avatarUrl: 'https://github.com/shadcn.png',
        user_metadata: {
          avatar_url: 'https://github.com/shadcn.png',
        },
      });
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: 'Invalid credentials' };
  };

  // Mock loginWithGoogle function
  const loginWithGoogle = async () => {
    // This would redirect to Google auth in a real app
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setUser({
      id: '123',
      email: 'google@example.com',
      firstName: 'Google',
      lastName: 'User',
      name: 'Google User',
      role: 'user',
      avatarUrl: 'https://github.com/shadcn.png',
      user_metadata: {
        avatar_url: 'https://github.com/shadcn.png',
      },
    });
    setIsLoading(false);
    return { success: true };
  };

  // Mock register function
  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email && password) {
      setUser({
        id: '123',
        email,
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        role: 'user',
        avatarUrl: 'https://github.com/shadcn.png',
        user_metadata: {
          avatar_url: 'https://github.com/shadcn.png',
        },
      });
      setIsLoading(false);
      return { success: true };
    }
    
    setIsLoading(false);
    return { success: false, error: 'Registration failed' };
  };

  // Alias for signOut to maintain both naming conventions
  const logout = signOut;

  // Mock forgotPassword function
  const forgotPassword = async (email: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  };

  // Mock resetPassword function
  const resetPassword = async (password: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return { success: true };
  };

  // Mock updateProfile function
  const updateProfile = async (data: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...data } : null);
    return { success: true };
  };

  // Mock user authentication - in a real app this would use Supabase auth
  useEffect(() => {
    // Simulate loading user
    setTimeout(() => {
      setUser({
        id: '123',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        name: 'Test User',
        role: 'admin',
        avatarUrl: 'https://github.com/shadcn.png',
        user_metadata: {
          avatar_url: 'https://github.com/shadcn.png',
        },
      });
      setIsLoading(false);
      setAuthInitialized(true);
    }, 1000);
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      signOut, 
      isLoading, 
      isAuthenticated: !!user,
      isAdmin: user?.role === 'admin',
      authInitialized,
      login,
      loginWithGoogle,
      register,
      logout,
      forgotPassword,
      resetPassword,
      updateProfile
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
