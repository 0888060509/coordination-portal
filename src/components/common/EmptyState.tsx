
import React from 'react';
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactElement;
}

const EmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
  icon,
}: EmptyStateProps) => {
  return (
    <Box className="p-8 rounded-md bg-muted/30 border border-border text-center w-full">
      <div className="flex flex-col items-center space-y-4">
        <div className="rounded-full bg-primary/10 p-3">
          {icon || <Info className="h-8 w-8 text-primary" />}
        </div>
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} className="mt-2">
            {actionLabel}
          </Button>
        )}
      </div>
    </Box>
  );
};

export default EmptyState;
