
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { 
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render shows the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // You can log the error to an error reporting service
    console.error("MeetingMaster Error:", error, errorInfo);
  }

  resetErrorBoundary = (): void => {
    this.setState({ hasError: false, error: null });
    // Attempt to reload the application
    window.location.href = '/dashboard';
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
          <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg">
            <div className="flex flex-col items-center">
              <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops, something went wrong</h1>
              <p className="text-gray-600 text-center mb-4">
                MeetingMaster encountered an error. Please try refreshing the page.
              </p>
              <div className="flex space-x-4">
                <Button 
                  onClick={this.resetErrorBoundary}
                  variant="default"
                >
                  Reload Application
                </Button>
                <Button 
                  onClick={() => window.location.href = '/login'}
                  variant="outline"
                >
                  Go to Login
                </Button>
              </div>
              {this.state.error && (
                <div className="mt-6 p-4 bg-gray-100 rounded-md w-full overflow-auto">
                  <p className="text-sm font-mono text-gray-700 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
