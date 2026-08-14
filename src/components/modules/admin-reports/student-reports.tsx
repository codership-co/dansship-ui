import { format, subDays } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { ReportDateRange } from '@components/modules/admin-reports/report-date-range';
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

export function StudentReports() {
  const { t } = useTranslation();
  const initialDateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const deps = [appliedDateRange.start, appliedDateRange.end];

  const { response: activeData, isLoading: activeLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getActiveStudents(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: acquisitionData, isLoading: acquisitionLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getAcquisition(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: renewalData, isLoading: renewalLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getRenewalChurn(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: conversionData, isLoading: conversionLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getTrialConversion(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: usageData, isLoading: usageLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getSubscriptionUsage(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );

  const isLoading = activeLoading || acquisitionLoading || renewalLoading || conversionLoading || usageLoading;
  const conversion = conversionData?.data;
  const usage = usageData?.data;

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
              <CardTitle className='text-lg text-gray-800'>{t('reports:students.activeTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:attendance.week')}</TableHead>
                    <TableHead className='text-right'>{t('reports:students.uniqueStudents')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(activeData?.data?.trend ?? []).length === 0 ? (
                    <EmptyRow cols={2} />
                  ) : (
                    activeData?.data?.trend.map(row => (
                      <TableRow key={row.week}>
                        <TableCell>{row.week}</TableCell>
                        <TableCell className='text-right'>{row.unique_students}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:students.acquisitionTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:attendance.week')}</TableHead>
                    <TableHead className='text-right'>{t('reports:students.trialStudents')}</TableHead>
                    <TableHead className='text-right'>{t('reports:students.payingStudents')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(acquisitionData?.data?.trend ?? []).length === 0 ? (
                    <EmptyRow cols={3} />
                  ) : (
                    acquisitionData?.data?.trend.map(row => (
                      <TableRow key={row.week}>
                        <TableCell>{row.week}</TableCell>
                        <TableCell className='text-right'>{row.trial_students}</TableCell>
                        <TableCell className='text-right'>{row.paying_students}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:students.renewalTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:attendance.week')}</TableHead>
                    <TableHead className='text-right'>{t('reports:students.renewals')}</TableHead>
                    <TableHead className='text-right'>{t('reports:students.churned')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(renewalData?.data?.trend ?? []).length === 0 ? (
                    <EmptyRow cols={3} />
                  ) : (
                    renewalData?.data?.trend.map(row => (
                      <TableRow key={row.week}>
                        <TableCell>{row.week}</TableCell>
                        <TableCell className='text-right text-active-600'>{row.renewals}</TableCell>
                        <TableCell className='text-right text-alert-500'>{row.churned}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:students.conversionTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-3 gap-2 p-4'>
              <Metric label={t('reports:students.trialStudents')} value={String(conversion?.trial_students ?? 0)} />
              <Metric label={t('reports:students.converted')} value={String(conversion?.converted_students ?? 0)} />
              <Metric
                label={t('reports:students.conversionRate')}
                value={`${(conversion?.conversion_rate ?? 0).toFixed(1)}%`}
              />
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:students.usageTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 md:grid-cols-3 gap-2 p-4'>
              <Metric label={t('reports:students.activeSubs')} value={String(usage?.active_subscriptions ?? 0)} />
              <Metric label={t('reports:students.remaining')} value={String(usage?.total_remaining_classes ?? 0)} />
              <Metric
                label={t('reports:students.avgRemaining')}
                value={String(usage?.average_remaining_classes ?? 0)}
              />
              <Metric
                label={t('reports:students.expirationRate')}
                value={`${(usage?.expiration_rate ?? 0).toFixed(1)}%`}
              />
              <Metric label={t('reports:students.renewalRate')} value={`${(usage?.renewal_rate ?? 0).toFixed(1)}%`} />
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

function EmptyRow({ cols }: { cols: number }) {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell colSpan={cols} className='py-4 text-center text-gray-500'>
        {t('common:noData')}
      </TableCell>
    </TableRow>
  );
}
