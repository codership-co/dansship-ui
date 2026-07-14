import { type HTMLAttributes } from 'react';

import { cn } from '@helpers';

interface SectionProps extends HTMLAttributes<HTMLElement> {
  contentClassName?: string;
  fullOnMobile?: boolean;
  verticalPadding?: boolean;
  navbarPadding?: boolean;
  footerMargin?: boolean;
}

export function Section({
  id,
  className,
  contentClassName,
  children,
  fullOnMobile,
  verticalPadding,
  navbarPadding,
  footerMargin,
  ...props
}: SectionProps) {
  return (
    <section
      id={id}
      className={cn(
        'md:px-8',
        !fullOnMobile && 'xs:px-2',
        fullOnMobile && 'sm:px-6',
        verticalPadding && 'py-8 sm:py-16',
        navbarPadding && 'pt-25 sm:pt-30',
        footerMargin && 'mb-40 sm:mb-30',
        className,
      )}
      {...props}
    >
      <div className={cn('mx-auto w-full max-w-7xl px-4', contentClassName)}>{children}</div>
    </section>
  );
}
