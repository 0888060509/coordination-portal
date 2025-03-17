
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

// Track redirect attempts to prevent loops
let lastRedirectTime = 0;
const redirectCooldown = 3000; // 3 seconds between redirects

/**
 * A simplified hook that handles authentication redirects
 * with improved reliability and loop prevention
 */
export function useRedirectAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const isMountedRef = useRef(true);
  const redirectAttemptedRef = useRef(false);
  
  // Set up isMounted ref for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    redirectAttemptedRef.current = false;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Set up authentication check
  useEffect(() => {
    // Skip check if we've already attempted a redirect recently
    const currentTime = Date.now();
    if (currentTime - lastRedirectTime < redirectCooldown) {
      console.log("🔐 useRedirectAuth: Skipping check due to cooldown");
      return;
    }
    
    // Skip if this component already attempted a redirect
    if (redirectAttemptedRef.current) {
      console.log("🔐 useRedirectAuth: Already attempted redirect, skipping");
      return;
    }
    
    // Check for active session directly
    const checkSession = async () => {
      if (!isMountedRef.current) return;
      
      try {
        console.log("🔐 useRedirectAuth: Checking session");
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          const currentPath = window.location.pathname;
          if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
            console.log("🔐 Active session detected in useRedirectAuth");
            
            // Prevent redirect loop
            redirectAttemptedRef.current = true;
            lastRedirectTime = Date.now();
            
            // Store success in localStorage for other components
            localStorage.setItem('auth_success', 'true');
            localStorage.setItem('auth_timestamp', Date.now().toString());
            
            // Use window.location for most reliable navigation
            if (window.location.pathname !== '/dashboard') {
              window.location.href = '/dashboard';
            }
          }
        } else {
          const currentPath = window.location.pathname;
          const isPublicRoute = 
            currentPath === '/login' || 
            currentPath === '/register' || 
            currentPath === '/' || 
            currentPath.includes('/reset-password') || 
            currentPath.includes('/forgot-password');
            
          if (!isPublicRoute) {
            console.log("🔐 No active session in useRedirectAuth, path:", currentPath);
            
            // Prevent redirect loop
            redirectAttemptedRef.current = true;
            lastRedirectTime = Date.now();
            
            // Go to login
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
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
      
      // Skip if already redirected
      if (redirectAttemptedRef.current) {
        console.log("🔐 Already attempted redirect, skipping");
        return;
      }
      
      if (event === 'SIGNED_IN' && session) {
        // Prevent redirect loop
        redirectAttemptedRef.current = true;
        lastRedirectTime = Date.now();
        
        localStorage.setItem('auth_success', 'true');
        localStorage.setItem('auth_timestamp', Date.now().toString());
        
        toast({
          title: "Successfully signed in",
          description: "Welcome to MeetingMaster!",
        });
        
        // Use window.location for most reliable navigation
        if (window.location.pathname !== '/dashboard') {
          window.location.href = '/dashboard';
        }
      }
      
      if (event === 'SIGNED_OUT') {
        // Prevent redirect loop
        redirectAttemptedRef.current = true;
        lastRedirectTime = Date.now();
        
        localStorage.removeItem('auth_success');
        localStorage.removeItem('auth_timestamp');
        
        toast({
          title: "Successfully signed out",
          description: "You have been logged out successfully",
        });
        
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    });
    
    // Check session immediately
    checkSession();
    
    // Cleanup
    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);
  
  return {
    forceToDashboard: () => {
      // Prevent redirect loop
      if (window.location.pathname === '/dashboard') return;
      if (Date.now() - lastRedirectTime < redirectCooldown) return;
      
      lastRedirectTime = Date.now();
      window.location.href = '/dashboard';
    },
    forceToLogin: () => {
      // Prevent redirect loop
      if (window.location.pathname === '/login') return;
      if (Date.now() - lastRedirectTime < redirectCooldown) return;
      
      lastRedirectTime = Date.now();
      window.location.href = '/login';
    },
    navigateTo: (path: string) => {
      // Prevent redirect loop
      if (window.location.pathname === path) return;
      if (Date.now() - lastRedirectTime < redirectCooldown) return;
      
      lastRedirectTime = Date.now();
      window.location.href = path;
    }
  };
}
