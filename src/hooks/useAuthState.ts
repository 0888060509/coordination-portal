
import { useEffect } from "react";
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
}

export const useAuthState = ({
  setUser,
  setSession,
  setIsLoading,
  setIsAdmin
}: UseAuthStateParams) => {
  const navigate = useNavigate();

  // Check if the user is already logged in and set up auth state change listener
  useEffect(() => {
    // Create flag to track if this component is mounted
    let isMounted = true;
    const navigationAttempted = { value: false };
    
    const checkAuth = async () => {
      try {
        console.log("Initial auth check starting");
        if (isMounted) setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        if (isMounted) setSession(session);
        
        console.log("Initial session check:", session ? `Session found for ${session.user.id}` : "No session found");
        
        if (session?.user) {
          const userData = await fetchProfile(session.user.id, session);
          if (userData && isMounted) {
            console.log("Initial profile loaded successfully");
            setUser(userData);
            setIsAdmin(userData.role === 'admin');
            
            // Force navigation for already logged in users
            const currentPath = window.location.pathname;
            if ((currentPath === '/login' || currentPath === '/register' || currentPath === '/') && !navigationAttempted.value) {
              console.log("User already logged in, redirecting to dashboard");
              navigationAttempted.value = true;
              
              // React Router navigation
              navigate('/dashboard', { replace: true });
              
              // Fallback navigation with delay
              setTimeout(() => {
                if (window.location.pathname === '/login' || window.location.pathname === '/register' || window.location.pathname === '/') {
                  console.log("Still on auth page, forcing direct navigation");
                  window.location.href = '/dashboard';
                }
              }, 500);
            }
          } else if (isMounted) {
            console.warn("Initial profile fetch failed");
            setUser(null);
            setIsAdmin(false);
          }
        } else if (isMounted) {
          console.log("No initial session found");
          setUser(null);
          setIsAdmin(false);
        }
        if (isMounted) setIsLoading(false);
      } catch (error) {
        console.error("Initial auth check error:", error);
        if (isMounted) setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session ? `Session exists for ${session.user.id}` : "No session");
        if (isMounted) setSession(session);
        
        if (event === 'SIGNED_IN' && session) {
          // Store login success in localStorage
          localStorage.setItem('auth_success', 'true');
          localStorage.setItem('auth_timestamp', Date.now().toString());
        }
        
        if (session?.user) {
          if (isMounted) setIsLoading(true);
          try {
            const userData = await fetchProfile(session.user.id, session);
            if (userData && isMounted) {
              console.log("Profile loaded after auth state change");
              setUser(userData);
              setIsAdmin(userData.role === 'admin');
            } else if (isMounted) {
              console.warn("Profile fetch failed after auth state change");
              setUser(null);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error fetching profile after auth state change:", error);
            if (isMounted) {
              setUser(null);
              setIsAdmin(false);
            }
          }
          if (isMounted) setIsLoading(false);
          
          // Skip normal navigation for SIGNED_IN since it's handled directly in login
          if (event === 'SIGNED_IN' && !navigationAttempted.value) {
            console.log("Auth event SIGNED_IN, navigating to dashboard");
            navigationAttempted.value = true;
            
            // Navigation with multiple methods
            navigate('/dashboard', { replace: true });
            
            // Fallback navigation with delay
            setTimeout(() => {
              const currentPath = window.location.pathname;
              if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
                console.log("Still on auth page after SIGNED_IN event, forcing navigation");
                window.location.href = '/dashboard';
              }
            }, 500);
          }
        } else if (isMounted) {
          console.log("No user in session after auth state change");
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          
          // Handle signed out event
          if (event === 'SIGNED_OUT') {
            navigationAttempted.value = false; // Reset navigation flag
            localStorage.removeItem('auth_success');
            localStorage.removeItem('auth_timestamp');
            navigate('/login');
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
          navigate('/login');
        }
      }
    );

    // Cleanup subscription on unmount
    return () => {
      console.log("Cleaning up auth state subscription");
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [navigate, setIsAdmin, setIsLoading, setSession, setUser]);
};
