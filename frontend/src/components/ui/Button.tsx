import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '../../utils/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  "inline-flex justify-center items-center disabled:opacity-50 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ring-offset-background focus-visible:ring-offset-2 font-medium text-sm whitespace-nowrap transition-colors disabled:pointer-events-none",
  {
    variants: {
      variant: {

        default: "bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)] shadow-sm border border-transparent",
        destructive: "bg-[var(--color-danger)] text-white hover:bg-red-600",
        outline: "border border-[var(--border-strong)] bg-transparent hover:bg-[var(--bg-card-hover)] text-[var(--neutral-200)]",
        secondary: "bg-[var(--neutral-800)] text-[var(--neutral-200)] hover:bg-[var(--neutral-700)]",
        ghost: "hover:bg-[var(--bg-card-hover)] text-[var(--neutral-400)] hover:text-[var(--neutral-50)]",
        link: "text-[var(--primary-400)] underline-offset-4 hover:underline",
        glass: "bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 text-white shadow-sm",
        neon: "bg-transparent border border-[var(--primary-500)] text-[var(--primary-400)] hover:bg-[var(--primary-500)] hover:text-white"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        xs: "h-7 px-2 text-xs"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onAnimationStart' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'ref'>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, isLoading, leftIcon, rightIcon, children, ...props }, ref) => {
    // Determine animation props based on disabled/loading state
    const isInteractive = !isLoading && !props.disabled;

    return (
      <motion.button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isLoading || props.disabled}
        whileHover={isInteractive ? { scale: 1.02 } : undefined}
        whileTap={isInteractive ? { scale: 0.96 } : undefined}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        {...(props as any)}
      >
        {!!isLoading && <Loader2 className="mr-2 w-4 h-4 animate-spin" />}
        {!isLoading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!isLoading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </motion.button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
