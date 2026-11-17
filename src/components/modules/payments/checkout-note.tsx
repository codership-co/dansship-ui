import type { ReactNode } from 'react';

import { cn } from '@helpers';

import type { IconType } from 'react-icons';

interface CheckoutNoteProps {
  Icon: IconType;
  /** `neutral` for how the plan starts, `gift` for what the recipient gets. */
  tone?: 'neutral' | 'gift';
  children: ReactNode;
}

/** Highlighted note inside the checkout form, with a leading icon. */
export function CheckoutNote({ Icon, tone = 'neutral', children }: CheckoutNoteProps) {
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm',
        tone === 'gift'
          ? 'border-tertiary-200 bg-tertiary-50 text-gray-700'
          : 'border-secondary-200 bg-secondary-100 text-gray-900',
      )}
    >
      <Icon className={cn('mt-0.5 shrink-0', tone === 'gift' ? 'text-tertiary' : 'text-primary')} aria-hidden />
      <p className='m-0'>{children}</p>
    </div>
  );
}
