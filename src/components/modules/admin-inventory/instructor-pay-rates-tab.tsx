import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { formatPrice } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

export function InstructorPayRatesTab() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.instructorPaymentsAdmin.listPayRates());
  const { call: setPayRate, isLoading: isSubmitting } = useCallablePromise((hourlyAmount: number) =>
    DansshipAPI.instructorPaymentsAdmin.setPayRate({ hourly_amount: hourlyAmount }),
  );
  const [amount, setAmount] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  const parsedAmount = Number(amount);
  const canSubmit = Number.isFinite(parsedAmount) && parsedAmount > 0;
  const rates = response?.data;
  const current = rates?.current;
  const history = rates?.history ?? [];

  const handleConfirm = async () => {
    if (!canSubmit) return;

    const { ok } = await setPayRate(parsedAmount);

    if (!ok) {
      toast.error(t('admin:inventory.payRates.saveFailed'));

      return;
    }

    toast.success(t('admin:inventory.payRates.saveSuccess'));
    setAmount('');
    setConfirmOpen(false);
    void reFetch();
  };

  if (isLoading && !rates) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:inventory.payRates.loading')} />
      </div>
    );
  }

  return (
    <section className='grid gap-6'>
      <div className='rounded-md border bg-white/50 p-4'>
        <p className='text-sm text-muted-foreground'>{t('admin:inventory.payRates.currentLabel')}</p>
        <p className='text-2xl font-semibold text-primary'>
          {current ? formatPrice(current.hourly_amount, 'COP') : t('admin:inventory.payRates.noCurrent')}
        </p>
        {current ? (
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('admin:inventory.payRates.effectiveFrom', {
              date: format(parseISO(current.effective_from), 'MMM d, yyyy HH:mm', { locale }),
            })}
          </p>
        ) : (
          <p className='mt-1 text-xs text-muted-foreground'>{t('admin:inventory.payRates.noCurrentHint')}</p>
        )}
      </div>

      <form
        className='grid gap-4 rounded-md border bg-white/50 p-4'
        onSubmit={event => {
          event.preventDefault();

          if (canSubmit) setConfirmOpen(true);
        }}
      >
        <h3 className='text-sm font-semibold'>{t('admin:inventory.payRates.setTitle')}</h3>
        <div className='grid gap-1.5 max-w-sm'>
          <Label htmlFor='hourly-amount'>{t('admin:inventory.payRates.hourlyAmount')}</Label>
          <Input
            id='hourly-amount'
            type='number'
            min='1'
            step='1'
            value={amount}
            onChange={event => setAmount(event.target.value)}
            required
          />
        </div>
        <div className='flex justify-end'>
          <Button type='submit' disabled={!canSubmit || isSubmitting}>
            {t('admin:inventory.payRates.submit')}
          </Button>
        </div>
      </form>

      {!history.length ? (
        <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:inventory.payRates.emptyHistory')}</p>
      ) : (
        <div className='rounded-md border bg-white/50 overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin:inventory.payRates.columns.amount')}</TableHead>
                <TableHead>{t('admin:inventory.payRates.columns.from')}</TableHead>
                <TableHead>{t('admin:inventory.payRates.columns.to')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map(rate => (
                <TableRow key={rate.id}>
                  <TableCell>{formatPrice(rate.hourly_amount, 'COP')}</TableCell>
                  <TableCell>{format(parseISO(rate.effective_from), 'MMM d, yyyy HH:mm', { locale })}</TableCell>
                  <TableCell>
                    {rate.effective_to
                      ? format(parseISO(rate.effective_to), 'MMM d, yyyy HH:mm', { locale })
                      : t('admin:inventory.payRates.currentBadge')}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void handleConfirm()}
        title={t('admin:inventory.payRates.confirmTitle')}
        description={t('admin:inventory.payRates.confirmDescription', {
          amount: formatPrice(parsedAmount || 0, 'COP'),
        })}
        confirmLabel={t('admin:inventory.payRates.submit')}
        cancelLabel={t('common:cancel')}
        isLoading={isSubmitting}
      />
    </section>
  );
}
