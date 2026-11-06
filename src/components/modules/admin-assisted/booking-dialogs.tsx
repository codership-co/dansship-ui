import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { apiErrorCode } from './assisted-errors';
import { CompanionChooser } from './companion-chooser';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Switch,
  Textarea,
} from '@components/ui';
import { useOrPermissions } from '@contexts';
import { type AssistedBookingItem, type CompanionInput, DansshipAPI } from '@core/api';
import { PERMISSION } from '@core/permissions';
import { useCallablePromise } from '@hooks';

export function CancelBookingDialog({
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
  const canReturnCredit = booking.can_return_credit && canRefund;
  // A plan booking cancelled by the academy gets its class back unless the admin says otherwise.
  const [returnCredit, setReturnCredit] = useState(canReturnCredit);
  const { call: cancel, isLoading } = useCallablePromise(
    (payload: Parameters<typeof DansshipAPI.assistedAdmin.cancelBooking>[1]) =>
      DansshipAPI.assistedAdmin.cancelBooking(booking.id, payload),
  );

  const submit = async () => {
    const { ok, error } = await cancel({
      reason: reason.trim(),
      return_credit: canReturnCredit && returnCredit,
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
          {canReturnCredit ? (
            <div className='flex items-start justify-between gap-4 rounded-xl border border-border p-3'>
              <Label htmlFor='cancel-return-credit' className='m-0 grid gap-1 font-normal'>
                <span className='font-medium'>{t('class.returnCredit')}</span>
                <span className='text-sm text-muted-foreground'>
                  {t(returnCredit ? 'class.creditWillReturn' : 'class.creditWillStay')}
                </span>
              </Label>
              <Switch id='cancel-return-credit' checked={returnCredit} onCheckedChange={setReturnCredit} />
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

export function AddCompanionDialog({
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

interface ReimburseDialogProps {
  booking: AssistedBookingItem;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

/** Gives the plan its class back after a cancellation, or for a class already held. */
export function ReimburseDialog({ booking, onOpenChange, onDone }: ReimburseDialogProps) {
  const { t } = useTranslation('assisted');
  const [reason, setReason] = useState('');
  const isHeld = booking.status === 'attended' || booking.status === 'no_show';
  const { call: reimburse, isLoading } = useCallablePromise((reasonText: string) =>
    DansshipAPI.assistedAdmin.reimburseBooking(booking.id, { reason: reasonText.trim() }),
  );

  const submit = async () => {
    const { ok, error } = await reimburse(reason);

    if (!ok) {
      toast.error(t(`errors.${apiErrorCode(error)}`, { defaultValue: t('errors.generic') }));

      return;
    }

    toast.success(t('class.reimburseDone'));
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('class.reimburseTitle')}</DialogTitle>
          <DialogDescription>{booking.class_name}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <p className='m-0 text-sm text-muted-foreground'>
            {t(isHeld ? 'class.reimburseHeldHelp' : 'class.reimburseCancelledHelp')}
          </p>
          <div className='grid gap-2'>
            <Label htmlFor='reimburse-reason'>{t('class.reimburseReason')}</Label>
            <Textarea id='reimburse-reason' value={reason} onChange={event => setReason(event.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button
            color='primary'
            variant='solid'
            type='button'
            disabled={!reason.trim() || isLoading}
            onClick={() => void submit()}
          >
            {t('class.reimburse')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
