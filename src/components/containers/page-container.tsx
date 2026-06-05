import { type HTMLAttributes } from 'react';

import { cn } from '@helpers';

export function PageContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('content-max', className)} {...props} />;
}
