
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { User } from "@/types/user";
import { fetchProfile } from "@/utils/userTransform";

interface UseAuthStateParams {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
  setAuthInitialized?: (initialized: boolean) => void;
}

export const useAuthState = ({
  setUser,
  setSession,
  setIsLoading,
  setIsAdmin,
  setAuthInitialized
}: UseAuthStateParams) => {
  const navigate = useNavigate();
  const profileFetchInProgress = useRef<boolean>(false);
  const initialAuthCheckComplete = useRef<boolean>(false);
  const navigationAttempted = useRef<boolean>(false);
  const isMounted = useRef<boolean>(true);

  // Check if the user is already logged in and set up auth state change listener
  useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    
    const checkAuth = async () => {
      try {
        if (!isMounted.current) return;
        if (initialAuthCheckComplete.current) {
          console.log("Initial auth check already completed, skipping duplicate");
          return;
        }
        
        console.log("Initial auth check starting");
        profileFetchInProgress.current = true;
        if (isMounted.current) setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted.current) setSession(session);
        
        console.log("Initial session check:", session ? `Session found for ${session.user.id}` : "No session found");
        
        if (session?.user) {
          try {
            const userData = await fetchProfile(session.user.id, session);
            
            if (userData && isMounted.current) {
              console.log("Initial profile loaded successfully");
              setUser(userData);
              setIsAdmin(userData.role === 'admin');
              
              // Store login success in localStorage
              localStorage.setItem('auth_success', 'true');
              localStorage.setItem('auth_timestamp', Date.now().toString());
              
              // Force navigation for already logged in users
              const currentPath = window.location.pathname;
              if ((currentPath === '/login' || currentPath === '/register' || currentPath === '/') && !navigationAttempted.current) {
                console.log("User already logged in, redirecting to dashboard");
                navigationAttempted.current = true;
                navigate('/dashboard', { replace: true });
              }
            } else if (isMounted.current) {
              console.warn("Initial profile fetch failed");
              setUser(null);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Failed to fetch profile:", error);
            if (isMounted.current) {
              setUser(null);
              setIsAdmin(false);
            }
          }
        } else if (isMounted.current) {
          console.log("No initial session found");
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error("Initial auth check error:", error);
        if (isMounted.current) {
          setUser(null);
          setIsAdmin(false);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
          if (setAuthInitialized) setAuthInitialized(true);
          profileFetchInProgress.current = false;
          initialAuthCheckComplete.current = true;
        }
      }
    };

    // Initial check
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session ? `Session exists for ${session.user.id}` : "No session");
        if (!isMounted.current) return;
        
        if (isMounted.current) setSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          // Store login success in localStorage
          localStorage.setItem('auth_success', 'true');
          localStorage.setItem('auth_timestamp', Date.now().toString());
        }
        
        if (session?.user) {
          if (isMounted.current) setIsLoading(true);
          
          // Prevent duplicate fetches
          if (profileFetchInProgress.current) {
            console.log("Profile fetch already in progress, skipping duplicate");
            return;
          }
          
          profileFetchInProgress.current = true;
          
          try {
            const userData = await fetchProfile(session.user.id, session);
            if (userData && isMounted.current) {
              console.log("Profile loaded after auth state change");
              setUser(userData);
              setIsAdmin(userData.role === 'admin');
            } else if (isMounted.current) {
              console.warn("Profile fetch failed after auth state change");
              setUser(null);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error fetching profile after auth state change:", error);
            if (isMounted.current) {
              setUser(null);
              setIsAdmin(false);
            }
          } finally {
            if (isMounted.current) {
              setIsLoading(false);
              if (setAuthInitialized) setAuthInitialized(true);
              profileFetchInProgress.current = false;
            }
          }
          
          // Skip normal navigation for SIGNED_IN since it's handled directly in login
          if (event === 'SIGNED_IN' && !navigationAttempted.current) {
            console.log("Auth event SIGNED_IN, navigating to dashboard");
            navigationAttempted.current = true;
            navigate('/dashboard', { replace: true });
          }
        } else if (isMounted.current) {
          console.log("No user in session after auth state change");
          setUser(null);
          setIsAdmin(false);
          profileFetchInProgress.current = false;
          
          if (event !== 'INITIAL_SESSION') {
            setIsLoading(false);
            if (setAuthInitialized) setAuthInitialized(true);
          }
          
          // Handle signed out event
          if (event === 'SIGNED_OUT') {
            navigationAttempted.current = false; // Reset navigation flag
            localStorage.removeItem('auth_success');
            localStorage.removeItem('auth_timestamp');
            navigate('/login', { replace: true });
          }
        }
        
        // Handle specific auth events with improved navigation
        if (event === 'SIGNED_IN') {
          toast({
            title: "Successfully signed in",
            description: "Welcome to MeetingMaster!",
          });
        }
        
        if (event === 'SIGNED_OUT') {
          toast({
            title: "Successfully signed out",
            description: "You have been logged out successfully",
          });
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up auth state subscription");
      isMounted.current = false;
      subscription.unsubscribe();
    };
  }, [navigate, setIsAdmin, setIsLoading, setSession, setUser, setAuthInitialized]);
};
