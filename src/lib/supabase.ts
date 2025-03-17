
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/supabase';

const supabaseUrl = "https://wdooqruganwbzukglerv.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indkb29xcnVnYW53Ynp1a2dsZXJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDIwMTU5NjYsImV4cCI6MjA1NzU5MTk2Nn0.fwYbP60XTUPyjijVYSegx7YAMWFw_Nx3iR3VPZqwbe4";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
