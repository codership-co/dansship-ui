import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@components/ui';
import { DansshipAPI, type MyBooking } from '@core/api';
import { useCallablePromise } from '@hooks';

interface AttendanceDialogProps {
  booking: MyBooking;
  /** The booking was marked absent: the correction needs a reason. */
  isCorrection: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

/** Marks an existing booking of a class that already happened as attended. */
export function AttendanceDialog({ booking, isCorrection, onOpenChange, onDone }: AttendanceDialogProps) {
  const { t } = useTranslation('assisted');
  const [reason, setReason] = useState('');
  const { call: adjust, isLoading } = useCallablePromise((reasonText: string) =>
    DansshipAPI.bookingsAdmin.adjustAttendance(booking.id, {
      status: 'attended',
      reason: reasonText.trim() || undefined,
    }),
  );
  const canSubmit = !isLoading && (!isCorrection || reason.trim().length > 0);

  const submit = async () => {
    const { ok } = await adjust(reason);

    if (!ok) {
      toast.error(t('errors.generic'));

      return;
    }

    toast.success(t('class.attendanceMarked'));
    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t(isCorrection ? 'class.correctAttendanceTitle' : 'class.markAttendanceTitle')}</DialogTitle>
          <DialogDescription>{booking.scheduled_class?.class_definition?.name}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-2'>
          <Label htmlFor='attendance-reason'>
            {t(isCorrection ? 'class.correctAttendanceReason' : 'class.reasonOptional')}
          </Label>
          <Textarea id='attendance-reason' value={reason} onChange={event => setReason(event.target.value)} />
        </div>
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button color='primary' variant='solid' type='button' disabled={!canSubmit} onClick={() => void submit()}>
            {t(isCorrection ? 'class.correctAttendance' : 'class.markAttendance')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
