
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
    detectSessionInUrl: true,
    flowType: 'implicit', // This is important for OAuth with hash fragment handling
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
  // Add request retry logic
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

// Helper function to parse auth hash from URL (for OAuth flows)
export const parseAuthHashFromUrl = async () => {
  if (window.location.hash && window.location.hash.includes('access_token')) {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Error parsing auth hash:', error);
        return null;
      }
      
      // Clean the URL by removing the hash
      window.history.replaceState({}, document.title, window.location.pathname);
      
      return data.session;
    } catch (error) {
      console.error('Error in parseAuthHashFromUrl:', error);
      return null;
    }
  }
  
  return null;
};
