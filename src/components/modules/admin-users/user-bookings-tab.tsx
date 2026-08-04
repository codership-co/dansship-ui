import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

export function UserBookingsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading } = usePromise(() => DansshipAPI.bookingsAdmin.listUserBookings(userId), !!userId);
  const bookings = response?.data ?? [];

  if (isLoading) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  if (!bookings.length) {
    return <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:users.details.emptyBookings')}</p>;
  }

  return (
    <div className='rounded-md border bg-white/50'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:users.details.columns.class')}</TableHead>
            <TableHead>{t('common:status')}</TableHead>
            <TableHead>{t('admin:users.details.columns.startTime')}</TableHead>
            <TableHead>{t('admin:users.details.columns.room')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {bookings.map(booking => (
            <TableRow key={booking.id}>
              <TableCell>{booking.scheduled_class?.class_definition?.name ?? '-'}</TableCell>
              <TableCell>{booking.status}</TableCell>
              <TableCell>
                {booking.scheduled_class?.start_time
                  ? format(parseISO(booking.scheduled_class.start_time), 'MMM d, yyyy HH:mm', { locale })
                  : '-'}
              </TableCell>
              <TableCell>{booking.scheduled_class?.room?.name ?? '-'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
