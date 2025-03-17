
import React from 'react';
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

const ErrorDisplay = ({
  title = 'Something went wrong',
  message,
  onRetry,
}: ErrorDisplayProps) => {
  return (
    <Box className="p-6 rounded-md bg-destructive/10 border border-destructive/30 w-full">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="h-6 w-6 text-destructive" />
          <h3 className="text-lg font-medium text-destructive">{title}</h3>
        </div>
        <p className="text-foreground">{message}</p>
        {onRetry && (
          <Button variant="outline" onClick={onRetry} className="mt-2 w-fit">
            Try Again
          </Button>
        )}
      </div>
    </Box>
  );
};

export default ErrorDisplay;
