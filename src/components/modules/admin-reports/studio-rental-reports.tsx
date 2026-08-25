import { format, subDays } from 'date-fns';
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
import { usePromise } from '@hooks';

export function StudioRentalReports() {
  const { t } = useTranslation();
  const initialDateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const deps = [appliedDateRange.start, appliedDateRange.end];

  const { response: revenueData, isLoading: revenueLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getStudioRentalRevenue(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: utilizationData, isLoading: utilizationLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getStudioRentalUtilization(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: funnelData, isLoading: funnelLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getStudioRentalFunnel(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: mixData, isLoading: mixLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getStudioRentalMix(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );

  const isLoading = revenueLoading || utilizationLoading || funnelLoading || mixLoading;
  const revenue = revenueData?.data;
  const utilization = utilizationData?.data;
  const funnel = funnelData?.data;
  const mixKindLabel = (kind: string) =>
    kind === 'one_off' ? t('reports:rentals.oneOff') : t('reports:rentals.series');

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
              <CardTitle className='text-lg text-gray-800'>{t('reports:rentals.revenueTitle')}</CardTitle>
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
              <CardTitle className='text-lg text-gray-800'>{t('reports:rentals.utilizationTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:filters.room')}</TableHead>
                    <TableHead className='text-right'>{t('reports:rentals.availableHours')}</TableHead>
                    <TableHead className='text-right'>{t('reports:rentals.bookedHours')}</TableHead>
                    <TableHead className='text-right'>{t('reports:rentals.utilizationRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(utilization?.items ?? []).map(row => (
                    <TableRow key={row.room_id}>
                      <TableCell>{row.room_name}</TableCell>
                      <TableCell className='text-right'>{row.available_hours.toFixed(1)}</TableCell>
                      <TableCell className='text-right'>{row.booked_hours.toFixed(1)}</TableCell>
                      <TableCell className='text-right font-semibold'>{row.utilization_rate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                  {utilization?.totals && (
                    <TableRow>
                      <TableCell className='font-semibold'>{utilization.totals.room_name}</TableCell>
                      <TableCell className='text-right font-semibold'>
                        {utilization.totals.available_hours.toFixed(1)}
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        {utilization.totals.booked_hours.toFixed(1)}
                      </TableCell>
                      <TableCell className='text-right font-semibold'>
                        {utilization.totals.utilization_rate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:rentals.funnelTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 p-4'>
              <FunnelTable
                title={t('reports:rentals.requests')}
                counts={funnel?.requests}
                rate={funnel?.request_confirmation_rate}
              />
              <FunnelTable
                title={t('reports:rentals.series')}
                counts={funnel?.series}
                rate={funnel?.series_confirmation_rate}
              />
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:rentals.mixTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:rentals.kind')}</TableHead>
                    <TableHead className='text-right'>{t('reports:gifts.count')}</TableHead>
                    <TableHead className='text-right'>{t('reports:rentals.listedPrice')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(mixData?.data?.items ?? []).map(row => (
                    <TableRow key={row.kind}>
                      <TableCell>{mixKindLabel(row.kind)}</TableCell>
                      <TableCell className='text-right'>{row.count}</TableCell>
                      <TableCell className='text-right'>{formatMoney(row.total_price)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function FunnelTable({
  title,
  counts,
  rate,
}: {
  title: string;
  counts?: {
    pending_payment: number;
    on_hold?: number;
    confirmed: number;
    cancelled: number;
  };
  rate?: number;
}) {
  const { t } = useTranslation();

  return (
    <div className='space-y-2'>
      <h3 className='text-sm font-medium text-gray-800'>{title}</h3>
      <p className='text-sm text-gray-600'>
        {t('reports:rentals.confirmationRate')}: {(rate ?? 0).toFixed(1)}%
      </p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('reports:rentals.status')}</TableHead>
            <TableHead className='text-right'>{t('reports:gifts.count')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{t('reports:rentals.statuses.pending_payment')}</TableCell>
            <TableCell className='text-right'>{counts?.pending_payment ?? 0}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('reports:rentals.statuses.on_hold')}</TableCell>
            <TableCell className='text-right'>{counts?.on_hold ?? 0}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('reports:rentals.statuses.confirmed')}</TableCell>
            <TableCell className='text-right'>{counts?.confirmed ?? 0}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{t('reports:rentals.statuses.cancelled')}</TableCell>
            <TableCell className='text-right'>{counts?.cancelled ?? 0}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
