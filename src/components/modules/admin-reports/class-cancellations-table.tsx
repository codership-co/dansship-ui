import { format, parseISO } from 'date-fns';
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
import { useDateLocale, usePromise } from '@hooks';

type ClassCancellationsTableProps = {
  startDate: string;
  endDate: string;
  embedded?: boolean;
};

export function ClassCancellationsTable({ startDate, endDate, embedded = false }: ClassCancellationsTableProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const isInvalidRange = Boolean(startDate && endDate && startDate > endDate);

  const { response, isLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getClassCancellationsReport(startDate, endDate),
    !isInvalidRange,
    [startDate, endDate, isInvalidRange],
  );

  const report = response?.ok ? response.data : null;

  return (
    <div className='grid gap-6'>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg text-gray-800'>{t('reports:classCancellations.title')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          {!embedded && isInvalidRange && <p className='text-sm text-alert-500'>{t('reports:invalidDateRange')}</p>}

          <p className='text-sm text-gray-600 m-0'>
            {t('reports:classCancellations.total', { count: report?.total_cancellations ?? 0 })}
          </p>

          {isLoading ? (
            <SpinnerLoader />
          ) : (
            <>
              <div className='overflow-x-auto rounded-md border'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('reports:classCancellations.class')}</TableHead>
                      <TableHead>{t('reports:classCancellations.schedule')}</TableHead>
                      <TableHead>{t('reports:classCancellations.room')}</TableHead>
                      <TableHead>{t('reports:classCancellations.cancelledAt')}</TableHead>
                      <TableHead>{t('reports:classCancellations.note')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(report?.items ?? []).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className='text-center text-sm text-gray-500'>
                          {t('reports:classCancellations.empty')}
                        </TableCell>
                      </TableRow>
                    ) : (
                      report?.items.map(item => (
                        <TableRow key={item.scheduled_class_id}>
                          <TableCell className='font-medium'>{item.class_name}</TableCell>
                          <TableCell>{format(parseISO(item.start_time), 'd MMM yyyy HH:mm', { locale })}</TableCell>
                          <TableCell>{item.room}</TableCell>
                          <TableCell>{format(parseISO(item.cancelled_at), 'd MMM yyyy HH:mm', { locale })}</TableCell>
                          <TableCell className='max-w-xs whitespace-pre-wrap text-sm text-gray-700'>
                            {item.cancellation_note || t('reports:classCancellations.noNote')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              <div>
                <h3 className='text-sm font-medium text-gray-800 mb-2'>{t('reports:classCancellations.trendTitle')}</h3>
                <div className='overflow-x-auto rounded-md border'>
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
                        report?.trend.map(point => (
                          <TableRow key={point.week}>
                            <TableCell>{point.week}</TableCell>
                            <TableCell className='text-right'>{point.cancellation_count}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
