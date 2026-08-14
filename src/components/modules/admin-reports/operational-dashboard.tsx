import { format, isValid, parseISO, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { ClassCancellationsTable } from '@components/modules/admin-reports/class-cancellations-table';
import { ReportDateRange } from '@components/modules/admin-reports/report-date-range';
import {
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
  OccupancyFilters,
} from '@core/api';
import { PERMISSION } from '@core/permissions';
import { useDateLocale, usePromise } from '@hooks';

const ALL_FILTER = '__all__';

const roundTo = (value: number, decimals = 2): number => {
  const factor = 10 ** decimals;

  return Math.round(value * factor) / factor;
};

export function OperationalDashboard() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const initialDateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const [detailSearch, setDetailSearch] = useState('');
  const [detailSort, setDetailSort] = useState<OccupancyDetailSort>('date_desc');
  const [classType, setClassType] = useState(ALL_FILTER);
  const [roomId, setRoomId] = useState(ALL_FILTER);
  const [instructorId, setInstructorId] = useState(ALL_FILTER);

  const canFilterRooms = useOrPermissions([PERMISSION.ROOM_READ, PERMISSION.ROOM_MANAGE]);
  const canFilterInstructors = useOrPermissions([PERMISSION.INSTRUCTOR_LIST]);
  const canFilterClasses = useOrPermissions([PERMISSION.CLASS_CATALOG_READ, PERMISSION.CLASS_CATALOG_MANAGE]);

  const filters: OccupancyFilters = {
    classType: classType === ALL_FILTER ? undefined : classType,
    roomId: roomId === ALL_FILTER ? undefined : roomId,
    instructorId: instructorId === ALL_FILTER ? undefined : instructorId,
  };
  const filterDeps = [
    appliedDateRange.start,
    appliedDateRange.end,
    filters.classType,
    filters.roomId,
    filters.instructorId,
  ];

  const { response: occupancyData, isLoading: isOccLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getOccupancyReport(appliedDateRange.start, appliedDateRange.end, filters),
    true,
    filterDeps,
  );
  const { response: attendanceData, isLoading: isAttLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getAttendanceReport(appliedDateRange.start, appliedDateRange.end, filters),
    true,
    filterDeps,
  );
  const { response: underutilizedData, isLoading: isUnderLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getUnderutilizedSchedule(appliedDateRange.start, appliedDateRange.end, filters),
    true,
    filterDeps,
  );
  const { response: roomsData } = usePromise(
    () => DansshipAPI.inventoryAdmin.getRooms({ is_active: true }),
    canFilterRooms,
  );
  const { response: instructorsData } = usePromise(
    () => DansshipAPI.instructorsAdmin.getInstructors(),
    canFilterInstructors,
  );
  const { response: classesData } = usePromise(
    () => DansshipAPI.inventoryAdmin.getClasses({ is_active: true }),
    canFilterClasses,
  );

  const occupancy = useMemo(() => occupancyData?.data?.items ?? [], [occupancyData?.data?.items]);
  const attendance = useMemo(() => attendanceData?.data?.trend ?? [], [attendanceData?.data?.trend]);
  const underutilized = useMemo(() => underutilizedData?.data?.items ?? [], [underutilizedData?.data?.items]);
  const rooms = roomsData?.data ?? [];
  const instructors = (instructorsData?.data ?? []).filter(item => item.id);
  const classNames = useMemo(() => {
    const names = new Set((classesData?.data ?? []).map(item => item.name));

    return Array.from(names).sort((left, right) => left.localeCompare(right));
  }, [classesData?.data]);

  const isLoading = isOccLoading || isAttLoading || isUnderLoading;

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

  const detailedOccupancy = useMemo(() => {
    const normalizedQuery = detailSearch.trim().toLowerCase();
    const filtered = normalizedQuery
      ? occupancy.filter(item => {
          const instructorName = (item.instructor_name ?? '').toLowerCase();

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
  }, [detailSearch, detailSort, occupancy]);

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

  const instructorDisplayName = (row: ClassOccupancyItem): string => {
    if (row.instructor_name) {
      return row.instructor_name;
    }

    return `${t('reports:occupancy.instructorFallback')} ${row.instructor.slice(0, 8)}`;
  };

  return (
    <div className='space-y-8'>
      <ReportDateRange
        dateRange={dateRange}
        appliedDateRange={appliedDateRange}
        onDateRangeChange={setDateRange}
        onApply={() => setAppliedDateRange(dateRange)}
      />

      <div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
        {canFilterClasses && (
          <div className='space-y-1 w-full lg:w-64'>
            <Label>{t('reports:filters.classType')}</Label>
            <Select value={classType} onValueChange={setClassType}>
              <SelectTrigger className='bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t('reports:filters.all')}</SelectItem>
                {classNames.map(name => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {canFilterRooms && (
          <div className='space-y-1 w-full lg:w-64'>
            <Label>{t('reports:filters.room')}</Label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger className='bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t('reports:filters.all')}</SelectItem>
                {rooms.map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {canFilterInstructors && (
          <div className='space-y-1 w-full lg:w-64'>
            <Label>{t('reports:filters.instructor')}</Label>
            <Select value={instructorId} onValueChange={setInstructorId}>
              <SelectTrigger className='bg-white'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>{t('reports:filters.all')}</SelectItem>
                {instructors.map(instructor => (
                  <SelectItem key={instructor.id} value={instructor.id ?? ''}>
                    {instructor.full_name || instructor.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className='flex justify-center p-12'>
          <SpinnerLoader />
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:occupancy.summaryTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3 p-4'>
              <div className='grid grid-cols-3 gap-2'>
                <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
                  <p className='text-xs text-gray-500'>{t('reports:occupancy.summaryAverage')}</p>
                  <p className='text-sm font-semibold text-gray-900'>
                    {occupancyData?.data?.average_fill_rate.toFixed(1)}%
                  </p>
                </div>
                <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
                  <p className='text-xs text-gray-500'>{t('reports:occupancy.summarySessions')}</p>
                  <p className='text-sm font-semibold text-gray-900'>{occupancy.length}</p>
                </div>
                <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
                  <p className='text-xs text-gray-500'>{t('reports:occupancy.summaryClasses')}</p>
                  <p className='text-sm font-semibold text-gray-900'>{groupedOccupancy.length}</p>
                </div>
              </div>
              <Table>
                <TableHeader className='bg-gray-50/50'>
                  <TableRow>
                    <TableHead>{t('reports:occupancy.classHeader')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.sessions')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.enrolledCap')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.averageFillRate')}</TableHead>
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

          <Card className='border-input shadow-sm md:col-span-2'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:occupancy.detailTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 py-4'>
              <div className='flex flex-col gap-3 lg:flex-row lg:items-end'>
                <div className='flex-1 space-y-1'>
                  <Label htmlFor='occupancy-detail-search'>{t('reports:occupancy.detailSearchLabel')}</Label>
                  <Input
                    id='occupancy-detail-search'
                    value={detailSearch}
                    placeholder={t('reports:occupancy.detailSearchPlaceholder')}
                    onChange={event => setDetailSearch(event.target.value)}
                  />
                </div>
                <div className='w-full space-y-1 lg:w-64'>
                  <Label htmlFor='occupancy-detail-sort'>{t('reports:occupancy.detailSortLabel')}</Label>
                  <Select value={detailSort} onValueChange={value => setDetailSort(value as OccupancyDetailSort)}>
                    <SelectTrigger id='occupancy-detail-sort' className='bg-white'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='date_desc'>{t('reports:occupancy.sort.mostRecent')}</SelectItem>
                      <SelectItem value='fill_rate_desc'>{t('reports:occupancy.sort.highestFill')}</SelectItem>
                      <SelectItem value='fill_rate_asc'>{t('reports:occupancy.sort.lowestFill')}</SelectItem>
                      <SelectItem value='class_name_asc'>{t('reports:occupancy.sort.className')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='rounded-md border border-gray-200'>
                <Table>
                  <TableHeader className='bg-gray-50/60'>
                    <TableRow>
                      <TableHead>{t('reports:occupancy.detail.scheduleHeader')}</TableHead>
                      <TableHead>{t('reports:occupancy.classHeader')}</TableHead>
                      <TableHead>{t('reports:occupancy.detail.instructorHeader')}</TableHead>
                      <TableHead>{t('reports:occupancy.detail.roomHeader')}</TableHead>
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
                        <TableCell>{instructorDisplayName(row)}</TableCell>
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

          <Card className='border-input shadow-sm md:col-span-2'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:underutilized.title')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader className='bg-gray-50/50'>
                  <TableRow>
                    <TableHead>{t('reports:occupancy.detail.scheduleHeader')}</TableHead>
                    <TableHead>{t('reports:occupancy.classHeader')}</TableHead>
                    <TableHead>{t('reports:occupancy.detail.instructorHeader')}</TableHead>
                    <TableHead>{t('reports:occupancy.detail.roomHeader')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.enrolledCap')}</TableHead>
                    <TableHead className='text-right'>{t('reports:occupancy.fillRate')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {underutilized.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className='py-4 text-center text-gray-500'>
                        {t('reports:underutilized.empty')}
                      </TableCell>
                    </TableRow>
                  )}
                  {underutilized.map(row => (
                    <TableRow key={row.scheduled_class_id}>
                      <TableCell className='text-sm text-gray-700'>
                        {format(parseISO(row.start_time), 'MMM d, yyyy HH:mm', { locale })}
                      </TableCell>
                      <TableCell className='font-medium'>{row.class_name}</TableCell>
                      <TableCell>{row.instructor_name ?? t('reports:occupancy.instructorFallback')}</TableCell>
                      <TableCell>{row.room}</TableCell>
                      <TableCell className='text-right'>
                        {row.enrolled} / {row.capacity}
                      </TableCell>
                      <TableCell className='text-right font-semibold text-alert-500'>
                        {row.fill_rate.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      <ClassCancellationsTable startDate={appliedDateRange.start} endDate={appliedDateRange.end} embedded />
    </div>
  );
}
