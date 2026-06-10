import { type HTMLAttributes } from 'react';

import { cn } from '@helpers';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: 'xl' | 'lg';
}

export function SectionTitle({ className, size = 'xl', ...props }: SectionTitleProps) {
  return (
    <h2
      className={cn(
        size === 'xl' ? 'text-3xl font-bold leading-tight sm:text-4xl' : 'text-2xl font-bold leading-tight sm:text-3xl',
        className,
      )}
      {...props}
    />
  );
}
