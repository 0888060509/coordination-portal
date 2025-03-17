
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';
import '@testing-library/jest-dom'; // Import jest-dom matchers

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(() => ({
        data: {
          subscription: {
            unsubscribe: vi.fn()
          }
        }
      })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn()
        }))
      }))
    })),
  },
  handleSupabaseError: vi.fn((error) => error.message || 'An error occurred'),
  processAuthHash: vi.fn(),
  storeOAuthState: vi.fn(),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
  toast: vi.fn(),
}));

// Mock the new utility hooks
vi.mock('@/hooks/useAuthMethods', () => ({
  useAuthMethods: () => ({
    login: vi.fn().mockImplementation(async (email, password) => {
      if (email === 'test@example.com' && password === 'password123') {
        return { data: { session: { user: { id: 'test-user-id' } } } };
      }
      return { error: { message: 'Invalid credentials' } };
    }),
    loginWithGoogle: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    refreshProfile: vi.fn(),
  }),
}));

vi.mock('@/hooks/useOAuthCallback', () => ({
  useOAuthCallback: vi.fn(),
}));

vi.mock('@/hooks/useAuthState', () => ({
  useAuthState: vi.fn(),
}));

vi.mock('@/utils/userTransform', () => ({
  fetchProfile: vi.fn(),
  transformUser: vi.fn(),
}));

// Test component to access auth context
const TestComponent = () => {
  const { login, isLoading, isAuthenticated } = useAuth();
  
  return (
    <div>
      <div data-testid="loading-status">{isLoading.toString()}</div>
      <div data-testid="auth-status">{isAuthenticated.toString()}</div>
      <button 
        data-testid="login-button" 
        onClick={() => login('test@example.com', 'password123')}
      >
        Login
      </button>
    </div>
  );
};

describe('AuthContext - login function', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock for getSession
    vi.mocked(supabase.auth.getSession).mockResolvedValue({
      data: { session: null },
      error: null,
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should provide auth context values to consumers', async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId('loading-status')).toBeInTheDocument();
    expect(screen.getByTestId('auth-status')).toBeInTheDocument();
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });
});
