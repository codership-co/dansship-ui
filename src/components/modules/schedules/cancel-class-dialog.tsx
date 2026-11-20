import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog, DialogContent, DialogHeader, DialogTitle, Label } from '@components/ui';

const CANCELLATION_NOTE_MAX_LENGTH = 2000;

interface CancelClassDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (cancellationNote: string | null) => Promise<void> | void;
  isCancelling?: boolean;
  /** The class already happened: warn about the side effects and require a reason. */
  isPastClass?: boolean;
}

export function CancelClassDialog({
  open,
  onOpenChange,
  onConfirm,
  isCancelling = false,
  isPastClass = false,
}: CancelClassDialogProps) {
  const { t } = useTranslation();
  const [cancellationNote, setCancellationNote] = useState('');
  const trimmedNote = cancellationNote.trim();
  const isNoteMissing = isPastClass && trimmedNote === '';

  useEffect(() => {
    if (!open) setCancellationNote('');
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>{t('schedules:cancelClassTitle')}</DialogTitle>
        </DialogHeader>
        {isPastClass ? (
          <p className='rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900'>
            {t('schedules:cancelPastClassWarning')}
          </p>
        ) : (
          <p className='text-sm text-muted-foreground'>{t('schedules:cancelClassConfirm')}</p>
        )}
        <div className='space-y-2'>
          <Label htmlFor='cancellation_note'>
            {isPastClass ? t('schedules:cancellationNoteRequiredLabel') : t('schedules:cancellationNoteLabel')}
          </Label>
          <textarea
            id='cancellation_note'
            className='flex min-h-24 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring'
            placeholder={
              isPastClass
                ? t('schedules:cancellationNoteRequiredPlaceholder')
                : t('schedules:cancellationNotePlaceholder')
            }
            value={cancellationNote}
            onChange={event => setCancellationNote(event.target.value)}
            maxLength={CANCELLATION_NOTE_MAX_LENGTH}
            required={isPastClass}
            disabled={isCancelling}
          />
          <p className='text-xs text-gray-500'>{t('schedules:cancellationNoteHelp')}</p>
        </div>
        <div className='flex justify-end gap-2 pt-2'>
          <Button
            color='primary'
            variant='outlined'
            type='button'
            onClick={() => onOpenChange(false)}
            disabled={isCancelling}
          >
            {t('common:keep')}
          </Button>
          <Button
            color='alert'
            variant='solid'
            type='button'
            onClick={() => void onConfirm(trimmedNote || null)}
            disabled={isCancelling || isNoteMissing}
          >
            {isCancelling ? t('common:deleting') : t('schedules:cancelClassBtn')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
