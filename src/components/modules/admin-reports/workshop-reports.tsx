import { format, parseISO, subDays } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { formatMoney, ReportDateRange } from '@components/modules/admin-reports/report-date-range';
import {
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

export function WorkshopReports() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const initialDateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const deps = [appliedDateRange.start, appliedDateRange.end];

  const { response: revenueData, isLoading: revenueLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getWorkshopRevenue(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: fillData, isLoading: fillLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getWorkshopFill(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );

  const isLoading = revenueLoading || fillLoading;
  const revenue = revenueData?.data;
  const fill = fillData?.data;
  const offeringLabel = (kind: string) =>
    kind === 'combo' ? t('reports:workshops.combo') : t('reports:workshops.workshop');

  return (
    <div className='space-y-8'>
      <ReportDateRange
        dateRange={dateRange}
        appliedDateRange={appliedDateRange}
        onDateRangeChange={setDateRange}
        onApply={() => setAppliedDateRange(dateRange)}
      />

      {isLoading ? (
        <div className='flex justify-center p-12'>
          <SpinnerLoader />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-8'>
          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:workshops.revenueTitle')}</CardTitle>
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
              <CardTitle className='text-lg text-gray-800'>{t('reports:workshops.byOfferingTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:workshops.offering')}</TableHead>
                    <TableHead>{t('reports:workshops.kind')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.intents')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.cashCollected')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.recognized')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(revenue?.by_offering ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center text-sm text-muted-foreground'>
                        {t('reports:workshops.emptyRevenue')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (revenue?.by_offering ?? []).map(row => (
                      <TableRow key={`${row.offering_type}-${row.offering_id}`}>
                        <TableCell>{row.offering_name}</TableCell>
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
              <CardTitle className='text-lg text-gray-800'>{t('reports:workshops.fillTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:workshops.workshop')}</TableHead>
                    <TableHead>{t('reports:workshops.when')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.enrolledCap')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.fillRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(fill?.items ?? []).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className='text-center text-sm text-muted-foreground'>
                        {t('reports:workshops.emptyFill')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    (fill?.items ?? []).map(row => (
                      <TableRow key={row.workshop_id}>
                        <TableCell>{row.workshop_name}</TableCell>
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
