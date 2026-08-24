import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Button, Input, Label } from '@components/ui';
import { useDateLocale } from '@hooks';

export type ReportDateRangeValue = {
  start: string;
  end: string;
};

type ReportDateRangeProps = {
  dateRange: ReportDateRangeValue;
  appliedDateRange: ReportDateRangeValue;
  onDateRangeChange: (next: ReportDateRangeValue) => void;
  onApply: () => void;
};

export function ReportDateRange({ dateRange, appliedDateRange, onDateRangeChange, onApply }: ReportDateRangeProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const isInvalidRange = dateRange.start > dateRange.end;
  const isUnchangedRange = dateRange.start === appliedDateRange.start && dateRange.end === appliedDateRange.end;

  return (
    <div className='bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3'>
      <div className='flex justify-between items-center'>
        <span className='text-gray-700 font-medium'>{t('reports:reportingRange')}</span>
        <span className='text-gray-900 font-bold bg-white px-3 py-1 rounded shadow-sm border border-gray-200'>
          {format(new Date(appliedDateRange.start), 'MMM d, yyyy', { locale })} —{' '}
          {format(new Date(appliedDateRange.end), 'MMM d, yyyy', { locale })}
        </span>
      </div>

      <div className='flex flex-col md:flex-row md:items-end gap-3'>
        <div className='space-y-1'>
          <Label htmlFor='report-start-date'>{t('reports:dateFrom')}</Label>
          <Input
            id='report-start-date'
            type='date'
            value={dateRange.start}
            max={dateRange.end}
            onChange={event => onDateRangeChange({ ...dateRange, start: event.target.value })}
          />
        </div>
        <div className='space-y-1'>
          <Label htmlFor='report-end-date'>{t('reports:dateTo')}</Label>
          <Input
            id='report-end-date'
            type='date'
            value={dateRange.end}
            min={dateRange.start}
            onChange={event => onDateRangeChange({ ...dateRange, end: event.target.value })}
          />
        </div>
        <Button type='button' onClick={onApply} disabled={isInvalidRange || isUnchangedRange}>
          {t('reports:applyDateRange')}
        </Button>
      </div>
      {isInvalidRange && <p className='text-sm text-alert-500'>{t('reports:invalidDateRange')}</p>}
    </div>
  );
}

export function formatMoney(value: string | number | undefined): string {
  const amount = typeof value === 'number' ? value : parseFloat(value ?? '0');
  const safe = Number.isFinite(amount) ? amount : 0;
  const negative = safe < 0;
  const absolute = Math.abs(safe);
  const [integerPart, fractionPart = '00'] = absolute.toFixed(2).split('.');
  const withThousands = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const formatted = fractionPart === '00' ? `$${withThousands}` : `$${withThousands},${fractionPart}`;

  return negative ? `-${formatted}` : formatted;
}
