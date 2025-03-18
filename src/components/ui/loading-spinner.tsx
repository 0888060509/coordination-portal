
import React from "react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  color?: "primary" | "secondary" | "default";
  showText?: boolean;
  text?: string;
  withOverlay?: boolean;
}

const LoadingSpinner = ({
  size = "md",
  color = "primary",
  showText = false,
  text = "Loading...",
  withOverlay = false,
  className,
  ...props
}: LoadingSpinnerProps) => {
  // Map size to actual dimensions
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  // Map color to Tailwind classes
  const colorClasses = {
    primary: "border-t-meeting-primary",
    secondary: "border-t-meeting-secondary",
    default: "border-t-gray-600",
  };

  // Conditionally wrap with overlay
  const Wrapper = withOverlay
    ? ({ children }: { children: React.ReactNode }) => (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50">
          {children}
        </div>
      )
    : ({ children }: { children: React.ReactNode }) => <>{children}</>;

  return (
    <Wrapper>
      <div
        className={cn(
          "flex flex-col items-center justify-center",
          className
        )}
        {...props}
      >
        <div
          className={cn(
            "rounded-full border-t-transparent animate-spin",
            sizeClasses[size],
            colorClasses[color],
            "border-solid"
          )}
        />
        {showText && (
          <span className="mt-2 text-sm font-medium">{text}</span>
        )}
      </div>
    </Wrapper>
  );
};

export default LoadingSpinner;

// Also export a component for content loading
export const LoadingContent = ({
  className,
  timeout = 30000, // Increased default timeout to 30 seconds
  onRetry,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { 
  timeout?: number,
  onRetry?: () => void 
}) => {
  const [showError, setShowError] = React.useState(false);
  const [loadingTime, setLoadingTime] = React.useState(0);

  React.useEffect(() => {
    const startTime = Date.now();
    const timer = setTimeout(() => setShowError(true), timeout);
    
    // Update loading time every second
    const intervalTimer = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => {
      clearTimeout(timer);
      clearInterval(intervalTimer);
    };
  }, [timeout]);

  if (showError) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-4">
        <div className="text-red-600 mb-2">
          Loading took too long. Please try refreshing the page.
        </div>
        {onRetry ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 flex items-center gap-2"
            onClick={onRetry}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 flex items-center gap-2"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4" />
            Refresh Page
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full flex flex-col items-center justify-center p-8 space-y-4",
        className
      )}
      {...props}
    >
      <LoadingSpinner size="md" showText />
      {loadingTime > 10 && (
        <div className="text-sm text-muted-foreground">
          Still loading... ({loadingTime}s)
        </div>
      )}
    </div>
  );
};

// Loading skeleton for UI that's still loading
export const LoadingSkeleton = ({
  rows = 3,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { rows?: number }) => (
  <div
    className={cn("w-full space-y-2", className)}
    {...props}
  >
    {Array(rows)
      .fill(0)
      .map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 w-full ${i === 0 ? "w-full" : i === rows - 1 ? "w-2/3" : "w-5/6"}`}
        />
      ))}
  </div>
);
