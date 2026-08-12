import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

export function UserSubscriptionsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading } = usePromise(
    () => DansshipAPI.subscriptionsAdmin.getUserSubscriptions(userId),
    !!userId,
  );
  const subscriptions = response?.data ?? [];

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
    <div className='rounded-md border bg-white/50'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:users.details.columns.plan')}</TableHead>
            <TableHead>{t('common:status')}</TableHead>
            <TableHead>{t('admin:users.details.columns.remaining')}</TableHead>
            <TableHead>{t('admin:users.details.columns.starts')}</TableHead>
            <TableHead>{t('admin:users.details.columns.expires')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map(subscription => (
            <TableRow key={subscription.id}>
              <TableCell>{subscription.plan_name_snapshot}</TableCell>
              <TableCell>{subscription.status}</TableCell>
              <TableCell>{subscription.remaining_classes}</TableCell>
              <TableCell>
                {subscription.start_date ? format(parseISO(subscription.start_date), 'MMM d, yyyy', { locale }) : '-'}
              </TableCell>
              <TableCell>
                {subscription.expiration_date
                  ? format(parseISO(subscription.expiration_date), 'MMM d, yyyy', { locale })
                  : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
