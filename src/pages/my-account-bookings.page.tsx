import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge, Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { BookingStatus, DansshipAPI, MyBooking } from '@core/api';
import { PageURLS } from '@core/constants';
import { useMyBookings, usePromise } from '@hooks';

const statusLabel = (status: BookingStatus, t: (key: string) => string) => {
  switch (status) {
    case 'active':
      return t('bookings:status.active');
    case 'waitlisted':
      return t('bookings:status.waitlisted');
    case 'attended':
      return t('bookings:status.attended');
    case 'no_show':
      return t('bookings:status.noShow');
    default:
      return status;
  }
};

const statusVariant = (status: BookingStatus): 'default' | 'secondary' | 'destructive' | 'outline' => {
  if (status === 'active') return 'default';

  if (status === 'waitlisted') return 'secondary';

  if (status === 'no_show') return 'destructive';

  return 'outline';
};

const formatDateTime = (value: string, locale?: string) =>
  new Date(value).toLocaleString(locale, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const canCancel = (booking: MyBooking) => {
  const startsAt = new Date(booking.scheduled_class.start_time).getTime();
  const isFuture = startsAt > Date.now();

  return isFuture && (booking.status === 'active' || booking.status === 'waitlisted');
};

function MyAccountBookingsPage() {
  const { t, i18n } = useTranslation();
  const {
    response: myBookingsResponse,
    isLoading: isLoadingMyBookings,
    error: myBookingsError,
  } = usePromise(() => DansshipAPI.bookings.getMyBookings());
  const { cancelClass, cancelWaitlist, isCancelingClass, isCancelingWaitlist } = useMyBookings();

  const sortedBookings = useMemo(
    () =>
      (myBookingsResponse?.data ?? []).sort(
        (a, b) => new Date(a.scheduled_class.start_time).getTime() - new Date(b.scheduled_class.start_time).getTime(),
      ),
    [myBookingsResponse?.data],
  );

  const isSubmitting = isCancelingClass || isCancelingWaitlist;

  return (
    <div className='max-w-6xl mx-auto py-10 px-4 pt-20'>
      <div className='mb-10'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('bookings:myBookingsTitle')}</h1>
        <p className='text-gray-500 mt-2'>{t('bookings:myBookingsSubtitle')}</p>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        {isLoadingMyBookings ? (
          <p className='text-gray-500'>{t('bookings:loading')}</p>
        ) : myBookingsError || myBookingsResponse?.error ? (
          <p className='text-alert-600'>{t('bookings:loadError')}</p>
        ) : sortedBookings.length === 0 ? (
          <p className='text-gray-500'>{t('bookings:empty')}</p>
        ) : (
          <div className='space-y-4'>
            {sortedBookings.map(booking => (
              <div key={booking.id} className='rounded-lg border border-gray-200 p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-semibold text-gray-900'>
                      {booking.scheduled_class.class_definition?.name ?? t('bookings:classFallback')}
                    </p>
                    <p className='text-sm text-gray-500 mt-1'>
                      {formatDateTime(booking.scheduled_class.start_time, i18n.language)}
                    </p>
                    <p className='text-sm text-gray-500 mt-1'>
                      {t('bookings:roomLabel')}: {booking.scheduled_class.room?.name ?? t('bookings:unknown')}
                    </p>
                    {booking.plan_name && (
                      <p className='text-xs text-primary font-medium mt-1'>
                        {t('subscriptions:planUsed', { name: booking.plan_name })}
                      </p>
                    )}
                  </div>
                  <Badge variant={statusVariant(booking.status)}>{statusLabel(booking.status, t)}</Badge>
                </div>

                {canCancel(booking) && (
                  <div className='mt-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      disabled={isSubmitting}
                      onClick={() =>
                        booking.status === 'waitlisted' ? cancelWaitlist(booking.id) : cancelClass(booking.id)
                      }
                    >
                      {booking.status === 'waitlisted' ? t('bookings:leaveWaitlist') : t('bookings:cancelBooking')}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export const SecureMyAccountBookingsPage = SecurityGuard(MyAccountBookingsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isMyAccountBookingsPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
