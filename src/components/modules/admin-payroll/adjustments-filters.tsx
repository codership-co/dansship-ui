import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronDown } from 'react-icons/lu';

import { buildMonthKeys, formatMonthLabel, parseMonthKey } from './adjustment-months';

import { Card, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { useDateLocale } from '@hooks';

import type { PayrollAdjustmentStatus, PayrollAdjustmentType } from '@core/api';

export interface AdjustmentFilterValues {
  q: string;
  type: 'all' | PayrollAdjustmentType;
  status: 'all' | PayrollAdjustmentStatus;
  /** YYYY-MM or 'all' */
  month: string;
}

const SEARCH_DEBOUNCE_MS = 300;
const TYPES: Array<PayrollAdjustmentType> = ['extra', 'advance'];
const STATUSES: Array<PayrollAdjustmentStatus> = ['pending', 'applied'];

export function getDefaultAdjustmentFilters(): AdjustmentFilterValues {
  return { q: '', type: 'all', status: 'all', month: 'all' };
}

function isDefault(values: AdjustmentFilterValues) {
  const defaults = getDefaultAdjustmentFilters();

  return (
    values.q.trim() === defaults.q &&
    values.type === defaults.type &&
    values.status === defaults.status &&
    values.month === defaults.month
  );
}

interface AdjustmentsFiltersProps {
  values: AdjustmentFilterValues;
  onChange: (values: AdjustmentFilterValues) => void;
}

export function AdjustmentsFilters({ values, onChange }: AdjustmentsFiltersProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(values.q);
  const monthKeys = buildMonthKeys();
  const monthLabel = (key: string) => {
    const { year, month } = parseMonthKey(key);

    return formatMonthLabel(year, month, locale);
  };
  const monthOptions =
    values.month !== 'all' && !monthKeys.includes(values.month) ? [...monthKeys, values.month] : monthKeys;

  useEffect(() => {
    setSearch(values.q);
  }, [values.q]);

  useEffect(() => {
    if (search === values.q) return;

    const timeout = setTimeout(() => onChange({ ...values, q: search }), SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [search, values, onChange]);

  const summary = [
    values.type === 'all'
      ? t('admin:payroll.adjustments.filters.allTypes')
      : t(`admin:payroll.adjustments.types.${values.type}`),
    values.status === 'all'
      ? t('admin:payroll.adjustments.filters.allStatuses')
      : t(`admin:payroll.adjustments.status.${values.status}`),
    values.month === 'all' ? t('admin:payroll.adjustments.filters.pickMonth') : monthLabel(values.month),
    ...(values.q.trim() ? [`“${values.q.trim()}”`] : []),
  ].join(' · ');

  return (
    <Card className='gap-4 border-border bg-background-paper p-4'>
      <button
        type='button'
        className='flex min-w-0 items-center gap-3 text-left'
        aria-expanded={isOpen}
        aria-label={t('admin:payroll.adjustments.filters.toggle')}
        onClick={() => setIsOpen(open => !open)}
      >
        <LuChevronDown className={`size-5 shrink-0 text-primary transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        <span className='grid min-w-0'>
          <span className='font-semibold'>{t('admin:payroll.adjustments.filters.title')}</span>
          <span className='truncate text-sm text-muted-foreground'>{summary}</span>
        </span>
      </button>

      {isOpen ? (
        <div className='grid gap-4'>
          <div className='grid grid-cols-2 gap-3 @3xl:grid-cols-4'>
            <div className='col-span-2 grid gap-1.5 @3xl:col-span-1'>
              <Label htmlFor='adjustments-person'>{t('admin:payroll.adjustments.filters.person')}</Label>
              <Input
                id='adjustments-person'
                value={search}
                placeholder={t('admin:payroll.adjustments.filters.personPlaceholder')}
                onChange={event => setSearch(event.target.value)}
              />
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:payroll.adjustments.filters.type')}</Label>
              <Select
                value={values.type}
                onValueChange={value => onChange({ ...values, type: value as AdjustmentFilterValues['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('admin:payroll.adjustments.filters.allTypes')}</SelectItem>
                  {TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {t(`admin:payroll.adjustments.types.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:payroll.adjustments.filters.status')}</Label>
              <Select
                value={values.status}
                onValueChange={value => onChange({ ...values, status: value as AdjustmentFilterValues['status'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('admin:payroll.adjustments.filters.allStatuses')}</SelectItem>
                  {STATUSES.map(status => (
                    <SelectItem key={status} value={status}>
                      {t(`admin:payroll.adjustments.status.${status}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='grid gap-1.5'>
              <Label>{t('admin:payroll.adjustments.filters.month')}</Label>
              <Select value={values.month} onValueChange={value => onChange({ ...values, month: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>{t('admin:payroll.adjustments.filters.pickMonth')}</SelectItem>
                  {monthOptions.map(key => (
                    <SelectItem key={key} value={key}>
                      {monthLabel(key)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!isDefault(values) ? (
            <div>
              <Button
                color='primary'
                variant='text'
                type='button'
                onClick={() => onChange(getDefaultAdjustmentFilters())}
              >
                {t('admin:payroll.adjustments.filters.reset')}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
}
