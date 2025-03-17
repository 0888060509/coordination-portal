
import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  user_metadata?: {
    avatar_url?: string;
  };
}

interface AuthContextType {
  user: User | null;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isAuthenticated?: boolean;
  authInitialized?: boolean;
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

  // Mock user authentication - in a real app this would use Supabase auth
  useEffect(() => {
    // Simulate loading user
    setTimeout(() => {
      setUser({
        id: '123',
        email: 'test@example.com',
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
      authInitialized 
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
