
import { useState } from "react";
import { Link } from "react-router-dom";
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

const formSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setError(null);
    try {
      await forgotPassword(data.email);
      setIsEmailSent(true);
    } catch (error) {
      console.error("Password reset request failed:", error);
      setError("Failed to send reset instructions. Please try again.");
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
          {isEmailSent ? (
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Check your email
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                We've sent password reset instructions to your email address.
              </p>
              <div className="pt-4">
                <Link to="/login">
                  <Button className="w-full">Back to Login</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Forgot your password?
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  Enter your email and we'll send you instructions to reset your password.
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
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="you@example.com"
                            type="email"
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
                        Sending...
                      </>
                    ) : (
                      "Send Reset Instructions"
                    )}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Remember your password?{" "}
                  <Link
                    to="/login"
                    className="font-medium text-meeting-primary hover:underline"
                  >
                    Back to login
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
