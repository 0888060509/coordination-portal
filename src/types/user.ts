
// User type definition
export interface User {
  id: string;
  email: string;
  name: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  role: "admin" | "user";
  department?: string;
  position?: string;
}

// Auth context type definition
export interface AuthContextType {
  user: User | null;
  session: import("@supabase/supabase-js").Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  authInitialized: boolean;
  login: (email: string, password: string) => Promise<{ error?: import("@supabase/supabase-js").AuthError; data?: any }>;
  loginWithGoogle: () => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}
