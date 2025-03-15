// This file contains the Supabase client configuration.
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const SUPABASE_URL = "https://wdooqruganwbzukglerv.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkb29xcnVnYW53Ynp1a2dsZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTU5NjYsImV4cCI6MjA1NzU5MTk2Nn0.fwYbP60XTUPyjijVYSegx7YAMWFw_Nx3iR3VPZqwbe4";

// Import the supabase client like this:
// import { supabase, handleSupabaseError } from "@/integrations/supabase/client";

// Configure with retries and improved error handling
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // This is critical for OAuth hash fragment handling
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

// Enhanced function to manually parse auth hash from URL (for OAuth flows)
export const parseAuthHashFromUrl = async () => {
  console.log('Checking for auth hash in URL');
  
  if (window.location.hash && window.location.hash.includes('access_token')) {
    try {
      console.log('Found access_token in URL, processing manually...');
      
      // Extract tokens from the hash
      const params = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      const expiresIn = params.get('expires_in');
      const providerToken = params.get('provider_token');
      
      console.log('Extracted tokens:', { 
        accessToken: accessToken ? 'present' : 'missing', 
        refreshToken: refreshToken ? 'present' : 'missing',
        providerToken: providerToken ? 'present' : 'missing'
      });
      
      if (!accessToken) {
        console.error('Missing access_token in the URL hash');
        return null;
      }
      
      // Try to set the session manually
      console.log('Attempting to set session with extracted tokens');
      const { data, error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken || ''
      });
      
      if (error) {
        console.error('Error setting session from hash:', error);
        return null;
      }
      
      console.log('Session successfully set from hash');
      
      // Clean the URL by removing the hash
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return data.session;
    } catch (error) {
      console.error('Error in parseAuthHashFromUrl:', error);
      return null;
    }
  }
  
  console.log('No auth hash found in URL');
  return null;
};

// Improved function to process auth hash with additional logging and fallbacks
export const processAuthHash = async () => {
  console.log('processAuthHash called, location hash:', window.location.hash?.substring(0, 20) + '...');
  
  if (!window.location.hash || !window.location.hash.includes('access_token')) {
    console.log('No access_token in hash, skipping processAuthHash');
    return null;
  }
  
  try {
    // First try the built-in Supabase method
    console.log('Trying built-in Supabase getSession method first');
    const { data, error } = await supabase.auth.getSession();
    
    if (!error && data.session) {
      console.log('Built-in getSession successful, user authenticated');
      // Clean the URL
      window.history.replaceState({}, document.title, window.location.pathname);
      return data.session;
    }
    
    console.log('Built-in getSession failed or no session found, trying manual parsing');
    
    // If that fails, try manual parsing
    const session = await parseAuthHashFromUrl();
    if (session) {
      console.log('Manual session parsing successful');
      return session;
    }
    
    console.error('All auth hash processing methods failed');
    return null;
  } catch (error) {
    console.error('Error processing auth hash:', error);
    return null;
  }
};
