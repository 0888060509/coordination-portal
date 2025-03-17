
import * as React from "react"
import { cn } from "@/lib/utils"

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: React.ElementType
}

const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, as: Component = "div", ...props }, ref) => {
    return (
      <Component
        className={cn(className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Box.displayName = "Box"

const Flex = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cn("flex", className)}
        {...props}
      />
    )
  }
)
Flex.displayName = "Flex"

const Spacer = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ className, ...props }, ref) => {
    return (
      <Box
        ref={ref}
        className={cn("flex-1", className)}
        {...props}
      />
    )
  }
)
Spacer.displayName = "Spacer"

interface HeadingProps extends BoxProps {
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
}

const Heading = React.forwardRef<HTMLHeadingElement, HeadingProps>(
  ({ className, as: Component = "h2", ...props }, ref) => {
    return (
      <Component
        className={cn("font-heading", className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Heading.displayName = "Heading"

export { Box, Flex, Spacer, Heading }
