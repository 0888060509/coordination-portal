
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type FormValues = z.infer<typeof formSchema>;

const UpdatePasswordPage = () => {
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Extract the reset token from URL
  useEffect(() => {
    // Check if we have the reset token in the URL
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const type = params.get('type');
    
    if (type !== 'recovery') {
      toast.toast({
        variant: "destructive",
        title: "Invalid or expired link",
        description: "Please request a new password reset link.",
      });
      navigate('/forgot-password');
    }
  }, [navigate, toast]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Get the access token from the URL
      const hash = window.location.hash.substring(1);
      const params = new URLSearchParams(hash);
      const accessToken = params.get('access_token');
      
      if (!accessToken) {
        throw new Error("No access token found");
      }
      
      await resetPassword(accessToken, data.password);
      
      toast.toast({
        title: "Password updated successfully",
        description: "You can now log in with your new password.",
      });
      
      navigate('/login');
    } catch (error) {
      console.error("Password reset failed:", error);
      setError("Failed to reset password. Please try again or request a new link.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
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
              Reset Your Password
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Please enter a new password for your account.
            </p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="********"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="********"
                        type="password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full bg-meeting-primary hover:bg-blue-600"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default UpdatePasswordPage;
