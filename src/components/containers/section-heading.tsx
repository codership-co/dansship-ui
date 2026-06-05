import { type HTMLAttributes, type ReactNode } from 'react';

import { SectionTitle } from './section-title';

import { cn } from '@helpers';

interface SectionHeadingProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  intro?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  titleSize?: 'xl' | 'lg';
  centered?: boolean;
}

export function SectionHeading({
  className,
  intro,
  title,
  subtitle,
  titleSize = 'xl',
  centered = false,
  ...props
}: SectionHeadingProps) {
  return (
    <div className={cn('space-y-2', centered && 'text-center', className)} {...props}>
      {intro ? <p className='text-xs font-semibold uppercase tracking-[0.18em] text-primary/80'>{intro}</p> : null}

      <SectionTitle className='text-primary' size={titleSize}>
        {title}
      </SectionTitle>

      {subtitle ? <p className='text-muted-foreground'>{subtitle}</p> : null}
    </div>
  );
}
