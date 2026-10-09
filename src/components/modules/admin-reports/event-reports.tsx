import { format, parseISO, subDays } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { formatMoney, ReportDateRange } from '@components/modules/admin-reports/report-date-range';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

export function EventReports() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const initialDateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const [typeFilter, setTypeFilter] = useState('');
  const deps = [appliedDateRange.start, appliedDateRange.end, typeFilter];

  const { response: revenueData, isLoading: revenueLoading } = usePromise(
    () =>
      DansshipAPI.reportsAdmin.getEventRevenue(appliedDateRange.start, appliedDateRange.end, typeFilter || undefined),
    true,
    deps,
  );
  const { response: fillData, isLoading: fillLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getEventFill(appliedDateRange.start, appliedDateRange.end, typeFilter || undefined),
    true,
    deps,
  );

  const isLoading = revenueLoading || fillLoading;
  const revenue = revenueData?.data;
  const fill = fillData?.data;
  const offeringLabel = (kind: string) => (kind === 'combo' ? t('reports:events.combo') : t('reports:events.event'));
  const typeLabel = (value?: string | null) => {
    if (value === 'taller') return t('eventos:types.taller');

    if (value === 'clase_especial') return t('eventos:types.clase_especial');

    return '—';
  };

  return (
    <div className='space-y-8'>
      <div className='flex flex-wrap items-end justify-between gap-3'>
        <ReportDateRange
          dateRange={dateRange}
          appliedDateRange={appliedDateRange}
          onDateRangeChange={setDateRange}
          onApply={() => setAppliedDateRange(dateRange)}
        />
        <label className='grid gap-1 text-sm'>
          <span>{t('reports:events.eventType')}</span>
          <select
            className='h-10 rounded-md border border-input bg-background px-3'
            value={typeFilter}
            onChange={change => setTypeFilter(change.target.value)}
          >
            <option value=''>{t('reports:events.allTypes')}</option>
            <option value='taller'>{t('eventos:types.taller')}</option>
            <option value='clase_especial'>{t('eventos:types.clase_especial')}</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <div className='flex justify-center p-12'>
          <SpinnerLoader />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-8'>
          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:events.revenueTitle')}</CardTitle>
              <p className='m-0 text-sm text-muted-foreground'>{t('reports:events.revenueExcludesCollaboration')}</p>
            </CardHeader>
            <CardContent className='grid grid-cols-2 md:grid-cols-4 gap-2 p-4'>
              <Metric label={t('reports:cash.intents')} value={String(revenue?.totals.intent_count ?? 0)} />
              <Metric label={t('reports:cash.cashCollected')} value={formatMoney(revenue?.totals.cash_collected)} />
              <Metric label={t('reports:cash.walletApplied')} value={formatMoney(revenue?.totals.wallet_applied)} />
              <Metric label={t('reports:cash.recognized')} value={formatMoney(revenue?.totals.recognized_total)} />
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:events.byOfferingTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:events.offering')}</TableHead>
                    <TableHead>{t('reports:events.eventType')}</TableHead>
                    <TableHead>{t('reports:events.kind')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.intents')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.cashCollected')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.recognized')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(revenue?.by_offering ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className='text-center text-sm text-muted-foreground'>
                        {t('reports:events.emptyRevenue')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (revenue?.by_offering ?? []).map(row => (
                      <TableRow key={`${row.offering_type}-${row.offering_id}`}>
                        <TableCell>{row.offering_name}</TableCell>
                        <TableCell>{typeLabel(row.type)}</TableCell>
                        <TableCell>{offeringLabel(row.offering_type)}</TableCell>
                        <TableCell className='text-right'>{row.intent_count}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.cash_collected)}</TableCell>
                        <TableCell className='text-right font-semibold'>{formatMoney(row.recognized_total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:events.fillTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:events.event')}</TableHead>
                    <TableHead>{t('reports:events.eventType')}</TableHead>
                    <TableHead>{t('reports:events.when')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.enrolledCap')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.fillRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fill?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center text-sm text-muted-foreground'>
                        {t('reports:events.emptyFill')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (fill?.items ?? []).map(row => (
                      <TableRow key={row.event_id}>
                        <TableCell>
                          <span className='inline-flex items-center gap-2'>
                            {row.event_name}
                            {row.is_collaboration ? (
                              <Badge variant='outline'>{t('reports:events.collaborationBadge')}</Badge>
                            ) : null}
                          </span>
                        </TableCell>
                        <TableCell>{typeLabel(row.type)}</TableCell>
                        <TableCell>{format(parseISO(row.starts_at), 'MMM d, yyyy HH:mm', { locale })}</TableCell>
                        <TableCell className='text-right'>
                          {row.holding_registrations} / {row.capacity}
                        </TableCell>
                        <TableCell className='text-right font-semibold'>{row.fill_rate.toFixed(1)}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
      <p className='text-xs text-gray-500'>{label}</p>
      <p className='text-sm font-semibold text-gray-900'>{value}</p>
    </div>
  );
}
