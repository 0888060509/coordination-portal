
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
        setIsLoading(true);
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        
        if (session?.user) {
          const userData = await fetchProfile(session.user.id, session);
          if (userData) {
            setUser(userData);
            setIsAdmin(userData.role === 'admin');
          } else {
            setUser(null);
            setIsAdmin(false);
          }
        } else {
          setUser(null);
          setIsAdmin(false);
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Auth check error:", error);
        setIsLoading(false);
      }
    };

    // Initial check
    checkAuth();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session ? "Session exists" : "No session");
        setSession(session);
        
        if (session?.user) {
          setIsLoading(true);
          const userData = await fetchProfile(session.user.id, session);
          if (userData) {
            setUser(userData);
            setIsAdmin(userData.role === 'admin');
          } else {
            setUser(null);
            setIsAdmin(false);
          }
          setIsLoading(false);
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsLoading(false);
        }
        
        // Handle specific auth events with improved navigation
        if (event === 'SIGNED_IN') {
          toast({
            title: "Successfully signed in",
            description: "Welcome to MeetingMaster!",
          });
          
          // Force navigation with delay to ensure state is updated
          setTimeout(() => {
            const currentPath = window.location.pathname;
            if (currentPath === '/login' || currentPath === '/register' || currentPath === '/') {
              console.log("Signed in, navigating to dashboard");
              navigate('/dashboard', { replace: true });
            }
          }, 500);
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
      subscription.unsubscribe();
    };
  }, [navigate, setIsAdmin, setIsLoading, setSession, setUser]);
};
