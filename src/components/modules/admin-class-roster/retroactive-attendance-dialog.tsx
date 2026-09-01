import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch, LuTriangleAlert } from 'react-icons/lu';
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
} from '@components/ui';
import { type AdminBookClassPayload, DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

interface RetroactiveAttendanceDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instructorPaymentDocumentIssued: boolean;
  rosterIsEmpty: boolean;
  onRegistered: () => void;
}

export function RetroactiveAttendanceDialog({
  classId,
  open,
  onOpenChange,
  instructorPaymentDocumentIssued,
  rosterIsEmpty,
  onRegistered,
}: RetroactiveAttendanceDialogProps) {
  const { t } = useTranslation();
  const [emailInput, setEmailInput] = useState('');
  const [emailQuery, setEmailQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedUserEmail, setSelectedUserEmail] = useState('');
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  const { response: users, isLoading: isLoadingUsers } = usePromise(
    () => DansshipAPI.bookingsAdmin.searchUsers(emailQuery),
    open && emailQuery.length >= 3,
    [emailQuery, open],
  );

  const { call: adminBookClassPromise, isLoading: isSubmitting } = useCallablePromise(
    (payload: AdminBookClassPayload) => DansshipAPI.bookingsAdmin.adminBookClass(payload),
  );

  useEffect(() => {
    if (!open) {
      setEmailInput('');
      setEmailQuery('');
      setSelectedUserId('');
      setSelectedUserEmail('');
      setIsUserDropdownOpen(false);
    }
  }, [open]);

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

  const handleConfirm = useCallback(async () => {
    if (!selectedUserId) {
      toast.error(t('admin:bookings.validationUser'));

      return;
    }

    const { ok, error } = await adminBookClassPromise({
      user_id: selectedUserId,
      scheduled_class_id: classId,
      as_attended: true,
    });

    if (ok) {
      toast.success(t('admin:roster.success'));
      onOpenChange(false);
      onRegistered();

      return;
    }

    if (error instanceof DansshipAPIError) {
      const { error_code } = error.body;

      if (error_code === DANSSHIP_ERROR_CODE.BOOKING_CLASS_GROUP_NOT_COVERED) {
        toast.error(t('admin:bookings.classGroupNotCovered'));
      } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_NOT_STARTED) {
        toast.error(t('admin:bookings.subscriptionNotStarted'));
      } else if (error_code === DANSSHIP_ERROR_CODE.BOOKING_SUBSCRIPTION_EXPIRED) {
        toast.error(t('admin:bookings.subscriptionExpired'));
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
  }, [adminBookClassPromise, classId, onOpenChange, onRegistered, selectedUserId, t]);

  const shouldShowUserEmptyState = !isLoadingUsers && emailQuery.length >= 3 && (!users?.ok || users.data.length === 0);

  return (
    <Dialog open={open} onOpenChange={nextOpen => !isSubmitting && onOpenChange(nextOpen)}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('admin:roster.dialogTitle')}</DialogTitle>
          <DialogDescription>{t('admin:roster.dialogDescription')}</DialogDescription>
        </DialogHeader>

        {instructorPaymentDocumentIssued ? (
          <div
            role='alert'
            className='flex gap-3 rounded-md border border-warning-200 bg-warning-50 px-3 py-3 text-sm text-warning-800'
          >
            <LuTriangleAlert className='mt-0.5 h-5 w-5 shrink-0' aria-hidden />
            <div className='grid gap-1'>
              <p className='font-semibold'>{t('admin:roster.cuentaWarningTitle')}</p>
              <p>{rosterIsEmpty ? t('admin:roster.cuentaWarningEmptyRoster') : t('admin:roster.cuentaWarningBody')}</p>
            </div>
          </div>
        ) : null}

        <div className='space-y-2' ref={userDropdownRef}>
          <Label htmlFor='retroactive-attendance-email-search'>{t('admin:bookings.userSearchLabel')}</Label>
          <div className='relative'>
            <Input
              id='retroactive-attendance-email-search'
              type='email'
              value={emailInput}
              onChange={event => handleUserInputChange(event.target.value)}
              onFocus={() => setIsUserDropdownOpen(true)}
              placeholder={t('admin:bookings.userSearchPlaceholder')}
              disabled={isSubmitting}
            />
            <LuSearch className='pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-gray-400' />

            {isUserDropdownOpen && emailQuery.length >= 3 ? (
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
            ) : null}
          </div>
          <p className='text-xs text-gray-500'>{t('admin:bookings.userSearchHint')}</p>
          {selectedUserId ? (
            <p className='text-xs text-active-700'>
              {t('admin:bookings.userLabel')}: {selectedUserEmail}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {t('common:cancel')}
          </Button>
          <Button type='button' onClick={() => void handleConfirm()} disabled={isSubmitting || !selectedUserId}>
            {isSubmitting ? t('admin:roster.submitting') : t('admin:roster.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
