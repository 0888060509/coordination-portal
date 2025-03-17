
import React from 'react';
import { Box, Flex, Heading, Spacer } from '@/components/ui/box';
import { Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  description?: string;  // Added description prop
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const PageHeader = ({
  title,
  description,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  children,
}: PageHeaderProps) => {
  return (
    <Box
      as="header"
      className="py-4 px-6 bg-background border-b border-border"
    >
      <Flex className="items-center">
        <Box>
          <Heading as="h1" className="text-2xl font-bold">
            {title}
          </Heading>
          {description && (
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
          {subtitle && (
            <Heading as="h2" className="text-sm text-muted-foreground mt-1">
              {subtitle}
            </Heading>
          )}
        </Box>
        <Spacer />
        {children}
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="ml-4"
          >
            {actionIcon && <span className="mr-2">{actionIcon}</span>}
            {actionLabel}
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default PageHeader;
