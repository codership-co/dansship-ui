import { format, startOfMonth } from 'date-fns';
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
import { useDateLocale, usePromise } from '@hooks';

interface ClassFeedbackTableProps {
  instructorId?: string;
  hideInstructorColumn?: boolean;
}

export function ClassFeedbackTable({ instructorId, hideInstructorColumn = false }: ClassFeedbackTableProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const initialDateRange = {
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);

  const { response, isLoading } = usePromise(
    () => DansshipAPI.classFeedbackAdmin.list(appliedDateRange.start, appliedDateRange.end, instructorId),
    true,
    [appliedDateRange.start, appliedDateRange.end, instructorId],
  );
  const report = response?.ok ? response.data : null;
  const items = report?.items ?? [];

  if (isLoading) {
    return (
      <div className='flex justify-center p-12'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <ReportDateRange
        dateRange={dateRange}
        appliedDateRange={appliedDateRange}
        onDateRangeChange={setDateRange}
        onApply={() => setAppliedDateRange(dateRange)}
      />

      <div className='grid gap-4 md:grid-cols-3'>
        <Card className='border-input shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-600'>{t('reports:classFeedback.averageClass')}</CardTitle>
          </CardHeader>
          <CardContent className='text-2xl font-semibold'>
            {typeof report?.average_class_rating !== 'number' ? '—' : report.average_class_rating.toFixed(2)}
          </CardContent>
        </Card>
        <Card className='border-input shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-600'>{t('reports:classFeedback.averageInstructor')}</CardTitle>
          </CardHeader>
          <CardContent className='text-2xl font-semibold'>
            {typeof report?.average_instructor_rating !== 'number' ? '—' : report.average_instructor_rating.toFixed(2)}
          </CardContent>
        </Card>
        <Card className='border-input shadow-sm'>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm text-gray-600'>{t('reports:classFeedback.count')}</CardTitle>
          </CardHeader>
          <CardContent className='text-2xl font-semibold'>{report?.rating_count ?? 0}</CardContent>
        </Card>
      </div>

      <Card className='border-input shadow-sm'>
        <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
          <CardTitle className='text-lg text-gray-800'>{t('reports:classFeedback.title')}</CardTitle>
        </CardHeader>
        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader className='bg-gray-50/50'>
                <TableRow>
                  <TableHead>{t('reports:classFeedback.student')}</TableHead>
                  <TableHead>{t('reports:classFeedback.class')}</TableHead>
                  <TableHead>{t('reports:classFeedback.when')}</TableHead>
                  {hideInstructorColumn ? null : <TableHead>{t('reports:classFeedback.instructor')}</TableHead>}
                  <TableHead className='text-right'>{t('reports:classFeedback.classStars')}</TableHead>
                  <TableHead className='text-right'>{t('reports:classFeedback.instructorStars')}</TableHead>
                  <TableHead>{t('reports:classFeedback.comment')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={hideInstructorColumn ? 6 : 7} className='py-8 text-center text-gray-500'>
                      {t('reports:classFeedback.empty')}
                    </TableCell>
                  </TableRow>
                )}
                {items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className='font-medium'>{item.user_name || t('reports:classFeedback.anonymousName')}</div>
                      {item.user_email ? <div className='text-xs text-gray-500'>{item.user_email}</div> : null}
                    </TableCell>
                    <TableCell>{item.class_name || '—'}</TableCell>
                    <TableCell>
                      {item.class_start_time ? format(new Date(item.class_start_time), 'PPp', { locale }) : '—'}
                    </TableCell>
                    {hideInstructorColumn ? null : <TableCell>{item.instructor_name || '—'}</TableCell>}
                    <TableCell className='text-right'>{item.class_rating}</TableCell>
                    <TableCell className='text-right'>{item.instructor_rating}</TableCell>
                    <TableCell className='max-w-xs whitespace-pre-wrap text-sm text-gray-600'>
                      {item.comment || '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
