import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Section, SectionHeading } from '@components/containers';
import { ConfirmDialog } from '@components/modals';
import { ClassCsatFields, formatClassCsatHeadline } from '@components/modules/campaigns/class-csat-form';
import {
  HistoryListSkeleton,
  HistoryReservationCard,
  NextReservationHero,
  UpcomingListSkeleton,
  UpcomingReservationCard,
} from '@components/modules/my-bookings';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useStudentSession } from '@contexts';
import { DansshipAPI, MyBooking, type RentalRequest, type RentalSeries } from '@core/api';
import { PageURLS } from '@core/constants';
import {
  classReservation,
  isUpcomingRental,
  isUpcomingRentalSeries,
  rentalReservation,
  rentalSeriesReservation,
  sortReservationsAscending,
  sortReservationsDescending,
  workshopReservation,
} from '@helpers';
import { useMyBookings, useMyBookingsHistory, usePromise } from '@hooks';

function BookingsPage() {
  const { t } = useTranslation();
  const {
    bookings: upcomingBookings,
    bookingsResponse: upcomingResponse,
    isLoadingBookings: isLoadingUpcomingClasses,
    bookingsError: upcomingError,
    reFetchBookings: reFetchUpcoming,
  } = useStudentSession();
  const { response: myFeedbackResponse, reFetch: reFetchFeedback } = usePromise(() =>
    DansshipAPI.classFeedback.listMine(),
  );
  const {
    items: historyItems,
    total: historyClassTotal,
    isLoading: isLoadingHistoryClasses,
    isLoadingMore,
    error: historyError,
    hasMore,
    loadNextPage,
    reFetch: reFetchHistory,
  } = useMyBookingsHistory();
  const { cancelClass, isCancelingClass } = useMyBookings();
  const { response: workshopUpcomingResponse, isLoading: isLoadingWorkshopUpcoming } = usePromise(() =>
    DansshipAPI.talleres.listMyRegistrations({ scope: 'upcoming' }),
  );
  const { response: workshopHistoryResponse, isLoading: isLoadingWorkshopHistory } = usePromise(() =>
    DansshipAPI.talleres.listMyRegistrations({ scope: 'history' }),
  );
  const { response: rentalRequestsResponse, isLoading: isLoadingRentalRequests } = usePromise(() =>
    DansshipAPI.studioRental.getMyRequests(),
  );
  const { response: rentalSeriesResponse, isLoading: isLoadingRentalSeries } = usePromise(() =>
    DansshipAPI.studioRental.getMySeries(),
  );
  const { response: roomsResponse } = usePromise(() => DansshipAPI.studioRental.getRooms());
  const [bookingToCancel, setBookingToCancel] = useState<MyBooking | null>(null);
  const [bookingToRate, setBookingToRate] = useState<MyBooking | null>(null);
  const [isRefreshingBookings, setIsRefreshingBookings] = useState(false);
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const ratedClassIds = useMemo(
    () => new Set((myFeedbackResponse?.data?.items ?? []).map(item => item.scheduled_class_id)),
    [myFeedbackResponse?.data?.items],
  );

  const roomNameById = useMemo(() => {
    const dictionary: Record<string, string> = {};

    (roomsResponse?.data ?? []).forEach(room => {
      dictionary[room.id] = room.name;
    });

    return dictionary;
  }, [roomsResponse?.data]);

  const rentalRequests = useMemo(
    () => (rentalRequestsResponse?.data ?? []) as Array<RentalRequest>,
    [rentalRequestsResponse?.data],
  );
  const rentalSeries = useMemo(
    () => (rentalSeriesResponse?.data ?? []) as Array<RentalSeries>,
    [rentalSeriesResponse?.data],
  );

  const upcomingItems = useMemo(() => {
    const classes = upcomingBookings.map(classReservation);
    const workshops = (workshopUpcomingResponse?.data ?? []).map(workshopReservation);
    const rentals = rentalRequests
      .filter(request => isUpcomingRental(request))
      .map(request => rentalReservation(request, roomNameById[request.slots[0]?.room_id] ?? ''));
    const series = rentalSeries
      .filter(item => isUpcomingRentalSeries(item))
      .map(item => rentalSeriesReservation(item, roomNameById[item.room_id] ?? ''));

    return sortReservationsAscending([...classes, ...workshops, ...rentals, ...series]);
  }, [upcomingBookings, workshopUpcomingResponse?.data, rentalRequests, rentalSeries, roomNameById]);

  const extraHistory = useMemo(() => {
    const workshops = (workshopHistoryResponse?.data ?? []).map(workshopReservation);
    const rentals = rentalRequests
      .filter(request => !isUpcomingRental(request))
      .map(request => rentalReservation(request, roomNameById[request.slots[0]?.room_id] ?? ''));
    const series = rentalSeries
      .filter(item => !isUpcomingRentalSeries(item))
      .map(item => rentalSeriesReservation(item, roomNameById[item.room_id] ?? ''));

    return [...workshops, ...rentals, ...series];
  }, [workshopHistoryResponse?.data, rentalRequests, rentalSeries, roomNameById]);

  const historyReservations = useMemo(
    () => sortReservationsDescending([...historyItems.map(classReservation), ...extraHistory]),
    [historyItems, extraHistory],
  );

  const nextReservation = upcomingItems[0] ?? null;
  const furtherUpcoming = upcomingItems.slice(1);
  const historyLoaded = historyReservations.length;
  const historyTotal = historyClassTotal + extraHistory.length;

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
  }, [hasMore, loadNextPage, historyReservations.length]);

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

  const isLoadingUpcoming =
    (isLoadingUpcomingClasses && !upcomingResponse) ||
    (isLoadingWorkshopUpcoming && !workshopUpcomingResponse) ||
    (isLoadingRentalRequests && !rentalRequestsResponse) ||
    (isLoadingRentalSeries && !rentalSeriesResponse);
  const isLoadingHistory =
    (isLoadingHistoryClasses && historyItems.length === 0) ||
    (isLoadingWorkshopHistory && !workshopHistoryResponse) ||
    (isLoadingRentalRequests && !rentalRequestsResponse) ||
    (isLoadingRentalSeries && !rentalSeriesResponse);
  const upcomingFailed =
    upcomingItems.length === 0 &&
    Boolean(upcomingError || upcomingResponse?.error) &&
    Boolean(workshopUpcomingResponse && !workshopUpcomingResponse.ok) &&
    Boolean(rentalRequestsResponse && !rentalRequestsResponse.ok);
  const historyFailed =
    historyReservations.length === 0 &&
    Boolean(historyError) &&
    Boolean(workshopHistoryResponse && !workshopHistoryResponse.ok) &&
    Boolean(rentalRequestsResponse && !rentalRequestsResponse.ok);

  const upcomingHeading =
    upcomingItems.length === 1
      ? t('bookings:nextClassSection')
      : upcomingItems.length > 1
        ? `${t('bookings:upcomingSection')} · ${upcomingItems.length}`
        : t('bookings:upcomingSection');

  return (
    <>
      <Section navbarPadding className='overflow-x-hidden pb-10'>
        <SectionHeading title={t('bookings:myBookingsTitle')} subtitle={t('bookings:myBookingsSubtitle')} />

        <section className='mb-8 flex flex-col gap-2.5'>
          <div className='flex items-center gap-2'>
            <span className='size-1.5 rounded-full bg-primary' />
            <h2 className='m-0 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
              {isLoadingUpcoming || upcomingFailed ? t('bookings:upcomingSection') : upcomingHeading}
            </h2>
          </div>

          {isLoadingUpcoming && upcomingItems.length === 0 ? (
            <UpcomingListSkeleton />
          ) : upcomingFailed ? (
            <p className='text-alert-600'>{t('bookings:loadError')}</p>
          ) : upcomingItems.length === 0 ? (
            <p className='rounded-2xl border border-dashed border-primary/20 bg-white/60 px-6 py-10 text-center text-muted-foreground'>
              {t('bookings:emptyUpcoming')}
            </p>
          ) : (
            <div className='space-y-3'>
              {nextReservation ? (
                <NextReservationHero
                  item={nextReservation}
                  isCancelDisabled={isCancelingClass || isRefreshingBookings}
                  onCancelClass={setBookingToCancel}
                />
              ) : null}
              {furtherUpcoming.map(item => (
                <UpcomingReservationCard
                  key={item.id}
                  item={item}
                  isCancelDisabled={isCancelingClass || isRefreshingBookings}
                  onCancelClass={setBookingToCancel}
                />
              ))}
            </div>
          )}
        </section>

        <section className='flex flex-col gap-2.5'>
          <div className='flex min-w-0 items-baseline justify-between gap-3'>
            <h2 className='m-0 min-w-0 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
              {t('bookings:historySection')}
            </h2>
            {!isLoadingHistory && historyTotal > 0 ? (
              <p className='shrink-0 text-[11px] text-muted-foreground'>
                {t('bookings:historyCount', { loaded: historyLoaded, total: historyTotal })}
              </p>
            ) : null}
          </div>

          {isLoadingHistory && historyReservations.length === 0 ? (
            <HistoryListSkeleton />
          ) : historyFailed ? (
            <p className='text-alert-600'>{t('bookings:loadError')}</p>
          ) : historyReservations.length === 0 ? (
            <p className='rounded-2xl border border-dashed border-primary/20 bg-white/60 px-6 py-10 text-center text-muted-foreground'>
              {t('bookings:emptyHistory')}
            </p>
          ) : (
            <div className='space-y-3'>
              {historyReservations.map(item => (
                <HistoryReservationCard
                  key={item.id}
                  item={item}
                  alreadyRated={item.kind === 'class' ? ratedClassIds.has(item.booking.scheduled_class.id) : false}
                  onRateClass={setBookingToRate}
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
