import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Section } from '@components/containers';
import { ConfirmDialog } from '@components/modals';
import { ClassCsatFields, formatClassCsatHeadline } from '@components/modules/campaigns/class-csat-form';
import {
  HistoryBookingCard,
  HistoryListSkeleton,
  NextClassHero,
  UpcomingBookingCard,
  UpcomingListSkeleton,
} from '@components/modules/my-bookings';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI, MyBooking } from '@core/api';
import { PageURLS } from '@core/constants';
import { useMyBookings, useMyBookingsHistory, usePromise } from '@hooks';

function BookingsPage() {
  const { t } = useTranslation();
  const {
    response: upcomingResponse,
    isLoading: isLoadingUpcoming,
    error: upcomingError,
    reFetch: reFetchUpcoming,
  } = usePromise(() => DansshipAPI.bookings.getMyBookings({ scope: 'upcoming' }));
  const { response: myFeedbackResponse, reFetch: reFetchFeedback } = usePromise(() =>
    DansshipAPI.classFeedback.listMine(),
  );
  const {
    items: historyItems,
    total: historyTotal,
    isLoading: isLoadingHistory,
    isLoadingMore,
    error: historyError,
    hasMore,
    loadNextPage,
    reFetch: reFetchHistory,
  } = useMyBookingsHistory();
  const { cancelClass, isCancelingClass } = useMyBookings();
  const [bookingToCancel, setBookingToCancel] = useState<MyBooking | null>(null);
  const [bookingToRate, setBookingToRate] = useState<MyBooking | null>(null);
  const [isRefreshingBookings, setIsRefreshingBookings] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const ratedClassIds = useMemo(
    () => new Set((myFeedbackResponse?.data?.items ?? []).map(item => item.scheduled_class_id)),
    [myFeedbackResponse?.data?.items],
  );

  const upcomingBookings = upcomingResponse?.data?.items ?? [];
  const nextClass = upcomingBookings[0] ?? null;
  const furtherUpcoming = upcomingBookings.slice(1);

  useEffect(() => {
    if (!hasMore) {
      return;
    }

    const node = loadMoreRef.current;

    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) {
          void loadNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [hasMore, loadNextPage, historyItems.length]);

  const handleConfirmCancel = async () => {
    if (!bookingToCancel) return;

    const ok = await cancelClass(bookingToCancel.id);

    if (!ok) return;

    setIsRefreshingBookings(true);
    try {
      await Promise.all([reFetchUpcoming(), reFetchHistory()]);
    } finally {
      setIsRefreshingBookings(false);
      setBookingToCancel(null);
    }
  };

  const upcomingFailed = Boolean(upcomingError || upcomingResponse?.error);
  const historyFailed = Boolean(historyError);

  const upcomingHeading =
    upcomingBookings.length === 1
      ? t('bookings:nextClassSection')
      : upcomingBookings.length > 1
        ? `${t('bookings:upcomingSection')} · ${upcomingBookings.length}`
        : t('bookings:upcomingSection');

  return (
    <>
      <Section navbarPadding className='pb-10'>
        <header className='mb-6 flex flex-col gap-1'>
          <h1 className='m-0 font-title text-[1.625rem] leading-[1.1] font-bold text-foreground'>
            {t('bookings:myBookingsTitle')}
          </h1>
          <p className='m-0 text-[13px] leading-[1.4] text-muted-foreground'>{t('bookings:myBookingsSubtitle')}</p>
        </header>

        <section className='mb-8 flex flex-col gap-2.5'>
          <div className='flex items-center gap-2'>
            <span className='size-1.5 rounded-full bg-primary' />
            <h2 className='m-0 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
              {isLoadingUpcoming || upcomingFailed ? t('bookings:upcomingSection') : upcomingHeading}
            </h2>
          </div>

          {isLoadingUpcoming && !upcomingResponse ? (
            <UpcomingListSkeleton />
          ) : upcomingFailed ? (
            <p className='text-alert-600'>{t('bookings:loadError')}</p>
          ) : upcomingBookings.length === 0 ? (
            <p className='rounded-2xl border border-dashed border-primary/20 bg-white/60 px-6 py-10 text-center text-muted-foreground'>
              {t('bookings:emptyUpcoming')}
            </p>
          ) : (
            <div className='space-y-3'>
              {nextClass ? (
                <NextClassHero
                  booking={nextClass}
                  isCancelDisabled={isCancelingClass || isRefreshingBookings}
                  onCancel={setBookingToCancel}
                />
              ) : null}
              {furtherUpcoming.map(booking => (
                <UpcomingBookingCard
                  key={booking.id}
                  booking={booking}
                  isCancelDisabled={isCancelingClass || isRefreshingBookings}
                  onCancel={setBookingToCancel}
                />
              ))}
            </div>
          )}
        </section>

        <section className='flex flex-col gap-2.5'>
          <div className='flex items-baseline justify-between gap-3'>
            <h2 className='m-0 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
              {t('bookings:historySection')}
            </h2>
            {!isLoadingHistory && historyTotal > 0 ? (
              <p className='text-[11px] text-muted-foreground'>
                {t('bookings:historyCount', { loaded: historyItems.length, total: historyTotal })}
              </p>
            ) : null}
          </div>

          {isLoadingHistory && historyItems.length === 0 ? (
            <HistoryListSkeleton />
          ) : historyFailed && historyItems.length === 0 ? (
            <p className='text-alert-600'>{t('bookings:loadError')}</p>
          ) : historyItems.length === 0 ? (
            <p className='rounded-2xl border border-dashed border-primary/20 bg-white/60 px-6 py-10 text-center text-muted-foreground'>
              {t('bookings:emptyHistory')}
            </p>
          ) : (
            <div className='space-y-3'>
              {historyItems.map(booking => (
                <HistoryBookingCard
                  key={booking.id}
                  booking={booking}
                  alreadyRated={ratedClassIds.has(booking.scheduled_class.id)}
                  onRate={setBookingToRate}
                />
              ))}
              {hasMore ? (
                <div ref={loadMoreRef} className='flex justify-center py-6'>
                  {isLoadingMore ? (
                    <p className='text-sm text-muted-foreground'>{t('bookings:loadingMore')}</p>
                  ) : (
                    <Button type='button' variant='ghost' onClick={() => void loadNextPage()}>
                      {t('bookings:loadMore')}
                    </Button>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </section>
      </Section>

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
        <DialogContent
          className='max-w-lg gap-3'
          onOpenAutoFocus={event => {
            event.preventDefault();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              {bookingToRate
                ? t('bookings:rateClassTitle', {
                    headline: formatClassCsatHeadline(
                      bookingToRate.scheduled_class.class_definition?.name ?? t('bookings:classFallback'),
                      bookingToRate.scheduled_class.start_time,
                    ),
                  })
                : null}
            </DialogTitle>
          </DialogHeader>
          {bookingToRate ? (
            <ClassCsatFields
              instructorName={bookingToRate.scheduled_class.instructor?.full_name}
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
                  await Promise.all([reFetchUpcoming(), reFetchHistory(), reFetchFeedback()]);
                } finally {
                  setIsSubmittingRating(false);
                }
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export const SecureBookingsPage = SecurityGuard(BookingsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isMyAccountBookingsPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
