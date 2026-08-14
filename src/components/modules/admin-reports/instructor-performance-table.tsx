import { format, startOfMonth, startOfYear, endOfMonth, subMonths } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { InstructorCancellationsTable } from '@components/modules/admin-reports/instructor-cancellations-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Card,
  Input,
  Label,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  CardContent,
  CardHeader,
  CardTitle,
} from '@components/ui';
import { DansshipAPI, InstructorPerformanceRow } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

const PRESETS = {
  THIS_MONTH: 'this_month',
  LAST_MONTH: 'last_month',
  YTD: 'ytd',
  CUSTOM: 'custom',
} as const;

export function InstructorPerformanceTable() {
  const { t } = useTranslation();
  const locale = useDateLocale();

  const initialDateRange = {
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };

  const [preset, setPreset] = useState<string>(PRESETS.THIS_MONTH);
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);

  const isInvalidRange = dateRange.start > dateRange.end;
  const isUnchangedRange = dateRange.start === appliedDateRange.start && dateRange.end === appliedDateRange.end;

  const { response: reportData, isLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getInstructorPerformanceReport(appliedDateRange.start, appliedDateRange.end),
    true,
    [appliedDateRange.start, appliedDateRange.end],
  );
  const instructors = reportData?.data?.items || [];

  const handlePresetChange = (value: string) => {
    setPreset(value);
    const today = new Date();

    let newStart = '';
    let newEnd = '';

    switch (value) {
      case PRESETS.THIS_MONTH:
        newStart = format(startOfMonth(today), 'yyyy-MM-dd');
        newEnd = format(today, 'yyyy-MM-dd');

        break;
      case PRESETS.LAST_MONTH: {
        const lastMonth = subMonths(today, 1);
        newStart = format(startOfMonth(lastMonth), 'yyyy-MM-dd');
        newEnd = format(endOfMonth(lastMonth), 'yyyy-MM-dd');

        break;
      }
      case PRESETS.YTD:
        newStart = format(startOfYear(today), 'yyyy-MM-dd');
        newEnd = format(today, 'yyyy-MM-dd');

        break;
      case PRESETS.CUSTOM:
        return;
    }

    if (newStart && newEnd) {
      setDateRange({ start: newStart, end: newEnd });
      setAppliedDateRange({ start: newStart, end: newEnd });
    }
  };

  const handleApplyCustom = () => {
    if (!isInvalidRange) {
      setAppliedDateRange(dateRange);
    }
  };

  if (isLoading) {
    return (
      <div className='flex justify-center p-12'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4'>
        <div className='flex justify-between items-center'>
          <span className='text-gray-700 font-medium'>
            {t('reports:instructorPerformance.dateFilter', 'Date Filter')}
          </span>
          <span className='text-gray-900 font-bold bg-white px-3 py-1 rounded shadow-sm border border-gray-200'>
            {format(new Date(appliedDateRange.start), 'MMM d, yyyy', { locale })} —{' '}
            {format(new Date(appliedDateRange.end), 'MMM d, yyyy', { locale })}
          </span>
        </div>

        <div className='flex flex-col md:flex-row md:items-end gap-4'>
          <div className='space-y-1'>
            <Label>{t('reports:preset', 'Preset')}</Label>
            <Select value={preset} onValueChange={handlePresetChange}>
              <SelectTrigger className='w-[180px] bg-white'>
                <SelectValue placeholder={t('reports:selectPreset', 'Select Preset')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PRESETS.THIS_MONTH}>{t('reports:presets.thisMonth', 'This Month')}</SelectItem>
                <SelectItem value={PRESETS.LAST_MONTH}>{t('reports:presets.lastMonth', 'Last Month')}</SelectItem>
                <SelectItem value={PRESETS.YTD}>{t('reports:presets.ytd', 'Year to Date')}</SelectItem>
                <SelectItem value={PRESETS.CUSTOM}>{t('reports:presets.custom', 'Custom')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='space-y-1'>
            <Label htmlFor='perf-start-date'>{t('reports:dateFrom', 'From')}</Label>
            <Input
              id='perf-start-date'
              type='date'
              value={dateRange.start}
              max={dateRange.end}
              disabled={preset !== PRESETS.CUSTOM}
              onChange={e => {
                setDateRange(prev => ({ ...prev, start: e.target.value }));

                if (preset !== PRESETS.CUSTOM) setPreset(PRESETS.CUSTOM);
              }}
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='perf-end-date'>{t('reports:dateTo', 'To')}</Label>
            <Input
              id='perf-end-date'
              type='date'
              value={dateRange.end}
              min={dateRange.start}
              disabled={preset !== PRESETS.CUSTOM}
              onChange={e => {
                setDateRange(prev => ({ ...prev, end: e.target.value }));

                if (preset !== PRESETS.CUSTOM) setPreset(PRESETS.CUSTOM);
              }}
            />
          </div>
          {preset === PRESETS.CUSTOM && (
            <Button type='button' onClick={handleApplyCustom} disabled={isInvalidRange || isUnchangedRange}>
              {t('reports:applyDateRange', 'Apply')}
            </Button>
          )}
        </div>
        {isInvalidRange && (
          <p className='text-sm text-alert-500'>{t('reports:invalidDateRange', 'Invalid date range')}</p>
        )}
      </div>

      <Card className='border-input shadow-sm'>
        <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
          <CardTitle className='text-lg text-gray-800'>
            {t('reports:instructorPerformanceTitle', 'Instructor Performance')}
          </CardTitle>
        </CardHeader>

        <CardContent className='p-0'>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader className='bg-gray-50/50'>
                <TableRow>
                  <TableHead>{t('reports:instructor.name', 'Instructor')}</TableHead>

                  <TableHead className='text-right'>
                    {t('reports:instructor.classesTaught', 'Classes Taught')}
                  </TableHead>

                  <TableHead className='text-right'>{t('reports:instructor.hoursTaught', 'Hours Taught')}</TableHead>

                  <TableHead className='text-right'>
                    {t('reports:instructor.occupancyRate', 'Occupancy Rate')}
                  </TableHead>

                  <TableHead className='text-right'>
                    {t('reports:instructor.attendanceReliability', 'Attendance Rel.')}
                  </TableHead>

                  <TableHead className='text-right'>
                    {t('reports:instructor.cancellationRate', 'Cancellation Rate')}
                  </TableHead>

                  <TableHead className='text-right'>
                    {t('reports:instructor.studentRetention', 'Student Retention')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {instructors.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className='py-8 text-center text-gray-500'>
                      {t('common:noData', 'No data available')}
                    </TableCell>
                  </TableRow>
                )}

                {instructors.map((row: InstructorPerformanceRow) => (
                  <TableRow key={row.instructor_id}>
                    <TableCell className='font-medium'>{row.instructor_name}</TableCell>

                    <TableCell className='text-right'>{row.classes_taught}</TableCell>

                    <TableCell className='text-right'>{row.hours_taught.toFixed(1)}</TableCell>

                    <TableCell className='text-right font-bold'>
                      <span className={row.occupancy_rate < 50 ? 'text-warning-500' : 'text-active-600'}>
                        {row.occupancy_rate.toFixed(1)}%
                      </span>
                    </TableCell>

                    <TableCell className='text-right'>{row.attendance_reliability.toFixed(1)}%</TableCell>

                    <TableCell className='text-right'>
                      <span className={row.cancellation_rate > 5 ? 'text-alert-500' : 'text-active-600'}>
                        {row.cancellation_rate.toFixed(1)}%
                      </span>
                    </TableCell>

                    <TableCell className='text-right'>{row.student_retention.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <InstructorCancellationsTable startDate={appliedDateRange.start} endDate={appliedDateRange.end} />
    </div>
  );
}
