import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown } from 'react-icons/lu';

import { cn, formatPrice } from '@helpers';

interface CollapsibleTotalProps {
  subtitle: string;
  amount: number;
  baseAmount: number;
  taxAmount: number;
  walletAmountApplied: number;
}

/** Total to pay with a toggleable subtotal / VAT / wallet breakdown; shared by every transfer checkout. */
export function CollapsibleTotal({
  subtitle,
  amount,
  baseAmount,
  taxAmount,
  walletAmountApplied,
}: CollapsibleTotalProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className='rounded-2xl bg-secondary px-4 py-3.5'>
      <button
        type='button'
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${t('eventos:checkout.totalToPay')}. ${t('eventos:checkout.toggleBreakdown')}`}
        onClick={() => setOpen(current => !current)}
        className='flex w-full items-center justify-between gap-4 rounded-lg text-left outline-none focus-visible:ring-[3px] focus-visible:ring-primary/50'
      >
        <span className='grid gap-1'>
          <span className='flex items-center gap-2 font-semibold'>
            {t('eventos:checkout.totalToPay')}
            <span aria-hidden className='grid size-6 place-content-center rounded-full bg-primary/10 text-primary'>
              <LuChevronDown className={cn('size-4 transition-transform', open && 'rotate-180')} />
            </span>
          </span>
          <span className='text-[12.5px] text-secondary-900'>{subtitle}</span>
        </span>
        <span className='font-title text-[28px] leading-none font-bold text-primary'>{formatPrice(amount, 'COP')}</span>
      </button>
      <div id={panelId} hidden={!open} className='mt-3 grid gap-2 border-t border-border pt-3 text-sm'>
        <div className='flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-muted-foreground'>{t('subscriptions:subtotal')}</span>
          <span className='shrink-0'>{formatPrice(baseAmount, 'COP')}</span>
        </div>
        <div className='flex items-center justify-between gap-2'>
          <span className='min-w-0 break-words text-muted-foreground'>{t('subscriptions:iva')}</span>
          <span className='shrink-0'>{formatPrice(taxAmount, 'COP')}</span>
        </div>
        {walletAmountApplied > 0 ? (
          <div className='flex items-center justify-between gap-2 text-primary'>
            <span className='min-w-0 break-words'>{t('subscriptions:walletApplied')}</span>
            <span className='shrink-0'>-{formatPrice(walletAmountApplied, 'COP')}</span>
          </div>
        ) : null}
        <div className='flex items-center justify-between gap-2 font-bold'>
          <span className='min-w-0 break-words'>{t('subscriptions:totalDue')}</span>
          <span className='shrink-0'>{formatPrice(amount, 'COP')}</span>
        </div>
      </div>
    </div>
  );
}
