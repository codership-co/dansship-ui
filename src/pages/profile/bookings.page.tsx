import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ConfirmDialog } from '@components/modals';
import { ClassCsatFields } from '@components/modules/campaigns/class-csat-form';
import { Badge, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { BookingStatus, DansshipAPI, MyBooking } from '@core/api';
import { PageURLS } from '@core/constants';
import { canRateBooking, resolvePlanDisplayName } from '@helpers';
import { useMyBookings, usePromise } from '@hooks';

const statusLabel = (status: BookingStatus, t: (key: string) => string) => {
  switch (status) {
    case 'active':
      return t('bookings:status.active');
    case 'cancelled':
      return t('bookings:status.cancelled');
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

const canRate = (booking: MyBooking, ratedClassIds: Set<string>) =>
  canRateBooking({
    status: booking.status,
    endTime: booking.scheduled_class.end_time,
    instructorId: booking.scheduled_class.instructor_id ?? booking.scheduled_class.instructor?.id,
    alreadyRated: ratedClassIds.has(booking.scheduled_class.id),
  });

const canCancel = (booking: MyBooking) => {
  const startsAt = new Date(booking.scheduled_class.start_time).getTime();
  const isFuture = startsAt > Date.now();
  const planAllowsCancel = booking.is_cancellable !== false;

  return isFuture && planAllowsCancel && booking.status === 'active';
};

function BookingsPage() {
  const { t, i18n } = useTranslation();
  const {
    response: myBookingsResponse,
    isLoading: isLoadingMyBookings,
    error: myBookingsError,
    reFetch,
  } = usePromise(() => DansshipAPI.bookings.getMyBookings());
  const { response: myFeedbackResponse, reFetch: reFetchFeedback } = usePromise(() =>
    DansshipAPI.classFeedback.listMine(),
  );
  const { cancelClass, isCancelingClass } = useMyBookings();
  const [bookingToCancel, setBookingToCancel] = useState<MyBooking | null>(null);
  const [bookingToRate, setBookingToRate] = useState<MyBooking | null>(null);
  const [isRefreshingBookings, setIsRefreshingBookings] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const ratedClassIds = useMemo(
    () => new Set((myFeedbackResponse?.data?.items ?? []).map(item => item.scheduled_class_id)),
    [myFeedbackResponse?.data?.items],
  );

  const sortedBookings = useMemo(
    () =>
      [...(myBookingsResponse?.data ?? [])].sort(
        (a, b) => new Date(b.scheduled_class.start_time).getTime() - new Date(a.scheduled_class.start_time).getTime(),
      ),
    [myBookingsResponse?.data],
  );

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    const ok = await cancelClass(bookingToCancel.id);

    if (!ok) return;

    setIsRefreshingBookings(true);
    try {
      await reFetch();
    } finally {
      setIsRefreshingBookings(false);
      setBookingToCancel(null);
    }
  };

  return (
    <div className='max-w-6xl mx-auto py-10 px-4 pt-20'>
      <div className='mb-10'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('bookings:myBookingsTitle')}</h1>
        <p className='text-gray-500 mt-2'>{t('bookings:myBookingsSubtitle')}</p>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        {isLoadingMyBookings && !myBookingsResponse ? (
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
                        {t('subscriptions:planUsed', { name: resolvePlanDisplayName(booking.plan_name, t) })}
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
                      disabled={isCancelingClass || isRefreshingBookings}
                      onClick={() => setBookingToCancel(booking)}
                    >
                      {t('bookings:cancelBooking')}
                    </Button>
                  </div>
                )}

                {ratedClassIds.has(booking.scheduled_class.id) && booking.status === 'attended' ? (
                  <p className='text-sm text-gray-500 mt-4'>{t('bookings:rated')}</p>
                ) : canRate(booking, ratedClassIds) ? (
                  <div className='mt-4'>
                    <Button variant='outline' size='sm' onClick={() => setBookingToRate(booking)}>
                      {t('bookings:rateClass')}
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(bookingToCancel)}
        onOpenChange={open => {
          if (!open && !isCancelingClass && !isRefreshingBookings) {
            setBookingToCancel(null);
          }
        }}
        onConfirm={handleConfirmCancel}
        title={t('bookings:cancelBookingTitle')}
        description={
          bookingToCancel?.would_restore_credit === false ? (
            <>
              {t('bookings:cancelBookingConfirm')}{' '}
              <span className='font-bold'>{t('bookings:cancelBookingNotReimbursed')}</span>
            </>
          ) : bookingToCancel?.would_restore_credit === true ? (
            `${t('bookings:cancelBookingConfirm')} ${t('bookings:cancelBookingReimbursed')}`
          ) : (
            t('bookings:cancelBookingConfirm')
          )
        }
        confirmLabel={isCancelingClass || isRefreshingBookings ? t('bookings:cancelling') : t('bookings:cancelBooking')}
        cancelLabel={t('common:keep')}
        confirmVariant='destructive'
        isLoading={isCancelingClass || isRefreshingBookings}
      />

      <Dialog
        open={Boolean(bookingToRate)}
        onOpenChange={open => {
          if (!open && !isSubmittingRating) {
            setBookingToRate(null);
          }
        }}
      >
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('bookings:rateClassTitle')}</DialogTitle>
          </DialogHeader>
          {bookingToRate ? (
            <div className='space-y-4'>
              <p className='font-medium text-gray-900'>
                {bookingToRate.scheduled_class.class_definition?.name ?? t('bookings:classFallback')}
              </p>
              <ClassCsatFields
                instructorName={bookingToRate.scheduled_class.instructor?.full_name}
                classEndTime={bookingToRate.scheduled_class.end_time}
                isSubmitting={isSubmittingRating}
                submitLabel={t('bookings:submitRating')}
                onSubmit={async values => {
                  setIsSubmittingRating(true);
                  try {
                    const result = await DansshipAPI.classFeedback.create({
                      scheduled_class_id: bookingToRate.scheduled_class.id,
                      class_rating: values.class_rating,
                      instructor_rating: values.instructor_rating,
                      comment: values.comment,
                    });

                    if (!result.ok) {
                      toast.error(t('bookings:rateFailed'));

                      return;
                    }

                    toast.success(t('bookings:rateSuccess'));
                    setBookingToRate(null);
                    await Promise.all([reFetch(), reFetchFeedback()]);
                  } finally {
                    setIsSubmittingRating(false);
                  }
                }}
              />
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const SecureBookingsPage = SecurityGuard(BookingsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isMyAccountBookingsPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
