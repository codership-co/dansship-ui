import type { ComponentPropsWithoutRef } from 'react';

import { cn } from 'polpo/helpers';

interface ContainerProps extends ComponentPropsWithoutRef<'section'> {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className, ...props }: ContainerProps) {
  return (
    <section className={cn('bg-white px-8 py-8 rounded-xl shadow-lg', className)} {...props}>
      {children}
    </section>
  );
}
