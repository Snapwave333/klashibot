import React from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-xs font-medium uppercase tracking-wider text-[var(--neutral-500)] ml-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--neutral-500)] group-focus-within:text-[var(--primary-500)] transition-colors">
              {leftIcon}
            </div>
          )}
          
          <input
            type={type}
            className={cn(
              "flex h-10 w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-card)] px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-[var(--neutral-600)] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--primary-500)] focus-visible:border-[var(--primary-500)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200 text-[var(--neutral-100)]",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]",
              className
            )}
            ref={ref}
            {...props}
          />
          
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--neutral-500)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-xs text-[var(--color-danger)] ml-1 animate-in slide-in-from-top-1">
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
