import React from 'react';
import { cn } from '../utils/cn';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded bg-slate-700/50', className)} />;
}

export function StatCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <Skeleton className="h-4 w-20 mb-2" />
      <Skeleton className="h-8 w-32" />
    </div>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <Skeleton className="h-3 w-24 mb-2" />
      <Skeleton className="h-6 w-16" />
    </div>
  );
}
