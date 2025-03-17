
/**
 * Unified Navigation Service
 * 
 * This service centralizes all navigation logic in one place to prevent
 * inconsistencies and redirect loops.
 */

import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Configuration
const REDIRECT_COOLDOWN = 2000; // 2 seconds between redirects
const DEBUG = false; // Set to true to enable navigation debugging

// Navigation state tracking
let lastNavigationTime = 0;
let navigationInProgress = false;
let navigationCounter = 0;

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

/**
 * Check if a path is a public route
 */
export const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some(route => 
    path === route || 
    path.startsWith(`${route}/`)
  );
};

/**
 * Log navigation events if debugging is enabled
 */
const logNavigation = (message: string, data?: any) => {
  if (DEBUG) {
    if (data) {
      console.log(`🧭 NAV: ${message}`, data);
    } else {
      console.log(`🧭 NAV: ${message}`);
    }
  }
};

/**
 * Navigate to a route using the most appropriate method
 * 
 * @param path The path to navigate to
 * @param options Navigation options
 * @returns Whether navigation was successful
 */
export const navigateTo = (
  path: string, 
  options: {
    replace?: boolean;
    skipAuthCheck?: boolean;
    forceReload?: boolean;
    source?: string;
  } = {}
): boolean => {
  const {
    replace = false,
    skipAuthCheck = false,
    forceReload = false,
    source = 'unknown'
  } = options;

  // Get current path from window.location
  const currentPath = window.location.pathname;
  
  // Prevent navigation to the same route
  if (currentPath === path && !forceReload) {
    logNavigation(`Already on ${path} (requested by ${source})`);
    return false;
  }
  
  // Prevent multiple navigations in rapid succession
  const currentTime = Date.now();
  if (navigationInProgress && currentTime - lastNavigationTime < REDIRECT_COOLDOWN) {
    logNavigation(`Navigation already in progress (requested by ${source})`);
    return false;
  }
  
  // Set navigation state
  navigationInProgress = true;
  lastNavigationTime = currentTime;
  navigationCounter++;
  
  // Create a unique ID for this navigation attempt
  const navigationId = navigationCounter;
  
  logNavigation(`Navigating to ${path} (requested by ${source}, id: ${navigationId})`);
  
  // Use window.location for reliable navigation
  if (forceReload) {
    window.location.href = path;
  } else {
    // Use history API for smoother navigation
    if (replace) {
      window.history.replaceState(null, '', path);
    } else {
      window.history.pushState(null, '', path);
    }
    
    // Dispatch a popstate event to notify React Router
    window.dispatchEvent(new PopStateEvent('popstate', { state: null }));
  }
  
  // Reset navigation flag after a delay
  setTimeout(() => {
    if (navigationId === navigationCounter) {
      navigationInProgress = false;
      logNavigation(`Navigation cooldown reset (id: ${navigationId})`);
    }
  }, REDIRECT_COOLDOWN);
  
  return true;
};

/**
 * Navigate to the dashboard
 */
export const navigateToDashboard = (options: { source?: string } = {}) => {
  // Set auth success in localStorage
  localStorage.setItem('auth_success', 'true');
  localStorage.setItem('auth_timestamp', Date.now().toString());
  
  return navigateTo('/dashboard', {
    replace: true,
    ...options
  });
};

/**
 * Navigate to the login page
 */
export const navigateToLogin = (options: { source?: string } = {}) => {
  // Clear auth data from localStorage
  localStorage.removeItem('auth_success');
  localStorage.removeItem('auth_timestamp');
  
  return navigateTo('/login', {
    replace: true,
    ...options
  });
};

/**
 * Check authentication status and redirect if necessary
 * 
 * @returns Promise resolving to whether a redirect occurred
 */
export const checkAuthAndRedirect = async (): Promise<boolean> => {
  try {
    // Get current session
    const { data } = await supabase.auth.getSession();
    const session = data.session;
    
    // Get current path
    const currentPath = window.location.pathname;
    
    // Handle authenticated user
    if (session) {
      logNavigation('User authenticated', { path: currentPath });
      
      // Store auth success in localStorage
      localStorage.setItem('auth_success', 'true');
      localStorage.setItem('auth_timestamp', Date.now().toString());
      
      // If on a public route, redirect to dashboard
      if (isPublicRoute(currentPath)) {
        toast({
          title: "Already signed in",
          description: "Redirecting to dashboard",
        });
        
        return navigateToDashboard({ source: 'checkAuthAndRedirect' });
      }
      
      return false;
    }
    
    // Handle unauthenticated user
    logNavigation('User not authenticated', { path: currentPath });
    
    // Clear auth data from localStorage
    localStorage.removeItem('auth_success');
    localStorage.removeItem('auth_timestamp');
    
    // If not on a public route, redirect to login
    if (!isPublicRoute(currentPath)) {
      toast({
        title: "Session expired",
        description: "Please sign in again",
        variant: "destructive"
      });
      
      return navigateToLogin({ source: 'checkAuthAndRedirect' });
    }
    
    return false;
  } catch (error) {
    console.error('Error checking auth status:', error);
    return false;
  }
};

/**
 * Set up auth state change listeners for navigation
 */
export const setupAuthChangeNavigation = () => {
  // Set up auth state change listener for navigation
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logNavigation(`Auth state changed: ${event}`, { session: session ? 'exists' : 'none' });
    
    // Handle sign in
    if (event === 'SIGNED_IN' && session) {
      toast({
        title: "Successfully signed in",
        description: "Welcome to MeetingMaster!",
      });
      
      navigateToDashboard({ source: 'authStateChange' });
    }
    
    // Handle sign out
    if (event === 'SIGNED_OUT') {
      toast({
        title: "Successfully signed out",
        description: "You have been logged out successfully",
      });
      
      navigateToLogin({ source: 'authStateChange' });
    }
  });
  
  // Return unsubscribe function
  return () => {
    subscription.unsubscribe();
  };
};

// Export a hook for React components to use
export function useAppNavigation() {
  return {
    navigateTo,
    navigateToDashboard,
    navigateToLogin,
    checkAuthAndRedirect
  };
}
