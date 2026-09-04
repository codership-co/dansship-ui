import { addDays, format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@components/ui';
import { DansshipAPI, type ActiveSubscription, type ExtendSubscriptionPayload } from '@core/api';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

const EXTENDABLE_STATUSES = new Set(['active', 'expired']);
const DEFAULT_EXTEND_DAYS = '15';

const canExtend = (subscription: ActiveSubscription) => EXTENDABLE_STATUSES.has(subscription.status);

export function UserSubscriptionsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.subscriptionsAdmin.getUserSubscriptions(userId),
    !!userId,
  );
  const subscriptions = response?.data ?? [];
  const [subscriptionToExtend, setSubscriptionToExtend] = useState<ActiveSubscription | null>(null);
  const [days, setDays] = useState(DEFAULT_EXTEND_DAYS);
  const [reason, setReason] = useState('');

  const { call: extendSubscription, isLoading: isExtending } = useCallablePromise(
    (subscriptionId: string, payload: ExtendSubscriptionPayload) =>
      DansshipAPI.subscriptionsAdmin.extend(subscriptionId, payload),
  );

  const parsedDays = Number(days);
  const canSubmit = Boolean(reason.trim()) && Number.isInteger(parsedDays) && parsedDays >= 1 && parsedDays <= 365;
  const proposedExpiration =
    subscriptionToExtend?.expiration_date && Number.isInteger(parsedDays) && parsedDays >= 1
      ? format(addDays(parseISO(subscriptionToExtend.expiration_date), parsedDays), 'MMM d, yyyy', { locale })
      : null;

  const openExtendDialog = (subscription: ActiveSubscription) => {
    setSubscriptionToExtend(subscription);
    setDays(DEFAULT_EXTEND_DAYS);
    setReason('');
  };

  const handleConfirmExtend = async () => {
    if (!subscriptionToExtend || !canSubmit) return;

    try {
      const { ok } = await extendSubscription(subscriptionToExtend.id, {
        days: parsedDays,
        reason: reason.trim(),
      });

      if (!ok) {
        toast.error(t('admin:users.details.extend.failed'));

        return;
      }

      toast.success(t('admin:users.details.extend.success'));
      setSubscriptionToExtend(null);
      void reFetch();
    } catch {
      toast.error(t('admin:users.details.extend.failed'));
    }
  };

  if (isLoading) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  if (!subscriptions.length) {
    return (
      <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:users.details.emptySubscriptions')}</p>
    );
  }

  return (
    <>
      <div className='rounded-md border bg-white/50'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin:users.details.columns.plan')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead>{t('admin:users.details.columns.remaining')}</TableHead>
              <TableHead>{t('admin:users.details.columns.starts')}</TableHead>
              <TableHead>{t('admin:users.details.columns.expires')}</TableHead>
              <TableHead>{t('admin:users.details.columns.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions.map(subscription => (
              <TableRow key={subscription.id}>
                <TableCell>{subscription.plan_name_snapshot}</TableCell>
                <TableCell>{subscription.status}</TableCell>
                <TableCell>{subscription.remaining_classes ?? '∞'}</TableCell>
                <TableCell>
                  {subscription.start_date ? format(parseISO(subscription.start_date), 'MMM d, yyyy', { locale }) : '-'}
                </TableCell>
                <TableCell>
                  {subscription.expiration_date
                    ? format(parseISO(subscription.expiration_date), 'MMM d, yyyy', { locale })
                    : '-'}
                </TableCell>
                <TableCell>
                  {canExtend(subscription) ? (
                    <Button type='button' size='sm' variant='outline' onClick={() => openExtendDialog(subscription)}>
                      {t('admin:users.details.extend.action')}
                    </Button>
                  ) : (
                    '-'
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog
        open={subscriptionToExtend !== null}
        onOpenChange={open => {
          if (!open && !isExtending) setSubscriptionToExtend(null);
        }}
      >
        <DialogContent className='sm:max-w-106.25'>
          <DialogHeader>
            <DialogTitle>{t('admin:users.details.extend.title')}</DialogTitle>
            <DialogDescription>
              {t('admin:users.details.extend.description', {
                plan: subscriptionToExtend?.plan_name_snapshot ?? '-',
                expires: subscriptionToExtend?.expiration_date
                  ? format(parseISO(subscriptionToExtend.expiration_date), 'MMM d, yyyy', { locale })
                  : '-',
              })}
              {proposedExpiration
                ? ` ${t('admin:users.details.extend.newExpiration', { date: proposedExpiration })}`
                : null}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4'>
            <div className='grid gap-1.5'>
              <Label htmlFor='extend-days'>{t('admin:users.details.extend.days')}</Label>
              <Input
                id='extend-days'
                type='number'
                min={1}
                max={365}
                value={days}
                onChange={event => setDays(event.target.value)}
                disabled={isExtending}
              />
            </div>
            <div className='grid gap-1.5'>
              <Label htmlFor='extend-reason'>{t('admin:users.details.extend.reason')}</Label>
              <Textarea
                id='extend-reason'
                value={reason}
                onChange={event => setReason(event.target.value)}
                placeholder={t('admin:users.details.extend.reasonPlaceholder')}
                disabled={isExtending}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setSubscriptionToExtend(null)}
              disabled={isExtending}
            >
              {t('common:cancel')}
            </Button>
            <Button type='button' onClick={() => void handleConfirmExtend()} disabled={!canSubmit || isExtending}>
              {t('admin:users.details.extend.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
