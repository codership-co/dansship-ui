import { type HTMLAttributes } from 'react';

import { cn } from '@helpers';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  compact?: boolean;
  contentClassName?: string;
}

export function Section({ className, contentClassName, compact = false, children, ...props }: SectionProps) {
  return (
    <section className={cn(compact ? 'page-section-tight' : 'page-section', className)} {...props}>
      <div className={cn('content-max', contentClassName)}>{children}</div>
    </section>
  );
}
