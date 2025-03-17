
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
    const checkAuth = async () => {
      try {
        console.log("Initial auth check starting");
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        console.log("Initial session check:", session ? `Session found for ${session.user.id}` : "No session found");
        
        if (session?.user) {
          const userData = await fetchProfile(session.user.id, session);
          if (userData) {
            console.log("Initial profile loaded successfully");
            setUser(userData);
            setIsAdmin(userData.role === 'admin');
            
            // Force navigation for already logged in users
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
              console.log("User already logged in, redirecting to dashboard");
              setTimeout(() => {
                navigate('/dashboard', { replace: true });
              }, 100);
            }
          } else {
            console.warn("Initial profile fetch failed");
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          console.log("No initial session found");
          setUser(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Initial auth check error:", error);
        setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session ? `Session exists for ${session.user.id}` : "No session");
        setSession(session);
        
        if (session?.user) {
          setIsLoading(true);
          try {
            const userData = await fetchProfile(session.user.id, session);
            if (userData) {
              console.log("Profile loaded after auth state change");
              setUser(userData);
              setIsAdmin(userData.role === 'admin');
            } else {
              console.warn("Profile fetch failed after auth state change");
              setUser(null);
              setIsAdmin(false);
            }
          } catch (error) {
            console.error("Error fetching profile after auth state change:", error);
            setUser(null);
            setIsAdmin(false);
          }
          setIsLoading(false);
          
          // Explicitly navigate to dashboard for SIGNED_IN events
          if (event === 'SIGNED_IN') {
            console.log("Auth event SIGNED_IN, navigating to dashboard");
            // Short delay to ensure state is updated before navigation
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 100);
            
            // Extra fallback navigation for edge cases
            setTimeout(() => {
              const currentPath = window.location.pathname;
              if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
                console.log("Still on auth page after SIGNED_IN event, forcing navigation");
                navigate('/dashboard', { replace: true });
              }
            }, 1000);
          }
        } else {
          console.log("No user in session after auth state change");
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
          
          // Handle signed out event
          if (event === 'SIGNED_OUT') {
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
      subscription.unsubscribe();
    };
  }, [navigate, setIsAdmin, setIsLoading, setSession, setUser]);
};
