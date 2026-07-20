import React from 'react';
import { cn } from '@/shared/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export function Card({ className, hoverable = false, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'mono-card p-6 sm:p-7',
        hoverable && 'mono-card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
