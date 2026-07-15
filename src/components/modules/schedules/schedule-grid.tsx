import { format, parseISO, addDays, isBefore, startOfDay } from 'date-fns';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useDateLocale } from '@hooks';

import type { ScheduledClass, AgendaEvent, ScheduleStatus } from '@core/api';

export type GridEvent = ScheduledClass | AgendaEvent;

interface ScheduleGridProps {
  // The Monday string 'YYYY-MM-DD'
  weekDate: string;
  // For backwards compat, deprecated
  classes?: Array<ScheduledClass>;
  // The new preferred prop
  events?: Array<GridEvent>;
  onSlotClick?: (date: string, timeHour: number) => void;
  onClassClick?: (event: GridEvent) => void;
  onAddAtTime?: (date: string, time: string) => void;
  dayColumnMinWidth?: number;
  scheduleStatus?: ScheduleStatus;
}

// 6 AM to 9 PM
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const HOUR_HEIGHT_PX = 64;

interface ClassLayout {
  top: number;
  height: number;
  column: number;
  columnsCount: number;
}

interface ClassWithLayout {
  cls: GridEvent;
  layout: ClassLayout;
}

function toMinutesFromDayStart(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

// Helpers for unified access
function getStartTime(ev: GridEvent): string {
  return ev.start_time;
}
function getEndTime(ev: GridEvent): string {
  return ev.end_time;
}
function getId(ev: GridEvent): string {
  return 'id' in ev ? ev.id : `${ev.source_id}-${ev.start_time}`;
}

function buildDayLayout(dayClasses: Array<GridEvent>): Array<ClassWithLayout> {
  if (dayClasses.length === 0) {
    return [];
  }

  const sorted = [...dayClasses].sort((first, second) => {
    const firstStart = toMinutesFromDayStart(new Date(getStartTime(first)));
    const secondStart = toMinutesFromDayStart(new Date(getStartTime(second)));

    if (firstStart !== secondStart) {
      return firstStart - secondStart;
    }

    const firstEnd = toMinutesFromDayStart(new Date(getEndTime(first)));
    const secondEnd = toMinutesFromDayStart(new Date(getEndTime(second)));

    return firstEnd - secondEnd;
  });

  const groups: Array<Array<GridEvent>> = [];
  let currentGroup: Array<GridEvent> = [];
  let currentGroupEnd = -1;

  for (const cls of sorted) {
    const startMinutes = toMinutesFromDayStart(new Date(getStartTime(cls)));
    const endMinutes = toMinutesFromDayStart(new Date(getEndTime(cls)));

    if (currentGroup.length === 0 || startMinutes < currentGroupEnd) {
      currentGroup.push(cls);
      currentGroupEnd = Math.max(currentGroupEnd, endMinutes);

      continue;
    }

    groups.push(currentGroup);
    currentGroup = [cls];
    currentGroupEnd = endMinutes;
  }

  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  const result: Array<ClassWithLayout> = [];

  for (const group of groups) {
    const activeColumns: Array<{ endMinutes: number; column: number }> = [];
    const freeColumns: Array<number> = [];
    let nextColumn = 0;
    let columnsCount = 0;

    const layoutById: Record<string, ClassLayout> = {};

    for (const cls of group) {
      const startMinutes = toMinutesFromDayStart(new Date(getStartTime(cls)));
      const endMinutes = toMinutesFromDayStart(new Date(getEndTime(cls)));

      for (let index = activeColumns.length - 1; index >= 0; index -= 1) {
        if (activeColumns[index].endMinutes <= startMinutes) {
          freeColumns.push(activeColumns[index].column);
          activeColumns.splice(index, 1);
        }
      }

      freeColumns.sort((first, second) => first - second);

      const column = freeColumns.length > 0 ? freeColumns.shift()! : nextColumn++;
      columnsCount = Math.max(columnsCount, column + 1);

      activeColumns.push({ endMinutes, column });

      const startHour = startMinutes / 60;
      const endHour = endMinutes / 60;
      const top = (startHour - 6) * HOUR_HEIGHT_PX;
      const height = Math.max((endHour - startHour) * HOUR_HEIGHT_PX, 28);

      layoutById[getId(cls)] = {
        top,
        height,
        column,
        columnsCount,
      };
    }

    for (const cls of group) {
      const layout = layoutById[getId(cls)];
      result.push({ cls, layout: { ...layout, columnsCount } });
    }
  }

  return result;
}

export function ScheduleGrid({
  weekDate,
  classes = [],
  events = [],
  onSlotClick,
  onClassClick,
  onAddAtTime,
  dayColumnMinWidth = 150,
  scheduleStatus,
}: ScheduleGridProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  // Generate the 7 days of the week starting from weekDate
  const days = useMemo(() => {
    const start = parseISO(weekDate);

    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(start, i);
      const isPast = isBefore(d, startOfDay(new Date()));

      return {
        date: d,
        dateString: format(d, 'yyyy-MM-dd'),
        dayName: format(d, 'EEEE', { locale }),
        shortDate: format(d, 'MMM d', { locale }),
        isPast,
      };
    });
  }, [weekDate, locale]);

  const allEvents = useMemo(() => {
    return [...classes, ...events];
  }, [classes, events]);

  // Group classes by date string and pre-compute overlap layout
  const classesByDate = useMemo(() => {
    const dict: Record<string, Array<GridEvent>> = {};
    allEvents.forEach(c => {
      // Localize the start_time ISO string
      const localDate = new Date(c.start_time);
      const dateStr = format(localDate, 'yyyy-MM-dd');

      if (!dict[dateStr]) dict[dateStr] = [];

      dict[dateStr].push(c);
    });

    const layoutDict: Record<string, Array<ClassWithLayout>> = {};
    Object.entries(dict).forEach(([dateStr, dayClasses]) => {
      layoutDict[dateStr] = buildDayLayout(dayClasses);
    });

    return layoutDict;
  }, [allEvents]);

  return (
    <div className='flex bg-white rounded-xl shadow-xl border border-gray-200 overflow-auto'>
      {/* Time column */}
      <div className='w-16 shrink-0 border-r border-gray-200 bg-gray-50'>
        <div className='h-14 border-b border-gray-200'></div> {/* Header spacer */}
        <div className='relative' style={{ height: `${HOURS.length * HOUR_HEIGHT_PX}px` }}>
          {HOURS.map(hour => (
            <div
              key={hour}
              className='absolute w-full text-right pr-2 text-xs text-gray-500 transform -translate-y-1/2'
              style={{ top: `${(hour - 6) * HOUR_HEIGHT_PX + 10}px` }}
            >
              {hour}:00
            </div>
          ))}
        </div>
      </div>

      {/* Days grid */}
      <div className='flex-1 flex overflow-x-auto'>
        {days.map((day, i) => (
          <div
            key={day.dateString}
            className={`flex-1 ${i < 6 ? 'border-r border-gray-200' : ''}`}
            style={{ minWidth: `${dayColumnMinWidth}px` }}
          >
            {/* Day Header */}
            <div
              className={`h-14 border-b border-gray-200 flex flex-col items-center justify-center sticky top-0 z-10 ${
                day.isPast ? 'bg-gray-100' : 'bg-gray-50'
              }`}
            >
              <span className={`text-sm font-semibold ${day.isPast ? 'text-gray-400' : 'text-primary'}`}>
                {day.dayName}
              </span>
              <span className={`text-xs ${day.isPast ? 'text-gray-400' : 'text-gray-500'}`}>{day.shortDate}</span>
            </div>

            {/* Day Body */}
            <div className='relative w-full' style={{ height: `${HOURS.length * HOUR_HEIGHT_PX}px` }}>
              {/* Grid lines & clickable slots */}
              {HOURS.map((hour, idx) => (
                <div
                  key={hour}
                  className={`absolute w-full h-16 border-gray-100 ${idx < HOURS.length - 1 ? 'border-b' : ''} ${
                    day.isPast ? 'bg-gray-50 cursor-default' : 'cursor-pointer hover:bg-accent transition-colors'
                  }`}
                  style={{ top: `${idx * HOUR_HEIGHT_PX}px` }}
                  onClick={() => !day.isPast && onSlotClick?.(day.dateString, hour)}
                ></div>
              ))}

              {/* Render Classes */}
              {(classesByDate[day.dateString] || []).map(({ cls, layout }) => {
                const columnWidthPercent = 100 / layout.columnsCount;
                const leftPercent = columnWidthPercent * layout.column;
                const isVeryShort = layout.height < 46;
                const isCompact = layout.height < 72;
                const classStart = new Date(cls.start_time);
                const classEnd = new Date(cls.end_time);
                const classDate = format(classStart, 'yyyy-MM-dd');
                const classTime = format(classStart, 'HH:mm');

                let className = '';
                let classInstructor = '';
                let classRoom = '';
                let eventType = 'studio_class';
                let id = '';

                if ('event_type' in cls) {
                  // It's an AgendaEvent
                  eventType = cls.event_type;
                  className = cls.metadata['title'] || cls.event_type.replace(/_/g, ' ');
                  classInstructor = cls.metadata['user'] || '';
                  classRoom = cls.room_id || t('schedules:roomNotAvailable');
                  id = `${cls.source_id}-${cls.start_time}`;
                } else {
                  // It's a ScheduledClass
                  className = cls.class_definition?.name || t('schedules:unnamedClass');
                  classInstructor = cls.instructor?.email || t('schedules:instructorDefault');
                  classRoom = cls.room?.name || t('schedules:roomNotAvailable');
                  id = cls.id;
                }

                const isClassPast = scheduleStatus === 'published' && classStart <= new Date();

                let bgClass =
                  'bg-secondary/40 border-secondary hover:bg-secondary/60 hover:border-primary/40 text-primary';

                if (eventType === 'space_rental_external') {
                  bgClass = 'bg-blue-100 border-blue-300 hover:bg-blue-200 hover:border-blue-400 text-blue-900';
                } else if (eventType === 'internal_reserved_use') {
                  bgClass =
                    'bg-purple-100 border-purple-300 hover:bg-purple-200 hover:border-purple-400 text-purple-900';
                } else if (eventType === 'blocked_space') {
                  bgClass = 'bg-red-100 border-red-300 hover:bg-red-200 hover:border-red-400 text-red-900';
                }

                return (
                  <div
                    key={id}
                    onClick={() => !isClassPast && onClassClick?.(cls)}
                    className={`group absolute rounded shadow-sm p-1 z-20 flex flex-col ${
                      isClassPast
                        ? 'bg-gray-100 border border-gray-300 cursor-default opacity-60'
                        : `border cursor-pointer transition-colors ${bgClass}`
                    }`}
                    style={{
                      top: `${layout.top}px`,
                      height: `${layout.height}px`,
                      left: `calc(${leftPercent}% + 2px)`,
                      width: `calc(${columnWidthPercent}% - 4px)`,
                    }}
                    title={classInstructor ? `${className} with ${classInstructor}` : className}
                  >
                    {onAddAtTime && !isClassPast && (
                      <button
                        type='button'
                        className='absolute right-1 top-1 z-30 h-5 w-5 rounded bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90'
                        onClick={event => {
                          event.stopPropagation();
                          onAddAtTime(classDate, classTime);
                        }}
                        title={t('schedules:addAnotherAtTime')}
                      >
                        +
                      </button>
                    )}
                    <div className='overflow-hidden flex flex-col'>
                      <span className='text-xs font-semibold truncate leading-tight'>{className}</span>
                      {!isVeryShort && (
                        <span className='text-[10px] opacity-80 truncate leading-tight'>
                          {format(classStart, 'HH:mm')} - {format(classEnd, 'HH:mm')}
                        </span>
                      )}
                      {!isCompact && classInstructor && (
                        <span className='text-[10px] opacity-70 truncate mt-auto leading-tight'>{classInstructor}</span>
                      )}
                    </div>

                    <div className='pointer-events-none absolute left-1/2 top-0 z-40 hidden w-52 -translate-x-1/2 -translate-y-[110%] rounded-md border border-secondary bg-white p-2 text-xs shadow-lg group-hover:block !text-gray-700'>
                      <p className='font-semibold text-gray-900 truncate'>{className}</p>
                      <p className='mt-1 opacity-80'>
                        {format(classStart, 'HH:mm')} - {format(classEnd, 'HH:mm')}
                      </p>
                      {classInstructor && (
                        <p className='mt-1 truncate'>
                          {t('schedules:instructorLabel', { defaultValue: 'Instructor: ' })}
                          {classInstructor}
                        </p>
                      )}
                      <p className='truncate'>
                        {t('schedules:roomLabel', { defaultValue: 'Room: ' })}
                        {classRoom}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
