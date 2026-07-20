import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'dark' | 'light' | 'outline' | 'emerald' | 'amber';
}

export function Badge({ className, variant = 'dark', children, ...props }: BadgeProps) {
  const variants = {
    dark: 'bg-zinc-900 text-white border-transparent',
    light: 'bg-zinc-100 text-zinc-800 border-zinc-200',
    outline: 'bg-white text-zinc-700 border-zinc-300',
    emerald: 'bg-zinc-900 text-emerald-400 border-transparent',
    amber: 'bg-zinc-100 text-zinc-900 border-zinc-300',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium border',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
