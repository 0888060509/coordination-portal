
import React from 'react';
import { Box, Flex, Heading, Spacer, Button } from '@/components/ui/button';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  children?: React.ReactNode;
}

const PageHeader = ({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon,
  children,
}: PageHeaderProps) => {
  return (
    <Box
      as="header"
      py={4}
      px={6}
      className="bg-background border-b border-border"
    >
      <Flex className="items-center">
        <Box>
          <Heading as="h1" className="text-2xl font-bold">
            {title}
          </Heading>
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
