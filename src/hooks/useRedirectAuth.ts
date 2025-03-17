
import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { checkAuthAndRedirect, setupAuthChangeNavigation, navigateToDashboard, navigateToLogin, navigateTo } from '@/services/navigationService';

/**
 * A simplified hook that handles authentication redirects
 * using the centralized navigation service
 */
export function useRedirectAuth() {
  const location = useLocation();
  const isMountedRef = useRef(true);
  const initialCheckDoneRef = useRef(false);
  
  // Set up isMounted ref for cleanup
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // Set up authentication check
  useEffect(() => {
    // Skip if initial check already done
    if (initialCheckDoneRef.current) {
      return;
    }
    
    console.log("🔐 useRedirectAuth: Initial auth check");
    
    // Do initial auth check
    const doInitialCheck = async () => {
      if (!isMountedRef.current) return;
      
      try {
        await checkAuthAndRedirect();
        initialCheckDoneRef.current = true;
      } catch (error) {
        console.error("Error in initial auth check:", error);
      }
    };
    
    // Perform initial check
    doInitialCheck();
    
    // Set up auth change listener
    const unsubscribe = setupAuthChangeNavigation();
    
    // Cleanup
    return () => {
      unsubscribe();
    };
  }, [location.pathname]);
  
  // Return navigation helpers for backwards compatibility
  return {
    forceToDashboard: () => {
      navigateToDashboard({ source: 'useRedirectAuth.forceToDashboard' });
    },
    forceToLogin: () => {
      navigateToLogin({ source: 'useRedirectAuth.forceToLogin' });
    },
    navigateTo: (path: string) => {
      navigateTo(path, { source: 'useRedirectAuth.navigateTo' });
    }
  };
}
