import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI, type MyBooking } from '@core/api';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

const canReimburse = (booking: MyBooking) => booking.status === 'cancelled' && booking.credit_restored === false;

export function UserBookingsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.bookingsAdmin.listUserBookings(userId),
    !!userId,
  );
  const bookings = response?.data ?? [];
  const [bookingToReimburse, setBookingToReimburse] = useState<MyBooking | null>(null);

  const { call: reimburseCredit, isLoading: isReimbursing } = useCallablePromise((bookingId: string) =>
    DansshipAPI.bookingsAdmin.reimburseCredit(bookingId),
  );

  const handleConfirmReimburse = async () => {
    if (!bookingToReimburse) return;

    const { ok } = await reimburseCredit(bookingToReimburse.id);

    if (!ok) {
      toast.error(t('admin:users.details.reimburseFailed'));

      return;
    }

    toast.success(t('admin:users.details.reimburseSuccess'));
    setBookingToReimburse(null);
    void reFetch();
  };

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
    <>
      <div className='rounded-md border bg-white/50'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin:users.details.columns.class')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead>{t('admin:users.details.columns.startTime')}</TableHead>
              <TableHead>{t('admin:users.details.columns.room')}</TableHead>
              <TableHead>{t('admin:users.details.columns.cancelledAt')}</TableHead>
              <TableHead>{t('admin:users.details.columns.reimbursed')}</TableHead>
              <TableHead>{t('admin:users.details.columns.actions')}</TableHead>
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
                <TableCell>
                  {booking.cancelled_at ? format(parseISO(booking.cancelled_at), 'MMM d, yyyy HH:mm', { locale }) : '-'}
                </TableCell>
                <TableCell>
                  {booking.credit_restored === true
                    ? t('common:yes', { defaultValue: 'Sí' })
                    : booking.credit_restored === false
                      ? t('common:no', { defaultValue: 'No' })
                      : '-'}
                </TableCell>
                <TableCell>
                  {canReimburse(booking) ? (
                    <Button type='button' size='sm' variant='outline' onClick={() => setBookingToReimburse(booking)}>
                      {t('admin:users.details.reimburse')}
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

      <ConfirmDialog
        open={bookingToReimburse !== null}
        onOpenChange={open => {
          if (!open && !isReimbursing) setBookingToReimburse(null);
        }}
        onConfirm={() => void handleConfirmReimburse()}
        title={t('admin:users.details.reimburseConfirmTitle')}
        description={t('admin:users.details.reimburseConfirmDescription', {
          className: bookingToReimburse?.scheduled_class?.class_definition?.name ?? '-',
        })}
        confirmLabel={t('admin:users.details.reimburse')}
        cancelLabel={t('common:cancel')}
        isLoading={isReimbursing}
      />
    </>
  );
}
