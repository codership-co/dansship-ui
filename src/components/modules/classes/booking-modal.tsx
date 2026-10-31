import { format, parseISO } from 'date-fns';
import { AsideModal, Button } from 'polpo/components';
import { cn, toCapitalize } from 'polpo/helpers';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Container } from '@components/containers';
import { EmailField } from '@components/form-fields';
import { ConfirmDialog } from '@components/modals';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { ProfilePicture } from '@components/ui/profile-picture';
import { useAuth, useStudentSession } from '@contexts';
import { ActiveSubscription, DANSSHIP_ERROR_CODE, DansshipAPI, MyBooking, PublishedClass } from '@core/api';
import { DEFAULT_ROOM_IMAGE, PageURLS } from '@core/constants';
import {
  formatTimeDifference,
  getClassBookingEligibility,
  hasPaidPlanCoveringClass,
  isOwnInstructedClass,
  isPastBookingDeadline,
  toColombiaDateKey,
} from '@helpers';
import { useDateLocale, useMyBookings } from '@hooks';

type BookingConfirmAction = 'cancel';

const UPCOMING_PAGE_SIZE = 100;

async function loadUpcomingBookings(attendeeUserId: string) {
  const items: Array<MyBooking> = [];
  let offset = 0;
  let total = Number.POSITIVE_INFINITY;

  while (offset < total) {
    const result = await DansshipAPI.bookings.getMyBookings({
      scope: 'upcoming',
      attendee_user_id: attendeeUserId,
      limit: UPCOMING_PAGE_SIZE,
      offset,
    });

    if (!result.ok || !result.data) {
      return { ok: false as const, items };
    }

    items.push(...result.data.items);
    total = result.data.total;
    offset += result.data.items.length;

    if (result.data.items.length === 0) {
      break;
    }
  }

  return { ok: true as const, items };
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedClass: PublishedClass | null;
  subscriptions?: Array<ActiveSubscription>;
  isTrialEligible?: boolean;
  onBookingChange?: () => void | Promise<void>;
  attendeeUserId?: string | null;
  attendeeName?: string | null;
  attendeeOptions?: Array<{ id: string; label: string }>;
  onAttendeeChange?: (attendeeUserId: string) => void;
  attendeePending?: boolean;
}

export function BookingModal({
  isOpen,
  onClose,
  selectedClass,
  subscriptions = [],
  isTrialEligible = false,
  onBookingChange,
  attendeeUserId = null,
  attendeeName = null,
  attendeeOptions = [],
  onAttendeeChange,
  attendeePending = false,
}: BookingModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const locale = useDateLocale();
  const { bookClass, cancelClass, isBookingClass, isCancelingClass } = useMyBookings();
  const [confirmAction, setConfirmAction] = useState<BookingConfirmAction | null>(null);
  const [companionFieldError, setCompanionFieldError] = useState<string | null>(null);
  const companionForm = useForm<{ companion_email: string }>({
    defaultValues: { companion_email: '' },
  });
  const {
    bookings: sessionBookings,
    subscriptions: sessionSubscriptions,
    isTrialEligible: sessionTrialEligible,
    isLoadingSubscriptions,
  } = useStudentSession();
  const myBookings = sessionBookings;
  const familyMode = attendeeOptions.length > 0;
  const bookingForOther = Boolean(attendeeUserId && user?.id && attendeeUserId !== String(user.id));
  const [payerSubscriptions, setPayerSubscriptions] = useState<Array<ActiveSubscription> | null>(null);
  const [payerTrialEligible, setPayerTrialEligible] = useState(false);
  const [payerFailed, setPayerFailed] = useState(false);
  const [attendeeBookings, setAttendeeBookings] = useState<Array<MyBooking> | null>(null);
  const [attendeeBookingsFailed, setAttendeeBookingsFailed] = useState(false);

  useEffect(() => {
    if (!isOpen || !bookingForOther || !attendeeUserId) {
      setPayerFailed(false);
      setPayerSubscriptions(null);

      return;
    }

    let cancelled = false;

    setPayerFailed(false);
    setPayerSubscriptions(null);

    void DansshipAPI.family.getBookingPayer(attendeeUserId).then(result => {
      if (cancelled) {
        return;
      }

      if (!result.ok || !result.data) {
        setPayerFailed(true);
        setPayerSubscriptions([]);

        return;
      }

      setPayerTrialEligible(result.data.trial_eligible);
      setPayerSubscriptions(
        result.data.subscriptions.map(item => ({
          id: item.id,
          plan_id: item.id,
          status: item.status === 'active' ? 'active' : 'expired',
          plan_name_snapshot: item.plan_name ?? '',
          class_count_snapshot: item.remaining_classes,
          price_snapshot: 0,
          expiration_policy_snapshot: '',
          remaining_classes: item.remaining_classes,
          bonus_classes_remaining: item.bonus_classes_remaining ?? 0,
          bonus_expires_at: item.bonus_expires_at,
          start_date: item.start_date ?? toColombiaDateKey(new Date()),
          expiration_date: item.expiration_date ?? item.start_date ?? toColombiaDateKey(new Date()),
          original_price: 0,
          final_price: 0,
        })),
      );
    });

    return () => {
      cancelled = true;
    };
  }, [attendeeUserId, bookingForOther, isOpen]);

  useEffect(() => {
    if (!isOpen || !bookingForOther || !attendeeUserId) {
      setAttendeeBookings(null);
      setAttendeeBookingsFailed(false);

      return;
    }

    let cancelled = false;

    setAttendeeBookingsFailed(false);
    setAttendeeBookings(null);

    void loadUpcomingBookings(attendeeUserId).then(result => {
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        setAttendeeBookingsFailed(true);
        setAttendeeBookings([]);

        return;
      }

      setAttendeeBookings(result.items);
    });

    return () => {
      cancelled = true;
    };
  }, [attendeeUserId, bookingForOther, isOpen]);

  const sessionResolvedSubscriptions = isAuthenticated
    ? sessionSubscriptions.length > 0
      ? sessionSubscriptions
      : subscriptions
    : subscriptions;
  const resolvedSubscriptions =
    bookingForOther && payerSubscriptions ? payerSubscriptions : sessionResolvedSubscriptions;
  const resolvedTrialEligible = bookingForOther
    ? payerTrialEligible
    : isAuthenticated
      ? sessionTrialEligible
      : isTrialEligible;
  const subscriptionsReady = bookingForOther
    ? payerSubscriptions !== null
    : !isAuthenticated || !isLoadingSubscriptions || resolvedSubscriptions.length > 0;

  useEffect(() => {
    companionForm.reset({ companion_email: '' });
    setCompanionFieldError(null);
  }, [selectedClass?.id, companionForm]);

  if (!selectedClass) return null;

  const isPast = isPastBookingDeadline(selectedClass.start_time);
  const isCancelled = Boolean(selectedClass.is_cancelled);
  const isFull = selectedClass.enrolled_count >= selectedClass.capacity;
  const isOwnClass = isOwnInstructedClass(selectedClass, user?.id);

  // Here we check if the user is already booked via the injected `user_booking_status` field.
  const attendeeBooking = bookingForOther
    ? attendeeBookings?.find(booking => booking.scheduled_class.id === selectedClass.id && booking.status === 'active')
    : undefined;
  const isBooked = bookingForOther ? Boolean(attendeeBooking) : selectedClass.user_booking_status === 'active';
  const activeBookingId = bookingForOther ? attendeeBooking?.id : selectedClass.user_booking_id;
  const activeBookingCancellable = bookingForOther
    ? attendeeBooking?.is_cancellable
    : selectedClass.user_booking_is_cancellable;
  const wouldRestoreCredit = bookingForOther
    ? attendeeBooking?.would_restore_credit
    : selectedClass.user_booking_would_restore_credit;
  const attendeeBookingsReady = !bookingForOther || attendeeBookings !== null;
  const familyDetailsFailed = bookingForOther && (payerFailed || attendeeBookingsFailed);

  const isLoading = isBookingClass || isCancelingClass;
  const selfBookings = myBookings.filter(booking => !user?.id || booking.user_id === String(user.id));
  const overlapBookings = bookingForOther ? (attendeeBookings ?? []) : selfBookings;

  const hasTimeOverlap = overlapBookings.some(booking => {
    if (!booking.scheduled_class || booking.scheduled_class.id === selectedClass.id) return false;

    if (booking.status === 'cancelled') return false;

    const bookedStart = new Date(booking.scheduled_class.start_time).getTime();
    const bookedEnd = new Date(booking.scheduled_class.end_time).getTime();
    const classStart = new Date(selectedClass.start_time).getTime();
    const classEnd = new Date(selectedClass.end_time).getTime();

    return classStart < bookedEnd && bookedStart < classEnd;
  });

  const handleBook = async () => {
    if (attendeePending) {
      return;
    }

    const companionEmail = companionForm.getValues('companion_email').trim();

    if (companionEmail && user?.email && companionEmail.toLowerCase() === user.email.trim().toLowerCase()) {
      setCompanionFieldError(t('bookings:companionSelfReference'));

      return;
    }

    setCompanionFieldError(null);
    const result = await bookClass({
      scheduled_class_id: selectedClass.id,
      companion_email: bookingForOther ? undefined : companionEmail || undefined,
      attendee_user_id: attendeeUserId ?? undefined,
    });

    if (!result.ok) {
      if (result.errorCode === DANSSHIP_ERROR_CODE.TWO_FOR_ONE_COMPANION_NOT_FOUND) {
        setCompanionFieldError(t('bookings:companionNotFound'));
      } else if (result.errorCode === DANSSHIP_ERROR_CODE.TWO_FOR_ONE_SELF_REFERENCE) {
        setCompanionFieldError(t('bookings:companionSelfReference'));
      }

      return;
    }

    await onBookingChange?.();
    onClose();
  };

  const handleConfirmCancel = async () => {
    if (!activeBookingId) return;

    const ok = await cancelClass(activeBookingId);

    if (ok) {
      setConfirmAction(null);
      await onBookingChange?.();
      onClose();
    }
  };

  const handleBuyPlan = () => {
    onClose();
    navigate(PageURLS.profile.subscription);
  };

  const handleInstructorClick = () => {
    if (!selectedClass.instructor?.id) return;

    onClose();
    navigate(PageURLS.profile.user(selectedClass.instructor.id));
  };

  const paidEligibility = getClassBookingEligibility(resolvedSubscriptions, selectedClass.start_time, false);
  const eligibility =
    familyMode && paidEligibility.status !== 'ok' && resolvedTrialEligible
      ? getClassBookingEligibility([], selectedClass.start_time, true)
      : familyMode
        ? paidEligibility
        : getClassBookingEligibility(resolvedSubscriptions, selectedClass.start_time, resolvedTrialEligible);
  const showSubscriptionWarning =
    subscriptionsReady &&
    eligibility.status === 'no_subscription' &&
    !isBooked &&
    !isPast &&
    !isCancelled &&
    !hasTimeOverlap &&
    !isOwnClass;
  const showNotStartedWarning =
    subscriptionsReady &&
    eligibility.status === 'not_started' &&
    !isBooked &&
    !isPast &&
    !isCancelled &&
    !hasTimeOverlap &&
    !isOwnClass;
  const showExpiredWarning =
    subscriptionsReady &&
    eligibility.status === 'expired' &&
    !isBooked &&
    !isPast &&
    !isCancelled &&
    !hasTimeOverlap &&
    !isOwnClass;
  const showTrialNote = Boolean(
    subscriptionsReady && eligibility.status === 'trial' && !isBooked && !isPast && !isCancelled && !isOwnClass,
  );
  const paidPlanCoversClass = hasPaidPlanCoveringClass(resolvedSubscriptions, selectedClass.start_time);
  const showThursday2x1Note = Boolean(
    subscriptionsReady &&
    selectedClass.two_for_one_eligible &&
    paidPlanCoversClass &&
    !isBooked &&
    !isPast &&
    !isCancelled &&
    !isOwnClass,
  );
  const showCompanionField = Boolean(showThursday2x1Note && !isFull && !hasTimeOverlap && !bookingForOther);

  return (
    <>
      <AsideModal
        isOpen={isOpen}
        onClose={onClose}
        position='right'
        size='600px'
        contentClassName='p-0 h-full overflow-auto grid grid-rows-[auto_1fr]'
      >
        <img
          src={selectedClass.room?.image_url || DEFAULT_ROOM_IMAGE}
          alt='Room class'
          className='aspect-16/8 object-cover [@media(min-height:1000px)]:aspect-16/10'
        />
        <section className='grid gap-4 grid-rows-[1fr_auto] h-full overflow-auto'>
          <section className='grid gap-4 pt-4 px-8 content-start'>
            <h3 className='text-center text-primary'>
              {selectedClass.class_definition?.name || t('bookings:classDefault')}
            </h3>
            {selectedClass.class_definition?.description ? (
              <p className='m-0 text-center text-sm text-muted-foreground whitespace-pre-wrap'>
                {selectedClass.class_definition.description}
              </p>
            ) : null}

            <section
              role={selectedClass.instructor?.id ? 'button' : undefined}
              tabIndex={selectedClass.instructor?.id ? 0 : undefined}
              onClick={selectedClass.instructor?.id ? handleInstructorClick : undefined}
              onKeyDown={
                selectedClass.instructor?.id
                  ? event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        handleInstructorClick();
                      }
                    }
                  : undefined
              }
              className={cn(
                'bg-secondary/20 px-8 py-8 xs:py-4 rounded-xl grid grid-flow-row xs:grid-flow-col justify-center xs:justify-between gap-4 xs:gap-8 items-center',
                selectedClass.instructor?.id && 'cursor-pointer hover:bg-secondary/30 transition-colors',
              )}
            >
              <section className='grid justify-items-center'>
                <ProfilePicture
                  className='size-20 border-primary border-2'
                  image={selectedClass.instructor?.photo_url || undefined}
                  alt={selectedClass.instructor?.full_name || t('bookings:instructorTBA')}
                  useAuthFallback={false}
                />
              </section>
              <section className='grid content-center text-center xs:text-right'>
                <p className='m-0 font-bold'>{selectedClass.instructor?.full_name || t('bookings:instructorTBA')}</p>
                <label className='m-0 whitespace-nowrap'>{t('bookings:instructor')}</label>
              </section>
            </section>

            <Container className='bg-secondary/20 py-4 grid grid-flow-col justify-between gap-8 items-center shadow-none'>
              <section className='grid'>
                <p className='m-0 font-bold'>
                  {toCapitalize(format(parseISO(selectedClass.start_time), 'EEEE', { locale }))}
                </p>
                <label className='m-0 whitespace-nowrap'>
                  {format(parseISO(selectedClass.start_time), 'MMMM d', { locale })}
                </label>
              </section>
              <section className='grid content-center text-right'>
                <p className='m-0 font-bold'>
                  {formatTimeDifference(selectedClass.end_time, selectedClass.start_time)}
                </p>
                <label className='m-0 whitespace-nowrap'>{t('bookings:duration')}</label>
              </section>
            </Container>

            <Container className='bg-secondary/20 py-4 grid grid-flow-col justify-between gap-8 items-center shadow-none'>
              <section className='grid'>
                <p className='m-0 font-bold'>{format(parseISO(selectedClass.start_time), 'h:mm a', { locale })}</p>
                <label className='m-0 whitespace-nowrap'>{t('bookings:startTime')}</label>
              </section>
              <section className='grid content-center text-right'>
                <p className='m-0 font-bold'>{format(parseISO(selectedClass.end_time), 'h:mm a', { locale })}</p>
                <label className='m-0 whitespace-nowrap'>{t('bookings:endTime')}</label>
              </section>
            </Container>

            <Container className='bg-secondary/20 py-4 grid grid-flow-col justify-between gap-8 items-center shadow-none'>
              <section className='grid'>
                <p className='m-0 font-bold'>
                  {isFull
                    ? `${t('bookings:spotsFull')}`
                    : `${selectedClass.enrolled_count} / ${selectedClass.capacity}`}
                </p>
                <label className='m-0 whitespace-nowrap'>{t('bookings:capacity')}</label>
              </section>
              <section className='grid content-center text-right'>
                <p className='m-0 font-bold'>{selectedClass.room?.name || t('bookings:roomTBA')}</p>
                <label className='m-0 whitespace-nowrap'>{t('bookings:room')}</label>
              </section>
            </Container>
          </section>

          <section className='grid gap-4 px-8 pb-4'>
            {showSubscriptionWarning && (
              <label className='bg-alert-50 p-3 rounded text-alert-800 border border-alert-200'>
                {t('bookings:noSubscriptionWarning')}
              </label>
            )}

            {showNotStartedWarning && eligibility.status === 'not_started' && (
              <label className='bg-alert-50 p-3 rounded text-alert-800 border border-alert-200'>
                {t('bookings:subscriptionNotStartedWarning', {
                  date: format(parseISO(eligibility.startDate), 'd MMM yyyy', { locale }),
                })}
              </label>
            )}

            {showExpiredWarning && eligibility.status === 'expired' && (
              <label className='bg-alert-50 p-3 rounded text-alert-800 border border-alert-200'>
                {t('bookings:subscriptionExpiredWarning', {
                  date: format(parseISO(`${toColombiaDateKey(eligibility.expirationDate)}T12:00:00`), 'd MMM yyyy', {
                    locale,
                  }),
                })}
              </label>
            )}

            {showTrialNote && (
              <label className='bg-primary/5 p-3 rounded text-primary border border-primary/20'>
                {bookingForOther && attendeeName
                  ? t('bookings:trialClassNoteNamed', { name: attendeeName })
                  : t('bookings:trialClassNote')}
              </label>
            )}

            {hasTimeOverlap && !isBooked && !isOwnClass && (
              <label className='bg-warning-50 p-3 rounded text-warning-800 border border-warning-200'>
                {bookingForOther ? t('bookings:timeOverlapWarningOther') : t('bookings:timeOverlapWarning')}
              </label>
            )}

            {isOwnClass && !isBooked && !isPast && !isCancelled && (
              <label className='bg-warning-50 p-3 rounded text-warning-800 border border-warning-200'>
                {t('bookings:ownClassWarning')}
              </label>
            )}

            {familyMode && attendeeUserId ? (
              <label className='grid gap-1 text-sm'>
                {t('family:bookFor')}
                <Select value={attendeeUserId} onValueChange={value => onAttendeeChange?.(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent
                    onMouseDown={event => event.stopPropagation()}
                    onPointerDown={event => event.stopPropagation()}
                  >
                    {attendeeOptions.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            ) : null}

            <section className='flex flex-col gap-2'>
              {showCompanionField ? (
                <>
                  <p className='m-0 rounded border border-primary/20 bg-primary/5 p-3 text-primary'>
                    {t('bookings:twoForOneNote')}
                  </p>
                  <EmailField
                    control={companionForm.control}
                    name='companion_email'
                    label={t('bookings:companionEmail')}
                    helperText={t('bookings:companionEmailHelper')}
                    errorMessage={companionFieldError ?? undefined}
                    disabled={isLoading}
                  />
                </>
              ) : null}
              {isCancelled ? (
                <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                  {t('bookings:classCancelledMessage')}
                </label>
              ) : isPast ? (
                <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                  {t('bookings:bookingWindowClosed')}
                </label>
              ) : attendeePending ? (
                <Button color='primary' isLoading>
                  {t('common:loading')}
                </Button>
              ) : familyDetailsFailed && !isBooked ? (
                <p className='m-0 rounded border border-gray-200 bg-gray-50 p-3 text-center text-gray-700'>
                  {t('family:bookingDetailsError')}
                </p>
              ) : !attendeeBookingsReady || (!isBooked && !subscriptionsReady) ? (
                <Button color='primary' isLoading>
                  {t('common:loading')}
                </Button>
              ) : isBooked ? (
                activeBookingCancellable === false ? (
                  <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                    {t('bookings:cancellationNotAllowed')}
                  </label>
                ) : (
                  <Button color='alert' onClick={() => setConfirmAction('cancel')} isLoading={isLoading}>
                    {isCancelingClass ? t('bookings:cancelling') : t('bookings:cancelBooking')}
                  </Button>
                )
              ) : isOwnClass ? (
                <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                  {t('bookings:ownClassBadge')}
                </label>
              ) : eligibility.status === 'no_subscription' || eligibility.status === 'expired' ? (
                <Button color='primary' onClick={handleBuyPlan}>
                  {t('bookings:buyPlan')}
                </Button>
              ) : eligibility.status === 'not_started' ? null : hasTimeOverlap ? null : isFull ? (
                <label className='bg-gray-50 p-3 rounded text-gray-700 border border-gray-200 text-center'>
                  {t('bookings:spotsFull')}
                </label>
              ) : (
                <Button color='primary' onClick={handleBook} isLoading={isLoading}>
                  {isBookingClass ? t('bookings:booking') : t('bookings:bookClass')}
                </Button>
              )}

              <Button color='primary' variant='text' onClick={onClose} isLoading={isLoading}>
                {t('common:close')}
              </Button>
            </section>
          </section>
        </section>
      </AsideModal>

      <ConfirmDialog
        elevated
        open={confirmAction !== null}
        onOpenChange={open => {
          if (!open) {
            setConfirmAction(null);
          }
        }}
        onConfirm={() => {
          if (confirmAction === 'cancel') {
            void handleConfirmCancel();
          }
        }}
        title={t('bookings:cancelBookingTitle')}
        description={
          wouldRestoreCredit === false ? (
            <>
              {t('bookings:cancelBookingConfirm')}{' '}
              <span className='font-bold'>{t('bookings:cancelBookingNotReimbursed')}</span>
            </>
          ) : wouldRestoreCredit === true ? (
            `${t('bookings:cancelBookingConfirm')} ${t('bookings:cancelBookingReimbursed')}`
          ) : (
            t('bookings:cancelBookingConfirm')
          )
        }
        confirmLabel={isLoading ? t('bookings:cancelling') : t('bookings:cancelBooking')}
        cancelLabel={t('common:keep')}
        confirmVariant='destructive'
        isLoading={isLoading}
      />
    </>
  );
}
