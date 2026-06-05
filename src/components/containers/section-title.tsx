import { type HTMLAttributes } from 'react';

import { cn } from '@helpers';

interface SectionTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  size?: 'xl' | 'lg';
}

export function SectionTitle({ className, size = 'xl', ...props }: SectionTitleProps) {
  return <h2 className={cn(size === 'xl' ? 'heading-xl' : 'heading-lg', className)} {...props} />;
}
