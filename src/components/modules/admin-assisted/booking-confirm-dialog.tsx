import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { apiErrorCode } from './assisted-errors';
import { CompanionChooser } from './companion-chooser';

import {
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
import { type CompanionInput, DansshipAPI, type PersonSearchResult, type PublishedClass } from '@core/api';
import { PERMISSION } from '@core/permissions';
import { useCallablePromise, useDateLocale } from '@hooks';

interface BookingConfirmDialogProps {
  person: PersonSearchResult;
  scheduledClass: PublishedClass;
  /** The class already took place: attendance is registered instead of a booking. */
  isHeld: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: () => void;
}

export function BookingConfirmDialog({
  person,
  scheduledClass,
  isHeld,
  onOpenChange,
  onDone,
}: BookingConfirmDialogProps) {
  const { t } = useTranslation('assisted');
  const locale = useDateLocale();
  const canGift = useOrPermissions([PERMISSION.CLASS_GIFT]);
  const [reason, setReason] = useState('');
  const [gift, setGift] = useState(false);
  const [withCompanion, setWithCompanion] = useState(false);
  const [companion, setCompanion] = useState<CompanionInput | null>(null);
  const { call: book, isLoading } = useCallablePromise(
    (payload: Parameters<typeof DansshipAPI.assistedAdmin.book>[0]) => DansshipAPI.assistedAdmin.book(payload),
  );

  const start = parseISO(scheduledClass.start_time);
  const isTwoForOne = scheduledClass.two_for_one_eligible === true && !gift;
  const needsCompanion = withCompanion && isTwoForOne;
  const canSubmit = !isLoading && (!gift || reason.trim().length > 0) && (!needsCompanion || companion !== null);

  const submit = async () => {
    const { ok, data, error } = await book({
      user_id: person.id,
      scheduled_class_id: scheduledClass.id,
      reason: reason.trim() || undefined,
      as_attended: isHeld,
      gift,
      companion: needsCompanion && companion ? companion : undefined,
    });

    if (!ok || !data) {
      toast.error(
        t(`errors.${apiErrorCode(error)}`, {
          defaultValue: t('errors.generic'),
        }),
      );

      return;
    }

    if (data.companion_error_code) {
      toast.warning(
        t('class.companionFailed', {
          reason: t(`errors.${data.companion_error_code}`, {
            defaultValue: t('errors.generic'),
          }),
        }),
      );
    } else {
      toast.success(t(isHeld ? 'class.attendanceDone' : 'class.bookingDone'));
    }

    onDone();
    onOpenChange(false);
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t(isHeld ? 'class.confirmAttendance' : 'class.confirmBooking')}</DialogTitle>
          <DialogDescription>
            {t('class.summary', {
              person: person.full_name,
              className: scheduledClass.class_definition?.name ?? '',
              date: format(start, 'PPPP', { locale }),
              time: format(start, 'p', { locale }),
            })}
          </DialogDescription>
        </DialogHeader>
        <div className='grid gap-4'>
          <p className='text-sm text-muted-foreground'>{gift ? t('class.noCreditUsed') : t('class.planWillBeUsed')}</p>
          {canGift ? (
            <div className='flex items-start gap-2'>
              <Checkbox
                id='assisted-gift'
                checked={gift}
                onCheckedChange={value => {
                  setGift(value === true);
                  setWithCompanion(false);
                }}
              />
              <Label htmlFor='assisted-gift' className='font-normal'>
                {t('class.gift')}
              </Label>
            </div>
          ) : null}
          <div className='grid gap-2'>
            <Label htmlFor='assisted-reason'>{gift ? t('class.giftReason') : t('class.reasonOptional')}</Label>
            <Textarea id='assisted-reason' value={reason} onChange={event => setReason(event.target.value)} />
          </div>
          {isTwoForOne ? (
            <div className='grid gap-3'>
              <div className='flex items-start gap-2'>
                <Checkbox
                  id='assisted-companion'
                  checked={withCompanion}
                  onCheckedChange={value => setWithCompanion(value === true)}
                />
                <Label htmlFor='assisted-companion' className='font-normal'>
                  {t(isHeld ? 'class.cameWithCompanion' : 'class.goesWithCompanion')}
                </Label>
              </div>
              {withCompanion ? <CompanionChooser onChange={setCompanion} excludeUserId={person.id} /> : null}
            </div>
          ) : null}
        </div>
        <DialogFooter>
          <Button color='primary' variant='outlined' type='button' onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
          <Button color='primary' variant='solid' type='button' disabled={!canSubmit} onClick={() => void submit()}>
            {t(isHeld ? 'class.registerAttendance' : 'class.book')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
