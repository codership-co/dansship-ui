import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Textarea,
} from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useCallablePromise } from '@hooks';

interface RefundClassCreditsDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refundableCount: number;
  onRefunded: () => void;
}

export function RefundClassCreditsDialog({
  classId,
  open,
  onOpenChange,
  refundableCount,
  onRefunded,
}: RefundClassCreditsDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const { call: refundCredits, isLoading } = useCallablePromise((payload: { classId: string; reason: string }) =>
    DansshipAPI.bookingsAdmin.refundClassCredits(payload.classId, { reason: payload.reason }),
  );

  useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleConfirm = async () => {
    const trimmed = reason.trim();

    if (!trimmed) return;

    const { ok, data } = await refundCredits({ classId, reason: trimmed });

    if (!ok || !data) {
      toast.error(t('admin:roster.refundFailed'));

      return;
    }

    toast.success(t('admin:roster.refundSuccess', { count: data.restored_count }));
    onOpenChange(false);
    onRefunded();
  };

  return (
    <Dialog open={open} onOpenChange={nextOpen => !isLoading && onOpenChange(nextOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('admin:roster.refundTitle')}</DialogTitle>
          <DialogDescription>{t('admin:roster.refundDescription', { count: refundableCount })}</DialogDescription>
        </DialogHeader>
        <div className='grid gap-2'>
          <Label htmlFor='class-credit-refund-reason'>{t('admin:roster.refundReason')}</Label>
          <Textarea
            id='class-credit-refund-reason'
            value={reason}
            onChange={event => setReason(event.target.value)}
            placeholder={t('admin:roster.refundReasonPlaceholder')}
            rows={3}
          />
        </div>
        <DialogFooter>
          <Button type='button' variant='outline' disabled={isLoading} onClick={() => onOpenChange(false)}>
            {t('common:cancel')}
          </Button>
          <Button type='button' disabled={isLoading || reason.trim().length === 0} onClick={() => void handleConfirm()}>
            {isLoading ? t('admin:roster.refundSubmitting') : t('admin:roster.refundConfirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
