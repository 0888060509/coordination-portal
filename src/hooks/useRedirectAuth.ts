
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { forceToDashboard, forceToLogin } from '@/services/navigationService';

/**
 * A simplified hook that handles authentication redirects
 * This now uses the centralized navigation service for reliability
 */
export function useRedirectAuth() {
  const location = useLocation();
  const checkInterval = useRef<NodeJS.Timeout | null>(null);
  const navigationTimeout = useRef<NodeJS.Timeout | null>(null);
  
  // Set up authentication check
  useEffect(() => {
    // Flag to track component mounted state
    let isMounted = true;
    
    // Check for active session directly
    const checkSession = async () => {
      if (!isMounted) return;
      
      try {
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
            console.log("🔐 Active session detected in useRedirectAuth");
            // Store success in localStorage for other components
            localStorage.setItem('auth_success', 'true');
            localStorage.setItem('auth_timestamp', Date.now().toString());
            forceToDashboard('useRedirectAuth-session');
          }
        } else {
          const currentPath = window.location.pathname;
          if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
            console.log("🔐 No active session in useRedirectAuth");
            forceToLogin('useRedirectAuth-no-session');
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
      }, 2000); // Less frequent checks to avoid overwhelming the system
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
      if (!isMounted) return;
      
      console.log("🔐 Auth state changed:", event, session ? "Session exists" : "No session");
      
      if (event === 'SIGNED_IN' && session) {
        localStorage.setItem('auth_success', 'true');
        localStorage.setItem('auth_timestamp', Date.now().toString());
        
        const currentPath = window.location.pathname;
        if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
          forceToDashboard('useRedirectAuth-SIGNED_IN');
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
        
        forceToLogin('useRedirectAuth-SIGNED_OUT');
      }
    });
    
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
    };
  }, [location.pathname]);
  
  return {
    forceToDashboard: () => forceToDashboard('useRedirectAuth-explicit'),
    forceToLogin: () => forceToLogin('useRedirectAuth-explicit')
  };
}
