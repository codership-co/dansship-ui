import { type HTMLAttributes, type ReactNode } from 'react';

import { cn } from '@helpers';

interface SectionHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  intro?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  centered?: boolean;
}

export function SectionHeading({ className, intro, title, subtitle, centered = false, ...props }: SectionHeadingProps) {
  return (
    <div className={cn('mb-10', centered && 'text-center', className)} {...props}>
      {intro ? <small className='font-semibold uppercase text-primary/80'>{intro}</small> : null}

      <h2 className='m-0 text-primary'>{title}</h2>

      {subtitle ? <p className='text-muted-foreground mt-0'>{subtitle}</p> : null}
    </div>
  );
}
