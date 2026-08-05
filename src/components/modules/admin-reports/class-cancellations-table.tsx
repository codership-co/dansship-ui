import { format, parseISO } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

function toIsoDate(value: Date): string {
  return format(value, 'yyyy-MM-dd');
}

export function ClassCancellationsTable() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const now = useMemo(() => new Date(), []);
  const [startDate, setStartDate] = useState(() => toIsoDate(new Date(now.getFullYear(), now.getMonth(), 1)));
  const [endDate, setEndDate] = useState(() => toIsoDate(now));
  const [appliedDateRange, setAppliedDateRange] = useState({ start: startDate, end: endDate });

  const isInvalidRange = Boolean(
    appliedDateRange.start && appliedDateRange.end && appliedDateRange.start > appliedDateRange.end,
  );

  const { response, isLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getClassCancellationsReport(appliedDateRange.start, appliedDateRange.end),
    !isInvalidRange,
    [appliedDateRange.start, appliedDateRange.end, isInvalidRange],
  );

  const report = response?.ok ? response.data : null;

  return (
    <div className='grid gap-6'>
      <Card>
        <CardHeader className='pb-3'>
          <CardTitle className='text-lg text-gray-800'>{t('reports:classCancellations.title')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex flex-wrap items-end gap-3'>
            <div className='grid gap-1'>
              <Label htmlFor='cancel-start-date'>{t('reports:dateFrom')}</Label>
              <Input
                id='cancel-start-date'
                type='date'
                value={startDate}
                onChange={event => setStartDate(event.target.value)}
              />
            </div>
            <div className='grid gap-1'>
              <Label htmlFor='cancel-end-date'>{t('reports:dateTo')}</Label>
              <Input
                id='cancel-end-date'
                type='date'
                value={endDate}
                onChange={event => setEndDate(event.target.value)}
              />
            </div>
            <Button
              type='button'
              onClick={() => setAppliedDateRange({ start: startDate, end: endDate })}
              disabled={!startDate || !endDate || startDate > endDate}
            >
              {t('reports:applyDateRange')}
            </Button>
          </div>
          {(isInvalidRange || (startDate && endDate && startDate > endDate)) && (
            <p className='text-sm text-alert-500'>{t('reports:invalidDateRange')}</p>
          )}

          <p className='text-sm text-gray-600 m-0'>
            {t('reports:classCancellations.total', { count: report?.total_cancellations ?? 0 })}
          </p>

          {isLoading ? (
            <SpinnerLoader />
          ) : (
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
