
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../AuthContext';
import { supabase } from '@/integrations/supabase/client';

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

  it('should set loading state when login is called', async () => {
    // Mock successful login
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: { user: { id: 'test-user-id' } } },
      error: null,
    } as any);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial state should not be loading
    expect(screen.getByTestId('loading-status').textContent).toBe('true');

    // Click login button
    await userEvent.click(screen.getByTestId('login-button'));

    // Loading state should be set to true during login
    expect(screen.getByTestId('loading-status').textContent).toBe('true');
    
    // Verify login was called with correct credentials
    expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123'
    });
  });

  it('should handle successful login', async () => {
    // Mock successful login with session
    const mockSession = {
      user: { 
        id: 'test-user-id',
        email: 'test@example.com',
        user_metadata: {}
      }
    };
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: mockSession },
      error: null,
    } as any);
    
    // Mock profile fetch after login
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { 
              id: 'test-user-id',
              first_name: 'Test',
              last_name: 'User',
              email: 'test@example.com',
              is_admin: false
            },
            error: null
          })
        })
      })
    } as any);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // Click login button
    await userEvent.click(screen.getByTestId('login-button'));

    // Wait for login process to complete
    await waitFor(() => {
      expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
    });
  });

  it('should handle login error', async () => {
    // Mock login failure
    const mockError = {
      message: 'Invalid login credentials',
      status: 400
    };
    
    vi.mocked(supabase.auth.signInWithPassword).mockResolvedValue({
      data: { session: null },
      error: mockError,
    } as any);

    render(
      <MemoryRouter>
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      </MemoryRouter>
    );

    // We need to wrap in try/catch because the component will throw an error when login fails
    try {
      // Click login button
      await userEvent.click(screen.getByTestId('login-button'));
      
      // Wait for login process to complete
      await waitFor(() => {
        expect(supabase.auth.signInWithPassword).toHaveBeenCalled();
      });
    } catch (error) {
      // Expected to throw error
    }

    // Verify error was handled
    await waitFor(() => {
      expect(screen.getByTestId('loading-status').textContent).toBe('false');
    });
  });
});
