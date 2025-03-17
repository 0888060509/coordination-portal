
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { forceToDashboard, forceToLogin, navigateTo } from '@/services/navigationService';

/**
 * A simplified hook that handles authentication redirects
 * This now uses the centralized navigation service for reliability
 */
export function useRedirectAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeout = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  
  // Set up isMounted ref for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Set up authentication check
  useEffect(() => {
    // Check for active session directly
    const checkSession = async () => {
      if (!isMountedRef.current) return;
      
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
            console.log("🔐 Active session detected in useRedirectAuth");
            // Store success in localStorage for other components
            localStorage.setItem('auth_success', 'true');
            localStorage.setItem('auth_timestamp', Date.now().toString());
            navigate('/dashboard', { replace: true });
          }
        } else {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register' && 
              currentPath !== '/' && !currentPath.includes('/reset-password') && 
              !currentPath.includes('/forgot-password')) {
            console.log("🔐 No active session in useRedirectAuth");
            navigate('/login', { replace: true });
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    // Run initial session check
    checkSession();
    
    // Set up interval for continuous session checks only if not on dashboard
    if (location.pathname !== '/dashboard') {
      checkInterval.current = setInterval(() => {
        if (location.pathname !== '/dashboard') {
          checkSession();
        }
      }, 5000); // Less frequent checks to avoid overwhelming the system
    }
    
    // Set a hard timeout to stop checking after reasonable time
    navigationTimeout.current = setTimeout(() => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
        checkInterval.current = null;
      }
    }, 30000); // Stop checking after 30 seconds
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMountedRef.current) return;
      
      console.log("🔐 Auth state changed:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('auth_success', 'true');
        localStorage.setItem('auth_timestamp', Date.now().toString());
        
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
          navigate('/dashboard', { replace: true });
        }
        
        toast({
          title: "Successfully signed in",
          description: "Welcome to MeetingMaster!",
        });
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('auth_success');
        localStorage.removeItem('auth_timestamp');
        
        toast({
          title: "Successfully signed out",
          description: "You have been logged out successfully",
        });
        
        navigate('/login', { replace: true });
      }
    });
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
      
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      
      subscription.unsubscribe();
    };
  }, [location.pathname, navigate]);
  
  return {
    forceToDashboard: () => {
      navigate('/dashboard', { replace: true });
    },
    forceToLogin: () => {
      navigate('/login', { replace: true });
    },
    navigateTo: (path: string) => {
      navigate(path, { replace: false });
    }
  };
}
