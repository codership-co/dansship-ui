import { format, parseISO } from 'date-fns';
import { SubmitEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight, LuSearch } from 'react-icons/lu';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { type AdminBookClassPayload, DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { getMonday, getNextMonday, getPrevMonday } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

function AdminBookingsPage() {
  const { t } = useTranslation();
  const [emailInput, setEmailInput] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [selectedClassId, setSelectedClassId] = useState('');
  const [reason, setReason] = useState('');
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const { response: users, isLoading: isLoadingUsers } = usePromise(
    () => DansshipAPI.bookingsAdmin.searchUsers(emailQuery),
    emailQuery.length >= 3,
    [emailQuery],
  );

  const {
    response: classes,
    isLoading: isLoadingClasses,
    error: hasClassesError,
  } = usePromise(() => DansshipAPI.schedules.getPublishedClassesByRange(currentWeek, getNextMonday(currentWeek)));

  const { call: adminBookClassPromise, isLoading: isBooking } = useCallablePromise((payload: AdminBookClassPayload) =>
    DansshipAPI.bookingsAdmin.adminBookClass(payload),
  );

  const adminBookClass = useCallback(
    async (payload: AdminBookClassPayload) => {
      const { ok, error } = await adminBookClassPromise(payload);

      if (ok) {
        toast.success(t('admin:bookings.successTitle'));

        return true;
      }

      if (error instanceof DansshipAPIError) {
        const { error_code } = error.body;

        if (error_code === DANSSHIP_ERROR_CODE.BOOKING_CLASS_GROUP_NOT_COVERED) {
          toast.error(t('admin:bookings.classGroupNotCovered'));
        } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_STARTED) {
          toast.error(t('admin:bookings.subscriptionNotStarted'));
        } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_ELIGIBLE) {
          toast.error(t('admin:bookings.subscriptionNotEligible'));
        } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_TIME_OVERLAP) {
          toast.error(t('admin:bookings.timeOverlap'));
        } else if (
          error_code === DANSSHIP_ERROR_CODE.BOOKING_CLASS_FULL ||
          error_code === DANSSHIP_ERROR_CODE.CLASS_FULL
        ) {
          toast.error(t('admin:bookings.classFull'));
        } else {
          toast.error(t('admin:bookings.errorDescription'));
        }
      } else {
        toast.error(t('admin:bookings.errorDescription'));
      }

      return false;
    },
    [adminBookClassPromise, t],
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setEmailQuery(emailInput.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [emailInput]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);

    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedClass = useMemo(
    () => classes?.data?.find(scheduledClass => scheduledClass.id === selectedClassId),
    [classes, selectedClassId],
  );

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedUserId) {
      toast.error(t('admin:bookings.validationUser'));

      return;
    }

    if (!selectedClassId) {
      toast.error(t('admin:bookings.validationClass'));

      return;
    }

    const booked = await adminBookClass({
      user_id: selectedUserId,
      scheduled_class_id: selectedClassId,
      reason: reason.trim() ? reason.trim() : undefined,
    });

    if (!booked) {
      return;
    }

    setSelectedClassId('');
    setReason('');
  };

  const handleUserInputChange = (value: string) => {
    setEmailInput(value);
    setSelectedUserId('');
    setSelectedUserEmail('');
    setIsUserDropdownOpen(true);
  };

  const handleSelectUser = (userId: string, email: string) => {
    setSelectedUserId(userId);
    setSelectedUserEmail(email);
    setEmailInput(email);
    setIsUserDropdownOpen(false);
  };

  const shouldShowUserEmptyState = !isLoadingUsers && emailQuery.length >= 3 && (!users?.ok || users.data.length === 0);

  return (
    <div className='max-w-6xl mx-auto py-8 px-4 space-y-6 pt-20'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:bookings.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('admin:bookings.subtitle')}</p>
      </div>

      <div className='rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
        <form className='space-y-5' onSubmit={handleSubmit}>
          <div className='space-y-2' ref={userDropdownRef}>
            <Label htmlFor='admin-booking-email-search'>{t('admin:bookings.userSearchLabel')}</Label>
            <div className='relative'>
              <Input
                id='admin-booking-email-search'
                type='email'
                value={emailInput}
                onChange={event => handleUserInputChange(event.target.value)}
                onFocus={() => setIsUserDropdownOpen(true)}
                placeholder={t('admin:bookings.userSearchPlaceholder')}
              />
              <LuSearch className='pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400' />

              {isUserDropdownOpen && emailQuery.length >= 3 && (
                <div className='absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg'>
                  {isLoadingUsers ? (
                    <div className='flex items-center gap-2 px-3 py-2 text-sm text-gray-500'>
                      <SpinnerLoader className='h-4 w-4' />
                      <span>{t('admin:bookings.loadingUsers')}</span>
                    </div>
                  ) : shouldShowUserEmptyState ? (
                    <div className='px-3 py-2 text-sm text-gray-500'>{t('common:noUsersFound')}</div>
                  ) : (
                    <ul className='py-1'>
                      {users?.data?.map(user => (
                        <li key={user.id}>
                          <button
                            type='button'
                            className='w-full px-3 py-2 text-left text-sm hover:bg-purple-50'
                            onClick={() => handleSelectUser(user.id, user.email)}
                          >
                            {user.email}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            <p className='text-xs text-gray-500'>{t('admin:bookings.userSearchHint')}</p>
            {selectedUserId && (
              <p className='text-xs text-active-700'>
                {t('admin:bookings.userLabel')}: {selectedUserEmail}
              </p>
            )}
          </div>

          <div className='space-y-3'>
            <div className='grid grid-cols-[auto_1fr_auto] items-center gap-3'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setCurrentWeek(getPrevMonday(currentWeek))}
                aria-label={t('common:prevWeek')}
              >
                <LuChevronLeft className='h-4 w-4' />
              </Button>
              <div className='text-center font-semibold text-gray-800'>
                {t('schedules:weekOf')}
                {format(parseISO(currentWeek), 'MMM d, yyyy')}
              </div>
              <Button
                type='button'
                variant='outline'
                size='sm'
                onClick={() => setCurrentWeek(getNextMonday(currentWeek))}
                aria-label={t('common:nextWeek')}
              >
                <LuChevronRight className='h-4 w-4' />
              </Button>
            </div>

            <div className='space-y-2'>
              <Label>{t('admin:bookings.classLabel')}</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={isLoadingClasses || !classes?.ok || classes.data.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:bookings.classSelectPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {!classes?.ok || classes.data.length === 0 ? (
                    <SelectItem value='__no_classes__' disabled>
                      {t('admin:bookings.noClasses')}
                    </SelectItem>
                  ) : (
                    classes.data.map(scheduledClass => {
                      const name = scheduledClass.class_definition?.name ?? t('bookings:classDefault');
                      const start = format(new Date(scheduledClass.start_time), 'EEE HH:mm');
                      const end = format(new Date(scheduledClass.end_time), 'HH:mm');
                      const room = scheduledClass.room?.name ?? t('bookings:roomTBA');

                      return (
                        <SelectItem key={scheduledClass.id} value={scheduledClass.id}>
                          {`${name} - ${start}-${end} - ${room} (${scheduledClass.enrolled_count}/${scheduledClass.capacity})`}
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
              {isLoadingClasses && (
                <div className='flex items-center gap-2 text-xs text-gray-500'>
                  <SpinnerLoader className='h-3 w-3' />
                  <span>{t('admin:bookings.loadingClasses')}</span>
                </div>
              )}
              {!isLoadingClasses && (!classes?.ok || classes.data.length === 0) && (
                <p className='text-xs text-gray-500'>{t('admin:bookings.noClasses')}</p>
              )}
              {hasClassesError && <p className='text-xs text-alert-600'>{t('bookings:calendarLoadError')}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='admin-booking-reason'>{t('admin:bookings.reasonLabel')}</Label>
            <Textarea
              id='admin-booking-reason'
              value={reason}
              onChange={event => setReason(event.target.value)}
              placeholder={t('admin:bookings.reasonPlaceholder')}
              rows={3}
            />
          </div>

          {selectedClass && (
            <div className='rounded-md border border-blue-100 bg-blue-50 p-3 text-sm text-info-900'>
              {t('admin:bookings.selectedClassSummary', {
                className: selectedClass.class_definition?.name ?? t('bookings:classDefault'),
                enrolled: selectedClass.enrolled_count,
                capacity: selectedClass.capacity,
              })}
            </div>
          )}

          <Button type='submit' disabled={isBooking}>
            {isBooking ? t('admin:bookings.submitting') : t('admin:bookings.submit')}
          </Button>
        </form>
      </div>
    </div>
  );
}

export const SecureAdminBookingsPage = SecurityGuard(AdminBookingsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.bookings,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
