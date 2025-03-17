
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * A hook that handles authentication redirects with extreme reliability
 * This is a specialized hook that focuses only on the navigation part
 * of authentication to ensure users always end up where they should be
 */
export function useRedirectAuth() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirecting = useRef(false);
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeout = useRef<NodeJS.Timeout | null>(null);

  // Function to force navigation to dashboard with multiple fallbacks
  const forceToDashboard = () => {
    if (redirecting.current) return;
    redirecting.current = true;
    
    console.log("🔐 FORCE NAVIGATION: Redirecting authenticated user to dashboard");
    
    // Clear any existing intervals
    if (checkInterval.current) clearInterval(checkInterval.current);
    if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
    
    // Method 1: React Router (clean SPA navigation)
    navigate('/dashboard', { replace: true });
    
    // Method 2: After short delay, direct location change if still on wrong page
    setTimeout(() => {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        console.log("🔐 FORCE NAVIGATION: Fallback 1 - window.location.href");
        window.location.href = '/dashboard';
      }
    }, 300);
    
    // Method 3: Ultimate fallback - force page reload to dashboard
    setTimeout(() => {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        console.log("🔐 FORCE NAVIGATION: Fallback 2 - location.replace");
        window.location.replace('/dashboard');
      }
    }, 800);
    
    // Method 4: Nuclear option - reload the whole page at dashboard URL
    setTimeout(() => {
      const currentPath = window.location.pathname;
      if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
        console.log("🔐 FORCE NAVIGATION: Fallback 3 - Full page reload");
        window.location.href = `${window.location.origin}/dashboard?forceReload=true`;
      }
    }, 1500);
  };

  // Function to navigate to login
  const forceToLogin = () => {
    if (redirecting.current) return;
    
    const currentPath = window.location.pathname;
    if (currentPath !== '/login' && currentPath !== '/register') {
      console.log("🔐 FORCE NAVIGATION: Redirecting unauthenticated user to login");
      redirecting.current = true;
      
      // Clear any existing intervals
      if (checkInterval.current) clearInterval(checkInterval.current);
      if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
      
      navigate('/login', { replace: true });
    }
  };

  // Set up authentication check
  useEffect(() => {
    // Flag to track component mounted state
    let isMounted = true;
    
    // First check for localStorage auth success indicator
    const checkLocalStorageAuth = () => {
      const authSuccess = localStorage.getItem('auth_success');
      const authTimestamp = localStorage.getItem('auth_timestamp');
      
      if (authSuccess === 'true' && authTimestamp) {
        const timestamp = parseInt(authTimestamp, 10);
        const now = Date.now();
        const fiveMinutesMs = 5 * 60 * 1000;
        
        if (now - timestamp < fiveMinutesMs) {
          console.log("🔐 Found recent auth success in localStorage");
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
            forceToDashboard();
            return true;
          }
        } else {
          // Clear stale auth success
          localStorage.removeItem('auth_success');
          localStorage.removeItem('auth_timestamp');
        }
      }
      return false;
    };
    
    // Check if already on dashboard and set redirecting state accordingly
    if (location.pathname === '/dashboard') {
      redirecting.current = true;
    }
    
    // Initial check from localStorage
    if (checkLocalStorageAuth()) {
      return; // Already redirecting based on localStorage
    }
    
    // Check for active session directly
    const checkSession = async () => {
      if (!isMounted || redirecting.current) return;
      
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
            console.log("🔐 Active session detected, redirecting to dashboard");
            forceToDashboard();
          }
        } else {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            console.log("🔐 No active session, redirecting to login");
            forceToLogin();
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    // Run initial session check
    checkSession();
    
    // Set up interval for continuous session checks
    checkInterval.current = setInterval(checkSession, 1000);
    
    // Set a hard timeout to stop checking after reasonable time
    navigationTimeout.current = setTimeout(() => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    }, 30000); // Stop checking after 30 seconds
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted || redirecting.current) return;
      
      console.log("🔐 Auth state changed:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('auth_success', 'true');
        localStorage.setItem('auth_timestamp', Date.now().toString());
        
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
          forceToDashboard();
        }
        
        toast({
          title: "Successfully signed in",
          description: "Welcome to MeetingMaster!",
        });
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('auth_success');
        localStorage.removeItem('auth_timestamp');
        redirecting.current = false;
        
        toast({
          title: "Successfully signed out",
          description: "You have been logged out successfully",
        });
        
        forceToLogin();
      }
    });
    
    // Also listen for storage events (for cross-tab communication)
    const handleStorageChange = (e: StorageEvent) => {
      if (!isMounted || redirecting.current) return;
      
      if (e.key === 'auth_success' && e.newValue === 'true') {
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
          forceToDashboard();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Cleanup
    return () => {
      isMounted = false;
      
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
      
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      
      subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [location.pathname, navigate]);
  
  return {
    forceToDashboard,
    forceToLogin
  };
}
