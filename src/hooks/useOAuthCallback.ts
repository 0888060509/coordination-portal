
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { processAuthHash } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { fetchProfile } from "@/utils/userTransform";
import { User } from "@/types/user";

interface UseOAuthCallbackParams {
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setIsLoading: (isLoading: boolean) => void;
  setIsAdmin: (isAdmin: boolean) => void;
}

export const useOAuthCallback = ({
  setUser,
  setSession,
  setIsLoading,
  setIsAdmin
}: UseOAuthCallbackParams) => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      if (location.hash && location.hash.includes('access_token')) {
        setIsLoading(true);
        
        try {
          console.log("Processing OAuth callback...");
          
          // Try using our custom helper to process the hash
          const session = await processAuthHash();
          
          if (session) {
            console.log("Successfully processed auth hash with custom handler");
            setSession(session);
            
            const userData = await fetchProfile(session.user.id, session);
            if (userData) {
              setUser(userData);
              setIsAdmin(userData.role === 'admin');
            }
            
            // Ensure navigation happens after profile is loaded
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 500);
            return;
          }
          
          // If that fails, try manual extraction as a fallback
          console.log("Custom handler failed, trying manual extraction");
          
          // Capture the hash before clearing it
          const currentHash = location.hash;
          
          // Clear hash from URL immediately to prevent loops
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }
          
          // Extract access token from hash
          const params = new URLSearchParams(currentHash.substring(1));
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');
          
          if (!accessToken) {
            throw new Error("No access token found in URL");
          }
          
          // Try manual session setup with the tokens from the URL
          if (accessToken) {
            try {
              console.log("Trying manual session setup with tokens");
              
              // Extract more parameters
              const expiresIn = params.get('expires_in');
              const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + parseInt(expiresIn, 10) : undefined;
              
              const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken || null,
                // Ensure correct type by casting
                ...(expiresIn ? { expires_in: parseInt(expiresIn, 10) } as any : {}),
                ...(expiresAt ? { expires_at: expiresAt } as any : {}),
                token_type: params.get('token_type') || 'bearer'
              });
              
              if (sessionError) {
                throw sessionError;
              }
              
              if (sessionData.session) {
                console.log("Manual session setup successful");
                setSession(sessionData.session);
                
                const userData = await fetchProfile(sessionData.session.user.id, sessionData.session);
                if (userData) {
                  setUser(userData);
                  setIsAdmin(userData.role === 'admin');
                }
                
                toast({
                  title: "Successfully signed in with Google",
                  description: "Welcome to MeetingMaster!",
                });
                
                // Ensure navigation after profile is loaded
                setTimeout(() => {
                  navigate('/dashboard', { replace: true });
                }, 500);
              }
            } catch (manualError) {
              console.error("Manual session setup failed:", manualError);
              throw manualError;
            }
          }
        } catch (error) {
          console.error("Error processing OAuth redirect:", error);
          toast({
            variant: "destructive",
            title: "Authentication failed",
            description: "Failed to authenticate with Google. Please try again.",
          });
          setIsLoading(false);
          navigate('/login');
        }
      }
    };
    
    handleAuthCallback();
  }, [location.hash, navigate, setIsLoading, setSession, setUser, setIsAdmin]);
};

// Missing import, needs to be added
import { supabase } from "@/integrations/supabase/client";
