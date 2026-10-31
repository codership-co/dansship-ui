import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals/confirm-dialog';
import {
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { useTwoForOneWeeks } from '@hooks';

import type { TwoForOneWeek, TwoForOneWeekStatus } from '@core/api';

type PendingChange = { kind: 'set'; week: TwoForOneWeek; promoDate: string } | { kind: 'clear'; week: TwoForOneWeek };

function bogotaToday(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(new Date());
}

function atBogotaNoon(isoDate: string): Date {
  return new Date(`${isoDate}T12:00:00-05:00`);
}

function weekDates(weekStart: string): Array<string> {
  const [year, month, day] = weekStart.split('-').map(Number);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(year, month - 1, day + index));

    return date.toISOString().slice(0, 10);
  });
}

function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    timeZone: 'America/Bogota',
  }).format(atBogotaNoon(isoDate));
}

function formatRange(start: string, end: string): string {
  const format = new Intl.DateTimeFormat('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Bogota',
  });

  return `${format.format(atBogotaNoon(start))} – ${format.format(atBogotaNoon(end))}`;
}

export function TwoForOneWeeksPanel() {
  const { t } = useTranslation();
  const { weeks, isLoading, isSaving, setDay, clearDay } = useTwoForOneWeeks();
  const [pending, setPending] = useState<PendingChange | null>(null);
  const today = bogotaToday();

  const confirm = async () => {
    if (pending === null) {
      return;
    }

    const ok =
      pending.kind === 'set' ? await setDay(pending.week.id, pending.promoDate) : await clearDay(pending.week.id);

    if (ok) {
      setPending(null);
    }
  };

  if (isLoading && weeks.length === 0) {
    return <SpinnerLoader />;
  }

  return (
    <div className='space-y-3 border-t border-gray-100 pt-6'>
      <p className='text-sm text-gray-500'>{t('admin:inventory.promotionsPanel.weeks.hint')}</p>
      {weeks.length === 0 ? (
        <p className='text-sm text-gray-500'>{t('admin:inventory.promotionsPanel.weeks.empty')}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('admin:inventory.promotionsPanel.weeks.day')}</TableHead>
              <TableHead>{t('admin:inventory.promotionsPanel.active')}</TableHead>
              <TableHead />
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeks.map(week => (
              <TableRow key={week.id}>
                <TableCell>
                  <div className='font-medium text-gray-900'>
                    {formatRange(week.week_start_date, week.week_end_date)}
                  </div>
                  {week.locked ? (
                    <p className='text-xs text-gray-500'>{t('admin:inventory.promotionsPanel.weeks.locked')}</p>
                  ) : null}
                </TableCell>
                <TableCell>
                  <Badge variant='outline' size='small'>
                    {t(`admin:inventory.promotionsPanel.weeks.status.${week.status as TwoForOneWeekStatus}`)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    key={`${week.id}:${week.promo_date ?? 'none'}`}
                    value={week.promo_date ?? undefined}
                    disabled={week.locked || isSaving}
                    onValueChange={promoDate => setPending({ kind: 'set', week, promoDate })}
                  >
                    <SelectTrigger aria-label={t('admin:inventory.promotionsPanel.weeks.day')}>
                      <SelectValue placeholder={t('admin:inventory.promotionsPanel.weeks.none')} />
                    </SelectTrigger>
                    <SelectContent>
                      {weekDates(week.week_start_date).map(day => (
                        <SelectItem key={day} value={day} disabled={day < today}>
                          {formatDay(day)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    color='primary'
                    variant='text'
                    size='small'
                    type='button'
                    disabled={week.locked || isSaving || week.promo_date === null}
                    onClick={() => setPending({ kind: 'clear', week })}
                  >
                    {t('admin:inventory.promotionsPanel.weeks.clear')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <ConfirmDialog
        open={pending !== null}
        onOpenChange={open => {
          if (!open) {
            setPending(null);
          }
        }}
        onConfirm={() => void confirm()}
        title={t(
          pending?.kind === 'clear'
            ? 'admin:inventory.promotionsPanel.weeks.confirmClearTitle'
            : 'admin:inventory.promotionsPanel.weeks.confirmSetTitle',
        )}
        description={
          pending?.kind === 'set'
            ? t('admin:inventory.promotionsPanel.weeks.confirmSetDescription', {
                date: formatDay(pending.promoDate),
              })
            : t('admin:inventory.promotionsPanel.weeks.confirmClearDescription')
        }
        confirmLabel={t('admin:inventory.promotionsPanel.weeks.confirm')}
        cancelLabel={t('admin:inventory.promotionsPanel.weeks.cancel')}
        isLoading={isSaving}
      />
    </div>
  );
}
