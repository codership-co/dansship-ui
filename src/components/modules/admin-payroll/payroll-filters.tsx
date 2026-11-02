import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown, LuDownload } from 'react-icons/lu';

import {
  Card,
  DatePicker,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import { toColombiaDateKey } from '@helpers';
import { useDateLocale } from '@hooks';

import type { PaymentDocumentStatus, PayrollDateField } from '@core/api';

export type PayrollStatusFilter = 'all' | PaymentDocumentStatus;

export interface PayrollFilterValues {
  q: string;
  status: PayrollStatusFilter;
  dateField: PayrollDateField;
  from: string;
  to: string;
}

const STATUSES: Array<PaymentDocumentStatus> = ['issued', 'confirmed', 'disputed', 'paid', 'voided'];
const DATE_FIELDS: Array<PayrollDateField> = ['issued', 'paid'];
const SEARCH_DEBOUNCE_MS = 300;

/** Defaults: everything, by issue date, from the first day of last month to today (Bogotá calendar days). */
export function getDefaultPayrollFilters(now: Date = new Date()): PayrollFilterValues {
  const today = toColombiaDateKey(now);
  const [year, month] = today.split('-').map(Number);

  return {
    q: '',
    status: 'all',
    dateField: 'issued',
    from: format(new Date(year, month - 2, 1), 'yyyy-MM-dd'),
    to: today,
  };
}

function isDefault(values: PayrollFilterValues, defaults: PayrollFilterValues) {
  return (
    values.q.trim() === defaults.q &&
    values.status === defaults.status &&
    values.dateField === defaults.dateField &&
    values.from === defaults.from &&
    values.to === defaults.to
  );
}

function toDate(value: string) {
  return value ? parseISO(value) : undefined;
}

function toDay(date: Date | undefined) {
  return date ? format(date, 'yyyy-MM-dd') : '';
}

interface PayrollFiltersProps {
  values: PayrollFilterValues;
  onChange: (values: PayrollFilterValues) => void;
  onExport: () => void;
  canExport: boolean;
  isExporting: boolean;
}

export function PayrollFilters({ values, onChange, onExport, canExport, isExporting }: PayrollFiltersProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(values.q);
  const defaults = getDefaultPayrollFilters();
  const hasChanges = !isDefault(values, defaults);

  useEffect(() => {
    setSearch(values.q);
  }, [values.q]);

  useEffect(() => {
    if (search === values.q) return;

    const timeout = setTimeout(() => onChange({ ...values, q: search }), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search, values, onChange]);

  const formatDay = (value: string) => (value ? format(parseISO(value), 'd MMM yyyy', { locale }) : '…');
  const summary = [
    values.status === 'all' ? t('admin:payroll.filters.allStatuses') : t(`admin:payroll.status.${values.status}`),
    `${t(`admin:payroll.filters.summaryDate.${values.dateField}`)}: ${formatDay(values.from)} – ${formatDay(values.to)}`,
    ...(values.q.trim() ? [`“${values.q.trim()}”`] : []),
  ].join(' · ');

  return (
    <Card className='gap-4 border-border bg-background-paper p-4'>
      <div className='flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between'>
        <button
          type='button'
          className='flex min-w-0 flex-1 items-center gap-3 text-left'
          aria-expanded={isOpen}
          aria-label={t('admin:payroll.filters.toggle')}
          onClick={() => setIsOpen(open => !open)}
        >
          <LuChevronDown
            className={`size-5 shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
          <span className='grid min-w-0'>
            <span className='font-semibold'>{t('admin:payroll.filters.title')}</span>
            <span className='truncate text-sm text-muted-foreground'>{summary}</span>
          </span>
        </button>
        <Button
          color='primary'
          variant='solid'
          type='button'
          className='w-full @3xl:w-auto'
          onClick={onExport}
          disabled={!canExport || isExporting}
          isLoading={isExporting}
        >
          <LuDownload className='size-4' />
          {t('admin:payroll.export.button')}
        </Button>
      </div>

      {isOpen ? (
        <div className='grid gap-4'>
          <div className='grid grid-cols-2 gap-3 @3xl:grid-cols-5'>
            <div className='col-span-2 grid gap-1.5 @3xl:col-span-1'>
              <Label htmlFor='payroll-person'>{t('admin:payroll.filters.person')}</Label>
              <Input
                id='payroll-person'
                value={search}
                placeholder={t('admin:payroll.filters.personPlaceholder')}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:payroll.filters.status')}</Label>
              <Select
                value={values.status}
                onValueChange={value => onChange({ ...values, status: value as PayrollStatusFilter })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('admin:payroll.filters.allStatuses')}</SelectItem>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(`admin:payroll.status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:payroll.filters.dateBy')}</Label>
              <Select
                value={values.dateField}
                onValueChange={value => onChange({ ...values, dateField: value as PayrollDateField })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DATE_FIELDS.map(field => (
                    <SelectItem key={field} value={field}>
                      {t(`admin:payroll.filters.dateFields.${field}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:payroll.filters.from')}</Label>
              <DatePicker
                boundary='local'
                date={toDate(values.from)}
                dateFormat='d MMM yyyy'
                placeholder={t('admin:payroll.filters.pickDate')}
                onDateChange={date => onChange({ ...values, from: toDay(date) })}
              />
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:payroll.filters.to')}</Label>
              <DatePicker
                boundary='local'
                date={toDate(values.to)}
                dateFormat='d MMM yyyy'
                placeholder={t('admin:payroll.filters.pickDate')}
                onDateChange={date => onChange({ ...values, to: toDay(date) })}
              />
            </div>
          </div>

          {values.dateField === 'paid' && (values.from || values.to) ? (
            <p className='m-0 text-sm text-muted-foreground'>{t('admin:payroll.filters.paidRangeHint')}</p>
          ) : null}

          {hasChanges ? (
            <div>
              <Button color='primary' variant='text' type='button' onClick={() => onChange(defaults)}>
                {t('admin:payroll.filters.reset')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
