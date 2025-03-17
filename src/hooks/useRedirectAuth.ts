
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

/**
 * A simplified hook that handles authentication redirects
 * with improved reliability
 */
export function useRedirectAuth() {
  const location = useLocation();
  const navigate = useNavigate();
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
            // Use window.location for most reliable navigation
            window.location.href = '/dashboard';
          }
        } else {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register' && 
              currentPath !== '/' && !currentPath.includes('/reset-password') && 
              !currentPath.includes('/forgot-password')) {
            console.log("🔐 No active session in useRedirectAuth");
            window.location.href = '/login';
          }
        }
      } catch (error) {
        console.error("Error checking session:", error);
      }
    };
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMountedRef.current) return;
      
      console.log("🔐 Auth state changed:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('auth_success', 'true');
        localStorage.setItem('auth_timestamp', Date.now().toString());
        
        toast({
          title: "Successfully signed in",
          description: "Welcome to MeetingMaster!",
        });
        
        // Use window.location for most reliable navigation
        window.location.href = '/dashboard';
      }
      
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('auth_success');
        localStorage.removeItem('auth_timestamp');
        
        toast({
          title: "Successfully signed out",
          description: "You have been logged out successfully",
        });
        
        window.location.href = '/login';
      }
    });
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [location.pathname]);
  
  return {
    forceToDashboard: () => {
      window.location.href = '/dashboard';
    },
    forceToLogin: () => {
      window.location.href = '/login';
    },
    navigateTo: (path: string) => {
      window.location.href = path;
    }
  };
}
