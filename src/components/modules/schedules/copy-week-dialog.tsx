import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
} from '@components/ui';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPIError,
  type CopyWeekResult,
  type ScheduleWeek,
  type WeekCopyConflict,
} from '@core/api';

interface CopyWeekDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeks: Array<ScheduleWeek>;
  destinationWeekStart: string;
  defaultSourceWeekId?: string;
  isLoading?: boolean;
  onConfirm: (sourceWeekId: string) => Promise<{
    ok: boolean;
    data: CopyWeekResult | null;
    error: DansshipAPIError | null;
  }>;
  onSuccess: (week: ScheduleWeek) => void;
}

function extractConflicts(error: DansshipAPIError | null): Array<WeekCopyConflict> {
  if (!error) {
    return [];
  }

  const details = error.body.details as unknown as {
    conflicting_classes?: Array<WeekCopyConflict>;
  };

  return details?.conflicting_classes ?? [];
}

export function CopyWeekDialog({
  open,
  onOpenChange,
  weeks,
  destinationWeekStart,
  defaultSourceWeekId,
  isLoading = false,
  onConfirm,
  onSuccess,
}: CopyWeekDialogProps) {
  const { t } = useTranslation();
  const [sourceWeekId, setSourceWeekId] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const [conflicts, setConflicts] = useState<Array<WeekCopyConflict>>([]);
  const [copyCompleted, setCopyCompleted] = useState(false);

  const selectableWeeks = useMemo(
    () =>
      [...weeks]
        .filter(week => week.week_start_date !== destinationWeekStart)
        .sort((a, b) => b.week_start_date.localeCompare(a.week_start_date)),
    [weeks, destinationWeekStart],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setConflicts([]);
    setCopyCompleted(false);
  }, [open]);

  useEffect(() => {
    if (!open || copyCompleted) {
      return;
    }

    const preferred =
      defaultSourceWeekId && selectableWeeks.some(week => week.id === defaultSourceWeekId)
        ? defaultSourceWeekId
        : (selectableWeeks[0]?.id ?? '');
    setSourceWeekId(preferred);
  }, [open, copyCompleted, defaultSourceWeekId, selectableWeeks]);

  const destinationLabel = useMemo(() => {
    try {
      return format(parseISO(destinationWeekStart), 'MMM d, yyyy');
    } catch {
      return destinationWeekStart;
    }
  }, [destinationWeekStart]);

  const handleConfirm = async () => {
    if (!sourceWeekId) {
      setErrorMessage(t('schedules:copyWeek.selectSourceRequired'));

      return;
    }

    setErrorMessage(null);
    setNoticeMessage(null);
    setConflicts([]);
    const result = await onConfirm(sourceWeekId);

    if (result.ok && result.data) {
      const skipped = result.data.skipped_classes ?? [];

      if (skipped.length > 0) {
        setConflicts(skipped);
        setNoticeMessage(t('schedules:copyWeek.partialIntro'));
        setCopyCompleted(true);
        onSuccess(result.data);

        return;
      }

      onOpenChange(false);
      onSuccess(result.data);

      return;
    }

    const apiError = result.error;
    const code = apiError?.body.error_code;

    if (code === DANSSHIP_ERROR_CODE.SCHEDULE_WEEK_COPY_DESTINATION_NOT_EMPTY) {
      setErrorMessage(t('schedules:copyWeek.destinationNotEmpty'));

      return;
    }

    if (code === DANSSHIP_ERROR_CODE.SCHEDULE_WEEK_COPY_CONFLICT) {
      setConflicts(extractConflicts(apiError));
      setErrorMessage(t('schedules:copyWeek.conflictIntro'));

      return;
    }

    if (code === DANSSHIP_ERROR_CODE.SCHEDULE_WEEK_COPY_EMPTY_SOURCE) {
      setErrorMessage(t('schedules:copyWeek.emptySource'));

      return;
    }

    if (code === DANSSHIP_ERROR_CODE.SCHEDULE_WEEK_COPY_AMBIGUOUS_SLOT) {
      setErrorMessage(t('schedules:copyWeek.ambiguousSlot'));

      return;
    }

    setErrorMessage(t('schedules:copyWeek.failed'));
  };

  const conflictTypeLabel = (conflictType: string) => {
    if (conflictType === 'instructor' || conflictType === 'instructor_schedule') {
      return t('schedules:copyWeek.conflictTypeInstructor');
    }

    if (conflictType === 'room') {
      return t('schedules:copyWeek.conflictTypeRoom');
    }

    return t('schedules:copyWeek.conflictTypeOccupancy');
  };

  const conflictList =
    conflicts.length > 0 ? (
      <ul className='mt-2 list-disc space-y-1 pl-5'>
        {conflicts.map(conflict => (
          <li key={`${conflict.source_class_id}-${conflict.conflict_type}-${conflict.start_time}`}>
            {t('schedules:copyWeek.conflictItem', {
              type: conflictTypeLabel(conflict.conflict_type),
              time: format(parseISO(conflict.start_time), 'MMM d, HH:mm'),
              message: conflict.message,
            })}
          </li>
        ))}
      </ul>
    ) : null;

  return (
    <Dialog
      open={open}
      onOpenChange={nextOpen => {
        if (isLoading && !nextOpen) {
          return;
        }

        onOpenChange(nextOpen);
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{t('schedules:copyWeek.title')}</DialogTitle>
          <DialogDescription>{t('schedules:copyWeek.description', { date: destinationLabel })}</DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-2'>
          <div className='space-y-2'>
            <Label htmlFor='copy-week-source'>{t('schedules:copyWeek.sourceLabel')}</Label>
            <select
              id='copy-week-source'
              className='border-input bg-background ring-offset-background focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
              value={sourceWeekId}
              onChange={event => setSourceWeekId(event.target.value)}
              disabled={isLoading || copyCompleted || selectableWeeks.length === 0}
            >
              {selectableWeeks.length === 0 ? (
                <option value=''>{t('schedules:copyWeek.noSourceWeeks')}</option>
              ) : (
                selectableWeeks.map(week => (
                  <option key={week.id} value={week.id}>
                    {format(parseISO(week.week_start_date), 'MMM d, yyyy')} ({week.status})
                  </option>
                ))
              )}
            </select>
          </div>

          {noticeMessage ? (
            <div className='rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900'>
              <p>{noticeMessage}</p>
              {conflictList}
            </div>
          ) : null}

          {errorMessage ? (
            <div className='rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800'>
              <p>{errorMessage}</p>
              {conflictList}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            color='primary'
            variant='outlined'
            type='button'
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('schedules:copyWeek.cancel')}
          </Button>
          <Button
            color='primary'
            variant='solid'
            type='button'
            onClick={() => {
              if (copyCompleted) {
                onOpenChange(false);

                return;
              }

              void handleConfirm();
            }}
            disabled={!copyCompleted && (isLoading || selectableWeeks.length === 0)}
          >
            {copyCompleted
              ? t('schedules:copyWeek.done')
              : isLoading
                ? t('schedules:copyWeek.copying')
                : t('schedules:copyWeek.confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
