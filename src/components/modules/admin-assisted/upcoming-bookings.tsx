import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { apiErrorCode } from './assisted-errors';
import { CompanionChooser } from './companion-chooser';

import {
  Badge,
  Checkbox,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@components/ui';
import { useOrPermissions } from '@contexts';
import { type AssistedBookingItem, type CompanionInput, DansshipAPI } from '@core/api';
import { PERMISSION } from '@core/permissions';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

function CancelDialog({
  booking,
  onOpenChange,
  onDone,
}: {
  booking: AssistedBookingItem;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation('assisted');
  const canRefund = useOrPermissions([PERMISSION.CLASS_CREDIT_REFUND]);
  const [reason, setReason] = useState('');
  const [returnCredit, setReturnCredit] = useState(false);
  const { call: cancel, isLoading } = useCallablePromise(
    (payload: Parameters<typeof DansshipAPI.assistedAdmin.cancelBooking>[1]) =>
      DansshipAPI.assistedAdmin.cancelBooking(booking.id, payload),
  );

  const submit = async () => {
    const { ok, error } = await cancel({
      reason: reason.trim(),
      return_credit: returnCredit,
    });

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    toast.success(t('class.cancelDone'));
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('class.cancelTitle')}</DialogTitle>
          <DialogDescription>{booking.class_name}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          {booking.has_companion ? <p className='text-sm text-warning'>{t('class.cancelCascades')}</p> : null}
          <div className='grid gap-2'>
            <Label htmlFor='cancel-reason'>{t('class.cancelReason')}</Label>
            <Textarea id='cancel-reason' value={reason} onChange={event => setReason(event.target.value)} />
          </div>
          {booking.can_return_credit && canRefund ? (
            <div className='flex items-start gap-2'>
              <Checkbox
                id='cancel-return-credit'
                checked={returnCredit}
                onCheckedChange={value => setReturnCredit(value === true)}
              />
              <Label htmlFor='cancel-return-credit' className='font-normal'>
                {t('class.returnCredit')}
              </Label>
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            color='alert'
            variant='solid'
            type='button'
            disabled={!reason.trim() || isLoading}
            onClick={() => void submit()}
          >
            {t('class.cancelAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddCompanionDialog({
  booking,
  userId,
  onOpenChange,
  onDone,
}: {
  booking: AssistedBookingItem;
  userId: string;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}) {
  const { t } = useTranslation('assisted');
  const [companion, setCompanion] = useState<CompanionInput | null>(null);
  const { call: add, isLoading } = useCallablePromise((input: CompanionInput) =>
    DansshipAPI.assistedAdmin.addCompanion(booking.id, input),
  );

  const submit = async () => {
    if (!companion) {
      return;
    }

    const { ok, error } = await add(companion);

    if (!ok) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    toast.success(t('class.companionAdded'));
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('class.addCompanionTitle')}</DialogTitle>
          <DialogDescription>
            {t('class.addCompanionHelp', {
              className: booking.class_name ?? '',
            })}
          </DialogDescription>
        </DialogHeader>
        <CompanionChooser onChange={setCompanion} excludeUserId={userId} />
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            color='primary'
            variant='solid'
            type='button'
            disabled={!companion || isLoading}
            onClick={() => void submit()}
          >
            {t('class.addCompanionAction')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UpcomingBookings({
  userId,
  personName,
  refreshKey,
}: {
  userId: string;
  personName: string;
  refreshKey: number;
}) {
  const { t } = useTranslation('assisted');
  const locale = useDateLocale();
  const canCancel = useOrPermissions([PERMISSION.BOOKING_CANCEL]);
  const { response, reFetch } = usePromise(() => DansshipAPI.assistedAdmin.listUpcomingBookings(userId), true, [
    userId,
    refreshKey,
  ]);
  const [cancelling, setCancelling] = useState<AssistedBookingItem | null>(null);
  const [addingTo, setAddingTo] = useState<AssistedBookingItem | null>(null);
  const bookings = response?.data ?? [];

  return (
    <section className='grid gap-3'>
      <h2 className='text-lg font-semibold'>{t('class.bookingsOf', { name: personName })}</h2>
      {bookings.length === 0 ? <p className='text-sm text-muted-foreground'>{t('class.noUpcoming')}</p> : null}
      <ul className='grid gap-2'>
        {bookings.map(booking => (
          <li
            key={booking.id}
            className='flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border p-3'
          >
            <div className='grid gap-1'>
              <span className='font-medium'>{booking.class_name}</span>
              <span className='text-sm text-muted-foreground'>
                {format(parseISO(booking.start_time), 'PPPp', { locale })}
              </span>
              <Badge variant='outline' size='small'>
                {t(`class.origin.${booking.origin}`)}
              </Badge>
            </div>
            <div className='flex flex-wrap gap-2'>
              {booking.origin === 'plan' && !booking.is_companion && !booking.has_companion ? (
                <Button color='primary' variant='outlined' size='small' onClick={() => setAddingTo(booking)}>
                  {t('class.addCompanion')}
                </Button>
              ) : null}
              {canCancel ? (
                <Button color='alert' variant='text' size='small' onClick={() => setCancelling(booking)}>
                  {t('class.cancelAction')}
                </Button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      {cancelling ? (
        <CancelDialog
          booking={cancelling}
          onOpenChange={open => !open && setCancelling(null)}
          onDone={() => void reFetch()}
        />
      ) : null}
      {addingTo ? (
        <AddCompanionDialog
          booking={addingTo}
          userId={userId}
          onOpenChange={open => !open && setAddingTo(null)}
          onDone={() => void reFetch()}
        />
      ) : null}
      <span className='sr-only'>{personName}</span>
    </section>
  );
}
