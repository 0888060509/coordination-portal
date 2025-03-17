
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to console for debugging
    console.error("MeetingMaster Error Caught by Boundary:", error);
    console.error("Component Stack:", errorInfo.componentStack);
    
    // Update state to include error info
    this.setState({ errorInfo });
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    // Clear any potential auth state that might be causing loops
    localStorage.removeItem('auth_success');
    localStorage.removeItem('auth_timestamp');
    
    // Redirect to login page instead of dashboard to break potential loops
    window.location.href = '/login';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">App Error Detected</h1>
              <p className="text-gray-600 text-center mb-4">
                MeetingMaster encountered an error that prevented it from loading correctly.
              </p>
              <div className="flex space-x-4">
                <Button 
                  onClick={this.resetErrorBoundary}
                  variant="default"
                >
                  Reset & Logout
                </Button>
                <Button 
                  onClick={() => window.location.reload()}
                  variant="outline"
                >
                  Reload Page
                </Button>
              </div>
              
              {this.state.error && (
                <div className="mt-6 p-4 bg-gray-100 rounded-md w-full overflow-auto">
                  <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              
              {this.state.errorInfo && (
                <div className="mt-2 p-4 bg-gray-100 rounded-md w-full overflow-auto max-h-60">
                  <details>
                    <summary className="text-sm font-medium cursor-pointer mb-2">
                      Component Stack
                    </summary>
                    <p className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </p>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Normally, just render children
    return this.props.children;
  }
}

export default ErrorBoundary;
