import { format, isValid, parseISO, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuShieldAlert } from 'react-icons/lu';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { useOrPermissions } from '@contexts';
import {
  AttendanceTrendPoint,
  ClassOccupancyItem,
  DansshipAPI,
  GroupedOccupancyItem,
  OccupancyDetailSort,
  RevenueByPlanItem,
} from '@core/api';
import { PERMISSION } from '@core/permissions';
import { useDateLocale, usePromise } from '@hooks';

const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
};

export function OperationalDashboard() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const initialDateRange: { start: string; end: string } = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailSort, setDetailSort] = useState<OccupancyDetailSort>('date_desc');
  const isInvalidRange = dateRange.start > dateRange.end;
  const isUnchangedRange = dateRange.start === appliedDateRange.start && dateRange.end === appliedDateRange.end;
  const canViewFinancialReports = useOrPermissions([PERMISSION.FINANCIAL_REPORT_READ]);

  const { response: occupancyData, isLoading: isOccLoading } = usePromise(() =>
    DansshipAPI.reportsAdmin.getOccupancyReport(appliedDateRange.start, appliedDateRange.end),
  );
  const { response: attendanceData, isLoading: isAttLoading } = usePromise(() =>
    DansshipAPI.reportsAdmin.getAttendanceReport(appliedDateRange.start, appliedDateRange.end),
  );
  const { response: instructorPerformanceData, isLoading: isInstructorPerfLoading } = usePromise(() =>
    DansshipAPI.reportsAdmin.getInstructorPerformanceReport(appliedDateRange.start, appliedDateRange.end),
  );
  const { response: revenueData, isLoading: isRevLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getRevenueReport(appliedDateRange.start, appliedDateRange.end),
    canViewFinancialReports,
  );

  const occupancy = useMemo(() => occupancyData?.data?.items ?? [], [occupancyData?.data?.items]);
  const attendance = useMemo(() => attendanceData?.data?.trend ?? [], [attendanceData?.data?.trend]);
  const revenue = useMemo(() => revenueData?.data?.by_plan ?? [], [revenueData?.data?.by_plan]);
  const instructorPerformance = useMemo(
    () => instructorPerformanceData?.data?.items ?? [],
    [instructorPerformanceData?.data?.items],
  );

  const isLoading =
    isOccLoading || isAttLoading || (canViewFinancialReports && isRevLoading) || isInstructorPerfLoading;

  const groupedOccupancy = useMemo<Array<GroupedOccupancyItem>>(() => {
    const grouped = new Map<string, { totalCapacity: number; totalEnrolled: number; sessions: number }>();

    occupancy.forEach(item => {
      const current = grouped.get(item.class_name) ?? { totalCapacity: 0, totalEnrolled: 0, sessions: 0 };
      grouped.set(item.class_name, {
        totalCapacity: current.totalCapacity + item.capacity,
        totalEnrolled: current.totalEnrolled + item.enrolled,
        sessions: current.sessions + 1,
      });
    });

    return Array.from(grouped.entries())
      .map(([className, summary]) => ({
        class_name: className,
        total_capacity: summary.totalCapacity,
        total_enrolled: summary.totalEnrolled,
        sessions: summary.sessions,
        average_fill_rate:
          summary.totalCapacity > 0 ? roundTo((summary.totalEnrolled / summary.totalCapacity) * 100) : 0,
      }))
      .sort((left, right) => right.average_fill_rate - left.average_fill_rate);
  }, [occupancy]);

  const instructorNamesById = useMemo(() => {
    return new Map(instructorPerformance.map(item => [item.instructor_id, item.instructor_name]));
  }, [instructorPerformance]);

  const detailedOccupancy = useMemo(() => {
    const normalizedQuery = detailSearch.trim().toLowerCase();
    const filtered = normalizedQuery
      ? occupancy.filter(item => {
          const instructorName = instructorNamesById.get(item.instructor)?.toLowerCase() ?? '';

          return (
            item.class_name.toLowerCase().includes(normalizedQuery) ||
            item.room.toLowerCase().includes(normalizedQuery) ||
            instructorName.includes(normalizedQuery)
          );
        })
      : [...occupancy];

    return filtered.sort((left, right) => {
      if (detailSort === 'fill_rate_desc') {
        return right.fill_rate - left.fill_rate;
      }

      if (detailSort === 'fill_rate_asc') {
        return left.fill_rate - right.fill_rate;
      }

      if (detailSort === 'class_name_asc') {
        return left.class_name.localeCompare(right.class_name);
      }

      const leftDate = left.start_time ? new Date(left.start_time).getTime() : new Date(left.class_date).getTime();
      const rightDate = right.start_time ? new Date(right.start_time).getTime() : new Date(right.class_date).getTime();

      return rightDate - leftDate;
    });
  }, [detailSearch, detailSort, occupancy, instructorNamesById]);

  const formatSchedule = (row: ClassOccupancyItem): string => {
    if (row.start_time) {
      const parsed = parseISO(row.start_time);

      if (isValid(parsed)) {
        return format(parsed, 'MMM d, yyyy HH:mm', { locale });
      }
    }

    const fallback = new Date(`${row.class_date}T00:00:00`);

    return format(fallback, 'MMM d, yyyy', { locale });
  };

  const getInstructorDisplayName = (instructorId: string): string => {
    const resolvedName = instructorNamesById.get(instructorId);

    if (resolvedName) {
      return resolvedName;
    }

    return `${t('reports:occupancy.instructorFallback', 'Instructor')} ${instructorId.slice(0, 8)}`;
  };

  if (isLoading) {
    return (
      <div className='flex justify-center p-12'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      <div className='bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-3'>
        <div className='flex justify-between items-center'>
          <span className='text-gray-700 font-medium'>{t('reports:reportingRange')}</span>
          <span className='text-gray-900 font-bold bg-white px-3 py-1 rounded shadow-sm border border-gray-200'>
            {format(new Date(appliedDateRange.start), 'MMM d, yyyy', { locale })} —{' '}
            {format(new Date(appliedDateRange.end), 'MMM d, yyyy', { locale })}
          </span>
        </div>

        <div className='flex flex-col md:flex-row md:items-end gap-3'>
          <div className='space-y-1'>
            <Label htmlFor='report-start-date'>{t('reports:dateFrom')}</Label>
            <Input
              id='report-start-date'
              type='date'
              value={dateRange.start}
              max={dateRange.end}
              onChange={event => setDateRange(prev => ({ ...prev, start: event.target.value }))}
            />
          </div>
          <div className='space-y-1'>
            <Label htmlFor='report-end-date'>{t('reports:dateTo')}</Label>
            <Input
              id='report-end-date'
              type='date'
              value={dateRange.end}
              min={dateRange.start}
              onChange={event => setDateRange(prev => ({ ...prev, end: event.target.value }))}
            />
          </div>
          <Button
            type='button'
            onClick={() => setAppliedDateRange(dateRange)}
            disabled={isInvalidRange || isUnchangedRange}
          >
            {t('reports:applyDateRange')}
          </Button>
        </div>
        {isInvalidRange && <p className='text-sm text-alert-500'>{t('reports:invalidDateRange')}</p>}
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        {/* Occupancy Card */}
        <Card className='border-input shadow-sm'>
          <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
            <CardTitle className='text-lg text-gray-800'>
              {t('reports:occupancy.summaryTitle', 'Class Occupancy Summary')}
            </CardTitle>
          </CardHeader>

          <CardContent className='space-y-3 p-4'>
            <div className='grid grid-cols-3 gap-2'>
              <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
                <p className='text-xs text-gray-500'>{t('reports:occupancy.summaryAverage', 'Average Fill')}</p>
                <p className='text-sm font-semibold text-gray-900'>
                  {occupancyData?.data?.average_fill_rate.toFixed(1)}%
                </p>
              </div>

              <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
                <p className='text-xs text-gray-500'>{t('reports:occupancy.summarySessions', 'Sessions')}</p>
                <p className='text-sm font-semibold text-gray-900'>{occupancy.length}</p>
              </div>

              <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
                <p className='text-xs text-gray-500'>{t('reports:occupancy.summaryClasses', 'Class Types')}</p>
                <p className='text-sm font-semibold text-gray-900'>{groupedOccupancy.length}</p>
              </div>
            </div>

            <Table>
              <TableHeader className='bg-gray-50/50'>
                <TableRow>
                  <TableHead>{t('reports:occupancy.classHeader')}</TableHead>
                  <TableHead className='text-right'>{t('reports:occupancy.sessions', 'Sessions')}</TableHead>
                  <TableHead className='text-right'>{t('reports:occupancy.enrolledCap')}</TableHead>
                  <TableHead className='text-right'>
                    {t('reports:occupancy.averageFillRate', 'Avg Fill Rate')}
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {groupedOccupancy.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className='py-4 text-center text-gray-500'>
                      {t('common:noData')}
                    </TableCell>
                  </TableRow>
                )}

                {groupedOccupancy.map((row: GroupedOccupancyItem) => (
                  <TableRow key={row.class_name}>
                    <TableCell className='font-medium'>{row.class_name}</TableCell>

                    <TableCell className='text-right text-gray-600'>{row.sessions}</TableCell>

                    <TableCell className='text-right'>
                      {row.total_enrolled} / {row.total_capacity}
                    </TableCell>

                    <TableCell className='text-right font-bold'>
                      <span className={row.average_fill_rate < 50 ? 'text-alert-500' : 'text-active-600'}>
                        {row.average_fill_rate.toFixed(1)}%
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Attendance Card */}
        <Card className='border-input shadow-sm'>
          <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
            <CardTitle className='text-lg text-gray-800'>{t('reports:attendanceTitle')}</CardTitle>
          </CardHeader>

          <CardContent className='p-0'>
            <Table>
              <TableHeader className='bg-gray-50/50'>
                <TableRow>
                  <TableHead>{t('reports:attendance.week')}</TableHead>
                  <TableHead className='text-right'>{t('reports:attendance.attended')}</TableHead>
                  <TableHead className='text-right'>{t('reports:attendance.noShow')}</TableHead>
                  <TableHead className='text-right'>{t('reports:attendance.rate')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {attendance.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className='py-4 text-center text-gray-500'>
                      {t('common:noData')}
                    </TableCell>
                  </TableRow>
                )}

                {attendance.map((row: AttendanceTrendPoint, index: number) => (
                  <TableRow key={index}>
                    <TableCell className='font-medium'>{row.week}</TableCell>

                    <TableCell className='text-right text-active-600'>{row.attended}</TableCell>

                    <TableCell className='text-right text-alert-500'>{row.no_show}</TableCell>

                    <TableCell className='text-right font-bold'>{row.attendance_rate.toFixed(1)}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Detailed Occupancy Card */}
        <Card className='border-input shadow-sm md:col-span-2'>
          <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
            <CardTitle className='text-lg text-gray-800'>
              {t('reports:occupancy.detailTitle', 'Schedule Fill Rate Detail')}
            </CardTitle>
          </CardHeader>

          <CardContent className='space-y-4 py-4'>
            <div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
              <div className='flex-1 space-y-1'>
                <Label htmlFor='occupancy-detail-search'>
                  {t('reports:occupancy.detailSearchLabel', 'Search class, room or instructor')}
                </Label>

                <Input
                  id='occupancy-detail-search'
                  value={detailSearch}
                  placeholder={t('reports:occupancy.detailSearchPlaceholder', 'Type to filter rows')}
                  onChange={event => setDetailSearch(event.target.value)}
                />
              </div>

              <div className='w-full space-y-1 lg:w-64'>
                <Label htmlFor='occupancy-detail-sort'>{t('reports:occupancy.detailSortLabel', 'Sort rows')}</Label>

                <Select value={detailSort} onValueChange={value => setDetailSort(value as OccupancyDetailSort)}>
                  <SelectTrigger id='occupancy-detail-sort' className='bg-white'>
                    <SelectValue />
                  </SelectTrigger>

                  <SelectContent>
                    <SelectItem value='date_desc'>
                      {t('reports:occupancy.sort.mostRecent', 'Most recent first')}
                    </SelectItem>

                    <SelectItem value='fill_rate_desc'>
                      {t('reports:occupancy.sort.highestFill', 'Highest fill rate')}
                    </SelectItem>

                    <SelectItem value='fill_rate_asc'>
                      {t('reports:occupancy.sort.lowestFill', 'Lowest fill rate')}
                    </SelectItem>

                    <SelectItem value='class_name_asc'>
                      {t('reports:occupancy.sort.className', 'Class name (A-Z)')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='rounded-md border border-gray-200'>
              <Table>
                <TableHeader className='bg-gray-50/60'>
                  <TableRow>
                    <TableHead>{t('reports:occupancy.detail.scheduleHeader', 'Schedule')}</TableHead>

                    <TableHead>{t('reports:occupancy.classHeader')}</TableHead>

                    <TableHead>{t('reports:occupancy.detail.instructorHeader', 'Instructor')}</TableHead>

                    <TableHead>{t('reports:occupancy.detail.roomHeader', 'Room')}</TableHead>

                    <TableHead className='text-right'>{t('reports:occupancy.enrolledCap')}</TableHead>

                    <TableHead className='text-right'>{t('reports:occupancy.fillRate')}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {detailedOccupancy.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='py-4 text-center text-gray-500'>
                        {t('common:noData')}
                      </TableCell>
                    </TableRow>
                  )}

                  {detailedOccupancy.map(row => (
                    <TableRow key={row.scheduled_class_id}>
                      <TableCell className='text-sm text-gray-700'>{formatSchedule(row)}</TableCell>

                      <TableCell className='font-medium'>{row.class_name}</TableCell>

                      <TableCell>{getInstructorDisplayName(row.instructor)}</TableCell>

                      <TableCell>{row.room}</TableCell>

                      <TableCell className='text-right'>
                        {row.enrolled} / {row.capacity}
                      </TableCell>

                      <TableCell className='text-right font-semibold'>
                        <span className={row.fill_rate < 50 ? 'text-alert-500' : 'text-active-600'}>
                          {row.fill_rate.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Revenue Card */}
        <Card className='border-input shadow-sm md:col-span-2'>
          <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
            <CardTitle className='text-lg text-gray-800'>{t('reports:revenueTitle')}</CardTitle>
          </CardHeader>

          <CardContent className='p-0'>
            {canViewFinancialReports ? (
              <Table>
                <TableHeader className='bg-gray-50/50'>
                  <TableRow>
                    <TableHead>{t('reports:revenue.plan')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.sold')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.gross')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.discounts')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.netRevenue')}</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {revenue.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className='py-4 text-center text-gray-500'>
                        {t('common:noData')}
                      </TableCell>
                    </TableRow>
                  )}

                  {revenue.map((row: RevenueByPlanItem, index: number) => (
                    <TableRow key={index}>
                      <TableCell className='font-medium'>{row.plan_name}</TableCell>

                      <TableCell className='text-right'>{row.subscription_count}</TableCell>

                      <TableCell className='text-right text-gray-500'>
                        ${parseFloat(row.gross_revenue).toFixed(2)}
                      </TableCell>

                      <TableCell className='text-right text-alert-500'>
                        -${parseFloat(row.discount_impact).toFixed(2)}
                      </TableCell>

                      <TableCell className='text-right font-bold text-active-700'>
                        ${parseFloat(row.net_revenue).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className='p-4'>
                <Card className='border-amber-200 bg-amber-50/70 border-amber-200 shadow-sm'>
                  <CardHeader className='pb-3'>
                    <CardTitle>
                      <span className='flex items-center gap-2 text-amber-900'>
                        <LuShieldAlert className='h-5 w-5' />
                        {t('reports:revenue.noPermissionTitle')}
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent>
                    <p className='text-sm text-amber-800'>{t('reports:revenue.noPermissionDescription')}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
