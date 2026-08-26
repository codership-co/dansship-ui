import { format, parseISO, addDays, isBefore, startOfDay } from 'date-fns';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClipboardList } from 'react-icons/lu';

import { useDateLocale } from '@hooks';

import type { ScheduledClass, AgendaEvent, ScheduleStatus } from '@core/api';

export type GridEvent = ScheduledClass | AgendaEvent;

export type HourRangeSelection = {
  date: string;
  /** Inclusive start hour (0–23). */
  startHour: number;
  /** Exclusive end hour (0–23), e.g. 9→11 means 09:00–11:00. */
  endHour: number;
};

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
  /** Admin-only: open the class roster without leaving the calendar. */
  onViewRoster?: (classId: string) => void;
  dayColumnMinWidth?: number;
  scheduleStatus?: ScheduleStatus;
  /** Emphasizes a specific scheduled class in the grid (e.g. next upcoming). */
  highlightedClassId?: string | null;
  /** Google Calendar-style drag to select consecutive free hours. */
  enableRangeSelect?: boolean;
  rangeSelection?: HourRangeSelection | null;
  onRangeSelect?: (selection: HourRangeSelection) => void;
}

// 6 AM to 9 PM
const HOURS = Array.from({ length: 16 }, (_, i) => i + 6);
const HOUR_HEIGHT_PX = 64;
const GRID_START_HOUR = 6;
const GRID_END_HOUR = 22;

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

function hourOverlapsOccupied(dateString: string, hour: number, events: Array<GridEvent>): boolean {
  const slotStart = hour;
  const slotEnd = hour + 1;

  return events.some(event => {
    const start = new Date(getStartTime(event));
    const end = new Date(getEndTime(event));

    if (format(start, 'yyyy-MM-dd') !== dateString) {
      return false;
    }

    const eventStartHour = start.getHours() + start.getMinutes() / 60;
    const eventEndHour = end.getHours() + end.getMinutes() / 60 + (end.getSeconds() > 0 ? 1 / 3600 : 0);

    return eventStartHour < slotEnd && eventEndHour > slotStart;
  });
}

function clampRangeToFreeHours(
  dateString: string,
  anchorHour: number,
  targetHour: number,
  events: Array<GridEvent>,
): HourRangeSelection | null {
  const low = Math.min(anchorHour, targetHour);
  const high = Math.max(anchorHour, targetHour);

  if (hourOverlapsOccupied(dateString, anchorHour, events)) {
    return null;
  }

  let start = anchorHour;
  let endExclusive = anchorHour + 1;

  if (targetHour >= anchorHour) {
    for (let hour = anchorHour + 1; hour <= high; hour += 1) {
      if (hour >= GRID_END_HOUR || hourOverlapsOccupied(dateString, hour, events)) {
        break;
      }

      endExclusive = hour + 1;
    }
  } else {
    for (let hour = anchorHour - 1; hour >= low; hour -= 1) {
      if (hour < GRID_START_HOUR || hourOverlapsOccupied(dateString, hour, events)) {
        break;
      }

      start = hour;
    }
  }

  return { date: dateString, startHour: start, endHour: endExclusive };
}

function hourFromClientY(columnEl: HTMLElement, clientY: number): number {
  const y = clientY - columnEl.getBoundingClientRect().top;
  const raw = GRID_START_HOUR + Math.floor(y / HOUR_HEIGHT_PX);

  return Math.min(GRID_END_HOUR - 1, Math.max(GRID_START_HOUR, raw));
}

function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function ScheduleGrid({
  weekDate,
  classes = [],
  events = [],
  onSlotClick,
  onClassClick,
  onAddAtTime,
  onViewRoster,
  dayColumnMinWidth = 150,
  scheduleStatus,
  highlightedClassId,
  enableRangeSelect = false,
  rangeSelection = null,
  onRangeSelect,
}: ScheduleGridProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const dragAnchorRef = useRef<{ date: string; hour: number } | null>(null);
  const draftSelectionRef = useRef<HourRangeSelection | null>(null);
  const allEventsRef = useRef<Array<GridEvent>>([]);
  const onRangeSelectRef = useRef(onRangeSelect);
  const [draftSelection, setDraftSelection] = useState<HourRangeSelection | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    /*
     * Schedule builder passes classes + rental overlay events separately; merge both.
     * Other surfaces pass only one of the two props.
     */
    if (events.length === 0) {
      return classes;
    }

    if (classes.length === 0) {
      return events;
    }

    return [...classes, ...events];
  }, [events, classes]);

  allEventsRef.current = allEvents;
  onRangeSelectRef.current = onRangeSelect;

  const setDraft = (next: HourRangeSelection | null) => {
    draftSelectionRef.current = next;
    setDraftSelection(next);
  };

  useEffect(() => {
    if (!enableRangeSelect) {
      return;
    }

    const handlePointerMove = (event: PointerEvent) => {
      const anchor = dragAnchorRef.current;

      if (!anchor) {
        return;
      }

      const column = document.querySelector(`[data-range-day="${anchor.date}"]`);

      if (!(column instanceof HTMLElement)) {
        return;
      }

      event.preventDefault();
      const hour = hourFromClientY(column, event.clientY);
      const next = clampRangeToFreeHours(anchor.date, anchor.hour, hour, allEventsRef.current);

      if (next) {
        setDraft(next);
      }
    };

    const handlePointerUp = () => {
      if (!dragAnchorRef.current) {
        return;
      }

      dragAnchorRef.current = null;
      setIsDragging(false);
      const draft = draftSelectionRef.current;

      if (draft) {
        onRangeSelectRef.current?.(draft);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [enableRangeSelect]);

  const classesByDate = useMemo(() => {
    const dict: Record<string, Array<GridEvent>> = {};
    allEvents.forEach(c => {
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

  const activeSelection = draftSelection ?? rangeSelection;

  const beginRangeSelect = (dateString: string, hour: number) => {
    if (!enableRangeSelect) {
      return;
    }

    const next = clampRangeToFreeHours(dateString, hour, hour, allEvents);

    if (!next) {
      return;
    }

    dragAnchorRef.current = { date: dateString, hour };
    setIsDragging(true);
    setDraft(next);
  };

  return (
    <div className='flex bg-white rounded-xl shadow-xl border border-gray-200 overflow-auto'>
      <div className='w-16 shrink-0 border-r border-gray-200 bg-gray-50'>
        <div className='h-14 border-b border-gray-200'></div>
        <div className='relative' style={{ height: `${HOURS.length * HOUR_HEIGHT_PX}px` }}>
          {HOURS.map(hour => (
            <div
              key={hour}
              className='absolute w-full text-right pr-2 text-xs text-gray-500 -translate-y-1/2'
              style={{ top: `${(hour - GRID_START_HOUR) * HOUR_HEIGHT_PX}px` }}
            >
              {hour}:00
            </div>
          ))}
        </div>
      </div>

      <div className='flex-1 flex overflow-x-auto'>
        {days.map((day, i) => (
          <div
            key={day.dateString}
            className={`flex-1 ${i < 6 ? 'border-r border-gray-200' : ''}`}
            style={{ minWidth: `${dayColumnMinWidth}px` }}
          >
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

            <div
              data-range-day={day.dateString}
              className={`relative w-full select-none ${enableRangeSelect ? 'touch-none' : ''} ${
                isDragging && enableRangeSelect ? 'cursor-grabbing' : ''
              }`}
              style={{ height: `${HOURS.length * HOUR_HEIGHT_PX}px` }}
              onPointerDown={event => {
                if (!enableRangeSelect || day.isPast) {
                  return;
                }

                const hour = hourFromClientY(event.currentTarget, event.clientY);

                if (hourOverlapsOccupied(day.dateString, hour, allEvents)) {
                  return;
                }

                event.preventDefault();
                beginRangeSelect(day.dateString, hour);
              }}
            >
              {HOURS.map((hour, idx) => {
                const occupied = hourOverlapsOccupied(day.dateString, hour, allEvents);

                return (
                  <div
                    key={hour}
                    className={`absolute w-full h-16 border-gray-100 ${idx < HOURS.length - 1 ? 'border-b' : ''} ${
                      day.isPast
                        ? 'bg-gray-50 cursor-default'
                        : occupied
                          ? 'cursor-not-allowed'
                          : `cursor-pointer hover:bg-accent/40 ${enableRangeSelect ? '' : 'transition-colors'}`
                    }`}
                    style={{ top: `${idx * HOUR_HEIGHT_PX}px` }}
                    onPointerDown={event => {
                      if (enableRangeSelect || day.isPast || occupied) {
                        return;
                      }

                      onSlotClick?.(day.dateString, hour);
                      event.stopPropagation();
                    }}
                  ></div>
                );
              })}

              {activeSelection && activeSelection.date === day.dateString ? (
                <div
                  className='pointer-events-none absolute inset-x-1 z-30 overflow-hidden rounded-md border-2 border-primary bg-primary/20 shadow-sm'
                  style={{
                    top: `${(activeSelection.startHour - GRID_START_HOUR) * HOUR_HEIGHT_PX}px`,
                    height: `${Math.max(activeSelection.endHour - activeSelection.startHour, 1) * HOUR_HEIGHT_PX}px`,
                  }}
                >
                  <span className='absolute left-2 top-1 text-[11px] font-semibold text-primary'>
                    {formatHourLabel(activeSelection.startHour)} – {formatHourLabel(activeSelection.endHour)}
                  </span>
                </div>
              ) : null}

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
                  eventType = cls.event_type;
                  className = cls.metadata['title'] || cls.event_type.replace(/_/g, ' ');
                  classInstructor = cls.metadata['teacher'] || '';
                  classRoom = cls.room_id || t('schedules:roomNotAvailable');
                  id = `${cls.source_id}-${cls.start_time}`;
                } else {
                  className = cls.class_definition?.name || t('schedules:unnamedClass');
                  classInstructor = cls.instructor?.email || t('schedules:instructorTBA');
                  classRoom = cls.room?.name || t('schedules:roomNotAvailable');
                  id = cls.id;
                }

                const isClassPast = scheduleStatus === 'published' && classStart <= new Date();
                const isClassCancelled =
                  eventType === 'studio_class'
                    ? Boolean((cls as AgendaEvent).metadata?.is_cancelled === 'true')
                    : Boolean((cls as ScheduledClass).is_cancelled);
                const isMuted = isClassPast || isClassCancelled;
                const isHighlighted = Boolean(highlightedClassId && id === highlightedClassId);
                const occupancyKind = 'event_type' in cls ? cls.metadata?.kind : undefined;
                const scheduledClassId = 'event_type' in cls ? null : cls.id;
                const showRosterIcon = Boolean(onViewRoster && scheduledClassId);

                let bgClass =
                  'bg-secondary/40 border-secondary hover:bg-secondary/60 hover:border-primary/40 text-primary';

                if (isHighlighted) {
                  bgClass =
                    'bg-primary/15 border-primary ring-2 ring-primary/40 hover:bg-primary/25 hover:border-primary text-primary';
                } else if (occupancyKind === 'free') {
                  bgClass =
                    'bg-emerald-100 border-emerald-300 hover:bg-emerald-200 hover:border-emerald-400 text-emerald-950';
                } else if (occupancyKind === 'occupied' || eventType === 'blocked_space') {
                  bgClass = 'bg-red-100 border-red-300 hover:bg-red-200 hover:border-red-400 text-red-900';
                } else if (eventType === 'space_rental_external') {
                  bgClass = 'bg-blue-100 border-blue-300 hover:bg-blue-200 hover:border-blue-400 text-blue-900';
                } else if (eventType === 'internal_reserved_use') {
                  bgClass =
                    'bg-purple-100 border-purple-300 hover:bg-purple-200 hover:border-purple-400 text-purple-900';
                }

                return (
                  <div
                    key={id}
                    onClick={() => (isClassCancelled || !isClassPast) && onClassClick?.(cls)}
                    className={`group absolute rounded shadow-sm p-1 z-20 flex flex-col ${
                      enableRangeSelect ? 'pointer-events-none' : ''
                    } ${
                      isMuted
                        ? `bg-gray-100 border border-gray-300 opacity-60 ${isClassCancelled ? 'cursor-pointer' : 'cursor-default'}`
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
                    {showRosterIcon && scheduledClassId ? (
                      <button
                        type='button'
                        className='absolute left-1 top-1 z-30 flex h-5 w-5 pointer-events-auto items-center justify-center rounded bg-primary text-primary-foreground hover:bg-primary/90'
                        onClick={event => {
                          event.stopPropagation();
                          onViewRoster?.(scheduledClassId);
                        }}
                        title={t('admin:users.details.viewRoster')}
                        aria-label={t('admin:users.details.viewRoster')}
                      >
                        <LuClipboardList className='h-3 w-3' aria-hidden />
                      </button>
                    ) : null}
                    {onAddAtTime && !isMuted && (
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
                    <div className={`overflow-hidden flex flex-col ${showRosterIcon ? 'pl-6' : ''}`}>
                      <span className='text-xs font-semibold truncate leading-tight'>{className}</span>
                      {isClassCancelled && (
                        <span className='text-[10px] font-semibold uppercase text-gray-500 truncate leading-tight'>
                          {t('schedules:classCancelledBadge')}
                        </span>
                      )}
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
