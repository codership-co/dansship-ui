import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@components/ui';
import { formatPrice } from '@helpers';

import type { PayrollDocument } from '@core/api';

interface PayrollBreakdownDialogProps {
  document: PayrollDocument | null;
  period: string;
  onClose: () => void;
}

export function PayrollBreakdownDialog({ document, period, onClose }: PayrollBreakdownDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog open={document !== null} onOpenChange={open => (open ? undefined : onClose())}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('admin:payroll.breakdown.title')}</DialogTitle>
          <DialogDescription>{document ? `${document.full_name} · ${period}` : null}</DialogDescription>
        </DialogHeader>
        {document ? (
          <div className='grid gap-3'>
            <dl className='m-0 grid gap-2 text-sm'>
              <div className='flex justify-between gap-3'>
                <dt className='text-muted-foreground'>{t('admin:payroll.breakdown.service')}</dt>
                <dd className='m-0'>{formatPrice(document.service_value, 'COP')}</dd>
              </div>
              <div className='flex justify-between gap-3'>
                <dt className='text-muted-foreground'>{t('admin:payroll.breakdown.advances')}</dt>
                <dd className='m-0'>{`− ${formatPrice(document.advances_discounted, 'COP')}`}</dd>
              </div>
              <div className='flex justify-between gap-3 rounded-md bg-primary/10 px-3 py-2 font-semibold text-primary'>
                <dt>{t('admin:payroll.breakdown.net')}</dt>
                <dd className='m-0'>{formatPrice(document.total_amount, 'COP')}</dd>
              </div>
            </dl>
            {document.advance_remainder > 0 ? (
              <p className='m-0 text-sm text-muted-foreground'>
                {t('admin:payroll.breakdown.overflow', { amount: formatPrice(document.advance_remainder, 'COP') })}
              </p>
            ) : null}
          </div>
        ) : null}
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={onClose}>
            {t('admin:payroll.breakdown.close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
