
// This file contains the Supabase client configuration.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { toast } from '@/hooks/use-toast';

const SUPABASE_URL = "https://wdooqruganwbzukglerv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkb29xcnVnYW53Ynp1a2dsZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTU5NjYsImV4cCI6MjA1NzU5MTk2Nn0.fwYbP60XTUPyjijVYSegx7YAMWFw_Nx3iR3VPZqwbe4";

// Import the supabase client like this:
// import { supabase, handleSupabaseError } from "@/integrations/supabase/client";

// Configure with retries and improved error handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // Explicitly disable automatic handling to avoid hash parsing issues
    flowType: 'implicit', // This is important for OAuth with hash fragment handling
    debug: true, // Enable debug mode to see more information about auth state
  },
  global: {
    fetch: (url: RequestInfo | URL, options?: RequestInit) => {
      const fetchOptions = {
        ...options,
        // Increase timeouts for better resilience
        cache: 'no-store' as RequestCache,
      };
      
      return fetch(url, fetchOptions)
        .then(response => {
          if (!response.ok) {
            console.warn(`Supabase fetch failed for ${url.toString()}`, response.status);
          }
          return response;
        })
        .catch(error => {
          console.error(`Supabase fetch error for ${url.toString()}:`, error);
          throw error; // Re-throw to allow supabase client to handle
        });
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper function to handle Supabase errors consistently
export const handleSupabaseError = (error: any): string => {
  console.error('Supabase error:', error);
  
  // Extract the most user-friendly error message
  if (error.message) {
    return error.message;
  }
  
  if (error.error_description) {
    return error.error_description;
  }
  
  return 'An unexpected error occurred. Please try again.';
};

// Generate a random state value for CSRF protection
const generateState = () => {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Store the state in localStorage for verification
export const storeOAuthState = () => {
  const state = generateState();
  localStorage.setItem('oauth_state', state);
  return state;
};

// Verify the state from the OAuth response
const verifyOAuthState = (responseState: string | null) => {
  const storedState = localStorage.getItem('oauth_state');
  if (!responseState || !storedState || responseState !== storedState) {
    console.error('OAuth state mismatch, possible CSRF attack');
    return false;
  }
  return true;
};

// Enhanced function to manually parse auth hash from URL (for OAuth flows)
export const parseAuthHashFromUrl = async () => {
  console.log('Checking for auth hash in URL:', window.location.hash);
  
  if (window.location.hash && window.location.hash.includes('access_token')) {
    try {
      console.log('Found access_token in URL hash, processing manually...');
      
      // Extract tokens from the hash
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');
      const state = params.get('state');
      const tokenType = params.get('token_type');
      
      console.log('Extracted tokens:', { 
        accessToken: accessToken ? 'present' : 'missing', 
        refreshToken: refreshToken ? 'present' : 'missing',
        expiresIn: expiresIn || 'not set',
        state: state ? 'present' : 'missing',
        tokenType
      });
      
      // Verify state if present (CSRF protection)
      if (state && !verifyOAuthState(state)) {
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Security verification failed. Please try logging in again.",
        });
        return null;
      }
      
      if (!accessToken) {
        console.error('Missing access_token in the URL hash');
        toast({
          variant: "destructive",
          title: "Authentication failed",
          description: "Access token missing from authentication response.",
        });
        return null;
      }
      
      // Calculate expiry time if expires_in is present
      let expiresAt: number | undefined;
      if (expiresIn) {
        expiresAt = Math.floor(Date.now() / 1000) + parseInt(expiresIn, 10);
      }
      
      // Try to set the session manually
      console.log('Attempting to set session with extracted tokens');
      
      // Prepare session data
      const sessionData = {
        access_token: accessToken,
        refresh_token: refreshToken || null,
        expires_in: expiresIn ? parseInt(expiresIn, 10) : 3600,
        expires_at: expiresAt,
        token_type: tokenType || 'bearer'
      };
      
      // Clear hash from URL before processing to prevent loops
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      
      const { data, error } = await supabase.auth.setSession(sessionData);
      
      if (error) {
        console.error('Error setting session from hash:', error);
        toast({
          variant: "destructive",
          title: "Authentication error",
          description: error.message || "Failed to complete authentication.",
        });
        return null;
      }
      
      console.log('Session successfully set from hash');
      return data.session;
    } catch (error) {
      console.error('Error in parseAuthHashFromUrl:', error);
      toast({
        variant: "destructive",
        title: "Authentication error",
        description: "An error occurred while processing your login. Please try again.",
      });
      return null;
    }
  }
  
  console.log('No auth hash found in URL');
  return null;
};

// Fixed processAuthHash function with protection against multiple executions
let isProcessingHash = false;
let lastProcessTime = 0;
const PROCESS_COOLDOWN = 2000; // 2 second cooldown

// Improved function to process auth hash with additional logging and fallbacks
export const processAuthHash = async () => {
  const currentTime = Date.now();
  
  // Only process if not already processing and cooldown period has elapsed
  if (isProcessingHash || currentTime - lastProcessTime < PROCESS_COOLDOWN) {
    console.log('Skipping processAuthHash - already processing or cooldown not elapsed');
    return null;
  }
  
  console.log('processAuthHash called, location hash:', window.location.hash?.substring(0, 30) + '...');
  
  if (!window.location.hash || !window.location.hash.includes('access_token')) {
    console.log('No access_token in hash, skipping processAuthHash');
    return null;
  }
  
  try {
    isProcessingHash = true;
    lastProcessTime = currentTime;
    
    // First try manual parsing since the built-in methods don't seem to be working
    console.log('Trying manual hash parsing first');
    const session = await parseAuthHashFromUrl();
    if (session) {
      console.log('Manual session parsing successful');
      isProcessingHash = false;
      return session;
    }
    
    // If that fails, try the built-in Supabase method
    console.log('Manual parsing failed, trying built-in getSession method');
    const { data, error } = await supabase.auth.getSession();
    
    if (!error && data.session) {
      console.log('Built-in getSession successful, user authenticated');
      // Clean the URL
      if (window.history && window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
      isProcessingHash = false;
      return data.session;
    }
    
    console.error('All auth hash processing methods failed');
    isProcessingHash = false;
    return null;
  } catch (error) {
    console.error('Error processing auth hash:', error);
    toast({
      variant: "destructive",
      title: "Authentication error",
      description: "An error occurred while processing your login. Please try again.",
    });
    isProcessingHash = false;
    return null;
  }
};
