import type { ComponentProps } from 'react';

import { cn } from '@helpers';

/** White surface with a soft border: the card every Atención asistida section sits on. */
export function AssistedPanel({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('grid gap-4 rounded-xl border border-border bg-white p-6 shadow-sm', className)}
      {...props}
    />
  );
}
