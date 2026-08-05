import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { DansshipAPI, PaymentStatus, type CreateWalletEntryPayload, type WalletEntryType } from '@core/api';
import { formatPrice, paymentPurchaseLabel } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

const NONE_PAYMENT_VALUE = '__none__';
const RECENT_PAYMENTS_LIMIT = 10;

export function UserWalletTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(() => DansshipAPI.walletsAdmin.getUserWallet(userId), !!userId);
  const { response: paymentsResponse, isLoading: isLoadingPayments } = usePromise(
    () =>
      DansshipAPI.paymentsAdmin.getAdminPayments({
        user_id: userId,
        status: PaymentStatus.APPROVED,
      }),
    !!userId,
  );
  const wallet = response?.data;
  const recentPayments = useMemo(
    () => (paymentsResponse?.data?.items ?? []).slice(0, RECENT_PAYMENTS_LIMIT),
    [paymentsResponse?.data?.items],
  );
  const { call: createEntry, isLoading: isSubmitting } = useCallablePromise((payload: CreateWalletEntryPayload) =>
    DansshipAPI.walletsAdmin.createEntry(userId, payload),
  );

  const [entryType, setEntryType] = useState<WalletEntryType>('credit');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [paymentIntentId, setPaymentIntentId] = useState(NONE_PAYMENT_VALUE);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const parsedAmount = Number(amount);
  const canSubmit = Boolean(note.trim()) && Number.isFinite(parsedAmount) && parsedAmount > 0;

  const handleConfirm = async () => {
    if (!canSubmit) return;

    const payload: CreateWalletEntryPayload = {
      entry_type: entryType,
      amount: parsedAmount,
      note: note.trim(),
      ...(paymentIntentId !== NONE_PAYMENT_VALUE ? { payment_intent_id: paymentIntentId } : {}),
    };

    const { ok } = await createEntry(payload);

    if (!ok) {
      toast.error(t('admin:users.details.wallet.entryFailed'));

      return;
    }

    toast.success(t('admin:users.details.wallet.entrySuccess'));
    setAmount('');
    setNote('');
    setPaymentIntentId(NONE_PAYMENT_VALUE);
    setConfirmOpen(false);
    void reFetch();
  };

  if (isLoading && !wallet) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  return (
    <section className='grid gap-6'>
      <div className='rounded-md border bg-white/50 p-4'>
        <p className='text-sm text-muted-foreground'>{t('admin:users.details.wallet.balanceLabel')}</p>
        <p className='text-2xl font-semibold text-primary'>{formatPrice(wallet?.balance ?? 0, 'COP')}</p>
      </div>

      <form
        className='grid gap-4 rounded-md border bg-white/50 p-4'
        onSubmit={event => {
          event.preventDefault();

          if (canSubmit) setConfirmOpen(true);
        }}
      >
        <h3 className='text-sm font-semibold'>{t('admin:users.details.wallet.addEntryTitle')}</h3>

        <div className='grid gap-2 sm:grid-cols-2'>
          <div className='grid gap-1.5'>
            <Label htmlFor='wallet-entry-type'>{t('admin:users.details.wallet.entryType')}</Label>
            <select
              id='wallet-entry-type'
              className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
              value={entryType}
              onChange={event => setEntryType(event.target.value as WalletEntryType)}
            >
              <option value='credit'>{t('admin:users.details.wallet.credit')}</option>
              <option value='debit'>{t('admin:users.details.wallet.debit')}</option>
            </select>
          </div>

          <div className='grid gap-1.5'>
            <Label htmlFor='wallet-amount'>{t('admin:users.details.wallet.amount')}</Label>
            <Input
              id='wallet-amount'
              type='number'
              min='0.01'
              step='0.01'
              value={amount}
              onChange={event => setAmount(event.target.value)}
              required
            />
          </div>
        </div>

        <div className='grid gap-1.5'>
          <Label htmlFor='wallet-note'>{t('admin:users.details.wallet.note')}</Label>
          <Input
            id='wallet-note'
            value={note}
            onChange={event => setNote(event.target.value)}
            placeholder={t('admin:users.details.wallet.notePlaceholder')}
            required
          />
        </div>

        <div className='grid gap-1.5'>
          <Label>{t('admin:users.details.wallet.paymentIntentOptional')}</Label>
          <Select value={paymentIntentId} onValueChange={setPaymentIntentId} disabled={isLoadingPayments}>
            <SelectTrigger className='w-full'>
              <SelectValue
                placeholder={
                  isLoadingPayments
                    ? t('admin:users.details.wallet.paymentsLoading')
                    : t('admin:users.details.wallet.paymentIntentPlaceholder')
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_PAYMENT_VALUE}>{t('admin:users.details.wallet.paymentIntentNone')}</SelectItem>
              {recentPayments.map(intent => (
                <SelectItem key={intent.id} value={intent.id}>
                  {`${format(parseISO(intent.created_at), 'MMM d, yyyy', { locale })} · ${formatPrice(intent.amount, intent.currency)} · ${paymentPurchaseLabel(intent)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className='text-xs text-muted-foreground'>{t('admin:users.details.wallet.paymentIntentHint')}</p>
        </div>

        <div className='flex justify-end'>
          <Button type='submit' disabled={!canSubmit || isSubmitting}>
            {t('admin:users.details.wallet.submit')}
          </Button>
        </div>
      </form>

      {!wallet?.entries.length ? (
        <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:users.details.wallet.empty')}</p>
      ) : (
        <div className='rounded-md border bg-white/50'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin:users.details.wallet.columns.date')}</TableHead>
                <TableHead>{t('admin:users.details.wallet.columns.type')}</TableHead>
                <TableHead>{t('admin:users.details.wallet.columns.amount')}</TableHead>
                <TableHead>{t('admin:users.details.wallet.columns.note')}</TableHead>
                <TableHead>{t('admin:users.details.wallet.columns.source')}</TableHead>
                <TableHead>{t('admin:users.details.wallet.columns.runningBalance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {wallet.entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell>{format(parseISO(entry.created_at), 'MMM d, yyyy HH:mm', { locale })}</TableCell>
                  <TableCell>
                    {entry.entry_type === 'credit'
                      ? t('admin:users.details.wallet.credit')
                      : t('admin:users.details.wallet.debit')}
                  </TableCell>
                  <TableCell>{formatPrice(entry.amount, 'COP')}</TableCell>
                  <TableCell className='max-w-xs truncate' title={entry.note}>
                    {entry.note}
                  </TableCell>
                  <TableCell>{t(`admin:users.details.wallet.sources.${entry.source}`)}</TableCell>
                  <TableCell>{formatPrice(entry.running_balance, 'COP')}</TableCell>
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
        title={t('admin:users.details.wallet.confirmTitle')}
        description={t('admin:users.details.wallet.confirmDescription', {
          type: entryType === 'credit' ? t('admin:users.details.wallet.credit') : t('admin:users.details.wallet.debit'),
          amount: formatPrice(parsedAmount || 0, 'COP'),
        })}
        confirmLabel={t('admin:users.details.wallet.submit')}
        cancelLabel={t('common:cancel')}
        isLoading={isSubmitting}
      />
    </section>
  );
}
