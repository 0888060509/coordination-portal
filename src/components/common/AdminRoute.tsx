
import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import LoadingSpinner from "@/components/ui/loading-spinner";
import { toast } from "@/hooks/use-toast";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, user, isLoading, isAdmin, authInitialized } = useAuth();
  const location = useLocation();
  
  useEffect(() => {
    if (authInitialized && isAuthenticated && !isAdmin && !isLoading) {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "You don't have permission to access this area",
      });
    }
  }, [authInitialized, isAuthenticated, isAdmin, isLoading]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <LoadingSpinner 
          size="lg" 
          color="primary" 
          showText={true} 
          text="Loading your account..." 
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default AdminRoute;
