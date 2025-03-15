import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/context/AuthContext";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { processAuthHash, supabase } from "@/integrations/supabase/client";

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type FormValues = z.infer<typeof formSchema>;

const LoginPage = () => {
  const { login, loginWithGoogle, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [processingOAuth, setProcessingOAuth] = useState(false);
  const [initialAuthCheck, setInitialAuthCheck] = useState(true);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [forcingNavigation, setForcingNavigation] = useState(false);

  // Get the page they were trying to access
  const from = location.state?.from?.pathname || "/dashboard";

  // Reset submission state when unmounting
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
    return () => {
      setIsSubmitting(false);
    };
  }, [isAuthenticated, navigate]);

  // Add a short delay for initial auth check to prevent flashing
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialAuthCheck(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Add timeout to detect stalled login attempts with automatic retry
  useEffect(() => {
    let loginTimeout: NodeJS.Timeout;
    let navigationTimeout: NodeJS.Timeout;

    if (isSubmitting && !authLoading) {
      console.log("Login attempt in progress, setting timeout");

      loginTimeout = setTimeout(() => {
        console.log("Login attempt timed out after 10s");
        // Instead of giving up, try to check the session status
        const checkSessionStatus = async () => {
          try {
            console.log("Checking session status after timeout");
            const { data } = await supabase.auth.getSession();
            if (data.session) {
              console.log("Session exists despite timeout, navigating to dashboard");
              toast({
                title: "Login successful",
                description: "You are now logged in.",
              });
              navigate('/dashboard', { replace: true });
              setIsSubmitting(false); //Added to clear loading state
              return;
            }

            // If no session, show the timeout message
            setIsSubmitting(false);
            setAuthError("Login attempt timed out. Please try again.");
            toast({
              variant: "destructive",
              title: "Login timeout",
              description: "Your login request took too long. Please try again.",
            });
          } catch (error) {
            console.error("Error checking session after timeout:", error);
            setIsSubmitting(false);
            setAuthError("Login attempt timed out. Please try again.");
          }
        };

        checkSessionStatus();
      }, 10000);
    }

    // If authenticated but not navigating, force navigate after a delay
    if (isAuthenticated && !initialAuthCheck && !forcingNavigation) {
      setForcingNavigation(true);
      console.log("User is authenticated, forcing navigation to dashboard");

      navigationTimeout = setTimeout(() => {
        console.log("Executing forced navigation to dashboard");
        navigate(from, { replace: true });
      }, 1500);
    }

    return () => {
      if (loginTimeout) clearTimeout(loginTimeout);
      if (navigationTimeout) clearTimeout(navigationTimeout);
    };
  }, [isSubmitting, authLoading, isAuthenticated, initialAuthCheck, navigate, from, forcingNavigation]);

  // Check for authentication hash on mount with enhanced error handling
  useEffect(() => {
    if (location.hash && location.hash.includes('access_token')) {
      const processAuth = async () => {
        try {
          setProcessingOAuth(true);
          setAuthError(null);

          console.log("Login page: Processing OAuth hash");
          // First clear the hash to prevent repeated processing
          const currentHash = location.hash;
          if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
          }

          const session = await processAuthHash();

          if (session) {
            console.log("Login page: OAuth processing successful");
            toast({
              title: "Successfully signed in",
              description: "Welcome to MeetingMaster!",
            });

            // Small delay before navigation to ensure state is updated
            setTimeout(() => {
              console.log("Navigating to dashboard after OAuth processing");
              navigate('/dashboard', { replace: true });
            }, 1000);
          } else {
            console.error("Failed to process OAuth hash");

            // Try manual extraction as fallback
            try {
              console.log("Attempting manual extraction of tokens from hash");
              const params = new URLSearchParams(currentHash.substring(1));
              const accessToken = params.get('access_token');
              const refreshToken = params.get('refresh_token');

              if (accessToken) {
                console.log("Found access token, attempting manual session setup");
                const expiresIn = params.get('expires_in');
                const expiresAt = expiresIn ? Math.floor(Date.now() / 1000) + parseInt(expiresIn, 10) : undefined;

                const { data, error } = await supabase.auth.setSession({
                  access_token: accessToken,
                  refresh_token: refreshToken || null,
                  ...(expiresIn ? { expires_in: parseInt(expiresIn, 10) } as any : {}),
                  ...(expiresAt ? { expires_at: expiresAt } as any : {}),
                  token_type: params.get('token_type') || 'bearer'
                });

                if (error) {
                  throw error;
                }

                if (data.session) {
                  console.log("Manual session setup successful");
                  toast({
                    title: "Authentication successful",
                    description: "You are now logged in.",
                  });

                  setTimeout(() => {
                    navigate('/dashboard', { replace: true });
                  }, 1000);
                  return;
                }
              }
            } catch (manualError) {
              console.error("Manual token extraction failed:", manualError);
            }

            setProcessingOAuth(false);
            setAuthError("Failed to complete authentication. Please try again.");
          }
        } catch (error) {
          console.error("Error processing OAuth in LoginPage:", error);
          setAuthError("Failed to complete authentication. Please try again.");
          setProcessingOAuth(false);
        }
      };

      processAuth();
    }
  }, [location.hash, navigate]);

  // If user is already authenticated, redirect to dashboard
  // Add a delay to prevent immediate redirect which can cause flickering
  useEffect(() => {
    let redirectTimer: NodeJS.Timeout;

    if (isAuthenticated && !authLoading && !processingOAuth && !initialAuthCheck && !forcingNavigation) {
      console.log("User is authenticated, scheduling navigation");
      setForcingNavigation(true);

      redirectTimer = setTimeout(() => {
        console.log("Executing navigation to", from);
        navigate(from, { replace: true });
      }, 1000);
    }

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
  }, [isAuthenticated, authLoading, processingOAuth, navigate, from, initialAuthCheck, forcingNavigation]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    if (isSubmitting) return;
    
    console.log("Submitting login form with data:", { ...data, attemptCount: loginAttempts });
    setIsSubmitting(true);
    setAuthError(null);
    
    try {
      console.log("Attempting login for email:", data.email);
      await login(data.email, data.password);
      
      // Check if we're authenticated after login
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("Session confirmed, navigating to dashboard");
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        navigate('/dashboard', { replace: true });
      }
    } catch (error) {
      console.error("Login failed:", error);
      setAuthError(typeof error === 'string' ? error : 
        error instanceof Error ? error.message : 
        "Invalid email or password. Please try again.");
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (isSubmitting || processingOAuth) return; // Prevent actions when already processing

    setAuthError(null);
    try {
      await loginWithGoogle();
      // Auth state change will handle navigation
    } catch (error) {
      console.error("Google login failed:", error);
      setAuthError("Google login failed. Please try again.");
    }
  };

  // Force reset the submission state if it's been submitting for too long
  const handleResetSubmission = () => {
    setIsSubmitting(false);
    setAuthError("Login attempt was reset. Please try again.");
  };

  // Only show loading during initial page load or when explicitly processing OAuth
  const showLoadingState = (authLoading && initialAuthCheck) || processingOAuth;

  if (showLoadingState) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-meeting-primary" />
          <h2 className="mt-4 text-xl font-semibold">
            {processingOAuth ? "Completing authentication..." : "Loading..."}
          </h2>
          <p className="mt-2 text-gray-500">Please wait while we sign you in.</p>
          <Button 
            variant="link" 
            className="mt-4 text-sm text-gray-500" 
            onClick={() => window.location.href = '/login'}
          >
            Taking too long? Click here to restart
          </Button>
        </div>
      </div>
    );
  }

  // Regular login form view
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="hidden lg:flex lg:w-1/2 bg-meeting-primary bg-opacity-90 p-12 text-white">
        <div className="flex flex-col justify-center">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
              <span className="text-meeting-primary font-bold text-lg">MM</span>
            </div>
            <h1 className="text-2xl font-bold">MeetingMaster</h1>
          </div>
          <h2 className="text-3xl font-bold mb-4">Welcome Back!</h2>
          <p className="text-xl mb-6">
            Log in to manage your meeting rooms and bookings with ease.
          </p>
          <div className="bg-white bg-opacity-10 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-3">
              Streamline Your Meeting Management
            </h3>
            <ul className="space-y-2">
              <li className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-white text-meeting-primary flex items-center justify-center mr-3">
                  ✓
                </div>
                <span>Manage and book meeting rooms instantly</span>
              </li>
              <li className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-white text-meeting-primary flex items-center justify-center mr-3">
                  ✓
                </div>
                <span>View room availability in real-time</span>
              </li>
              <li className="flex items-center">
                <div className="h-6 w-6 rounded-full bg-white text-meeting-primary flex items-center justify-center mr-3">
                  ✓
                </div>
                <span>Receive booking confirmations automatically</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex justify-center items-center p-6">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:hidden">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <div className="h-10 w-10 rounded-full bg-meeting-primary flex items-center justify-center">
                <span className="text-white font-bold text-lg">MM</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                MeetingMaster
              </h1>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Sign in to your account
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Enter your credentials to access your account
              </p>
            </div>

            {authError && (
              <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
                {authError}
              </div>
            )}

            {isSubmitting && loginAttempts > 1 && (
              <div className="mb-6 p-3 bg-yellow-100 text-yellow-700 rounded-md flex flex-col">
                <span>Sign-in is taking longer than expected...</span>
                <Button 
                  variant="link" 
                  className="self-end text-sm text-yellow-700 underline" 
                  onClick={handleResetSubmission}
                >
                  Cancel and try again
                </Button>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="you@example.com"
                          type="email"
                          {...field}
                          disabled={isSubmitting}
                          autoComplete="email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="********"
                          type="password"
                          {...field}
                          disabled={isSubmitting}
                          autoComplete="current-password"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-between">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-meeting-primary hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-meeting-primary hover:bg-blue-600"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">
                    Or continue with
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleGoogleLogin}
                  disabled={isSubmitting || processingOAuth}
                >
                  <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
                      <path
                        fill="#4285F4"
                        d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z"
                      />
                      <path
                        fill="#34A853"
                        d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z"
                      />
                      <path
                        fill="#EA4335"
                        d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z"
                      />
                    </g>
                  </svg>
                  Sign in with Google
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-medium text-meeting-primary hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;