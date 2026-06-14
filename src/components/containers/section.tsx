import { type HTMLAttributes } from 'react';

import { cn } from '@helpers';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  compact?: boolean;
  contentClassName?: string;
  id: string;
}

export function Section({ id, className, contentClassName, compact = false, children, ...props }: SectionProps) {
  return (
    <section id={id} className={cn(compact ? 'py-8 sm:py-10' : 'py-12 sm:py-16', className)} {...props}>
      <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', contentClassName)}>{children}</div>
    </section>
  );
}
