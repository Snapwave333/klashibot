import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--primary-500)] text-white hover:bg-[var(--primary-600)]",
        secondary: "border-transparent bg-[var(--neutral-800)] text-[var(--neutral-200)] hover:bg-[var(--neutral-700)]",
        destructive: "border-transparent bg-[var(--color-danger)] text-white hover:bg-red-600",
        outline: "text-[var(--neutral-200)] border-[var(--border-strong)]",
        neon: "border-[var(--primary-500)] text-[var(--primary-500)] bg-[var(--primary-500)]/10 shadow-[0_0_10px_rgba(6,182,212,0.2)]",
        success: "border-transparent bg-[var(--color-success)]/20 text-[var(--color-success)]",
        warning: "border-transparent bg-[var(--color-warning)]/20 text-[var(--color-warning)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
