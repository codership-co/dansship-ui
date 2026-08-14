import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
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

type InstructorCancellationsTableProps = {
  startDate: string;
  endDate: string;
};

export function InstructorCancellationsTable({ startDate, endDate }: InstructorCancellationsTableProps) {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getInstructorCancellationsReport(startDate, endDate),
    true,
    [startDate, endDate],
  );
  const report = response?.data;
  const perInstructor = Object.entries(report?.per_instructor ?? {});

  if (isLoading) {
    return (
      <div className='flex justify-center p-8'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='grid gap-6'>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg text-gray-800'>{t('reports:instructorCancellations.title')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <p className='text-sm text-gray-600 m-0'>
            {t('reports:instructorCancellations.total', { count: report?.total_cancellations ?? 0 })}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports:instructorCancellations.reason')}</TableHead>
                <TableHead className='text-right'>{t('reports:classCancellations.count')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(report?.reason_breakdown ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className='text-center text-sm text-gray-500'>
                    {t('common:noData')}
                  </TableCell>
                </TableRow>
              ) : (
                report?.reason_breakdown.map(row => (
                  <TableRow key={row.reason}>
                    <TableCell>{row.reason}</TableCell>
                    <TableCell className='text-right'>{row.count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports:attendance.week')}</TableHead>
                <TableHead className='text-right'>{t('reports:classCancellations.count')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(report?.trend ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className='text-center text-sm text-gray-500'>
                    {t('common:noData')}
                  </TableCell>
                </TableRow>
              ) : (
                report?.trend.map(row => (
                  <TableRow key={row.week}>
                    <TableCell>{row.week}</TableCell>
                    <TableCell className='text-right'>{row.cancellation_count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('reports:instructorCancellations.instructor')}</TableHead>
                <TableHead className='text-right'>{t('reports:classCancellations.count')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {perInstructor.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className='text-center text-sm text-gray-500'>
                    {t('common:noData')}
                  </TableCell>
                </TableRow>
              ) : (
                perInstructor.map(([instructorId, count]) => (
                  <TableRow key={instructorId}>
                    <TableCell>{instructorId}</TableCell>
                    <TableCell className='text-right'>{count}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
