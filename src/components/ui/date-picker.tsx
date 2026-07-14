'use client';

import { format } from 'date-fns';
import { useState } from 'react';
import { ClassNames, DateRange, PropsBase } from 'react-day-picker';
import { LuCalendar as CalendarIcon } from 'react-icons/lu';

import { Button } from './button';
import { Calendar } from './calendar';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

import { cn } from '@helpers';

/**
 * Controls the calendar system used to anchor the `Date`(s) passed to
 * `onDateChange` / `onDateRangeChange`.
 * - `'utc'` (default): the picked calendar day is re-anchored to **UTC**
 *   midnight (`Date.UTC(y, m, d)`), so every viewer resolves to the same
 *   calendar day regardless of timezone offset. Callers that echo the value
 *   back into `date` / `dateRange` for display should convert it to a local
 *   `Date` first (e.g. `utcIsoToDisplayDate`).
 * - `'local'`: the `Date` is emitted verbatim at **local** midnight, as
 *   produced by the calendar — the day reflects the viewer's local timezone.
 */
export type DateRangeBoundary = 'utc' | 'local';

/**
 * Re-anchors the picked calendar day per {@link DateRangeBoundary}. The
 * calendar always yields a local-midnight `Date`; `'utc'` shifts that same
 * year/month/day to UTC midnight, `'local'` passes it through untouched.
 */
function applyBoundary(date: Date, boundary: DateRangeBoundary): Date {
  if (boundary === 'local') {
    return date;
  }

  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

interface BaseDatePickerProps extends PropsBase {
  /** Caption layout for month/year navigation */
  captionLayout?: 'dropdown' | 'label' | 'dropdown-months' | 'dropdown-years';
  /** Earliest selectable month */
  startMonth?: Date;
  /** Latest selectable month */
  endMonth?: Date;
  /** Custom class names for calendar styling */
  classNames?: Partial<ClassNames>;
  /** Placeholder text when no date is selected */
  placeholder?: string;
  /** Date format string (date-fns format) */
  dateFormat?: string;
  /** Whether the date trigger is disabled */
  triggerButtonDisabled?: boolean;
  /** Defaults to `'utc'`. See {@link DateRangeBoundary} for semantics. */
  boundary?: DateRangeBoundary;
}

export interface SingleDatePickerProps extends BaseDatePickerProps {
  /** Selection mode */
  mode?: 'single';
  /** The selected date value */
  date?: Date;
  /** Callback when date changes */
  onDateChange: (date: Date | undefined) => void;
}

export interface RangeDatePickerProps extends BaseDatePickerProps {
  /** Selection mode - must be 'range' for date range selection */
  mode: 'range';
  /** The selected date range value */
  dateRange?: DateRange;
  /** Callback when date range changes */
  onDateRangeChange: (range: DateRange | undefined) => void;
}

export type DatePickerProps = SingleDatePickerProps | RangeDatePickerProps;

function isRangeMode(props: DatePickerProps): props is RangeDatePickerProps {
  return props.mode === 'range';
}

export const DatePicker = (props: DatePickerProps) => {
  const {
    captionLayout = 'dropdown',
    startMonth,
    endMonth,
    classNames,
    placeholder = 'Pick a date',
    disabled,
    dateFormat = 'PPP',
    triggerButtonDisabled = false,
    boundary = 'utc',
  } = props;

  const [open, setOpen] = useState(false);

  // Handle range mode
  if (isRangeMode(props)) {
    const { dateRange, onDateRangeChange } = props;

    const handleRangeSelect = (selectedRange: DateRange | undefined) => {
      onDateRangeChange(
        selectedRange && {
          from: selectedRange.from ? applyBoundary(selectedRange.from, boundary) : undefined,
          to: selectedRange.to ? applyBoundary(selectedRange.to, boundary) : undefined,
        },
      );
    };

    const formatRangeDisplay = () => {
      if (!dateRange?.from) {
        return <span>{placeholder}</span>;
      }

      if (!dateRange.to) {
        return format(dateRange.from, dateFormat);
      }

      return `${format(dateRange.from, dateFormat)} - ${format(dateRange.to, dateFormat)}`;
    };

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant='outline'
            className={cn('w-full justify-start text-left font-normal', !dateRange?.from && 'text-muted-foreground')}
            disabled={triggerButtonDisabled}
          >
            <CalendarIcon className='mr-2 size-4' />
            {formatRangeDisplay()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0'>
          <Calendar
            mode='range'
            selected={dateRange}
            disabled={disabled}
            defaultMonth={dateRange?.from}
            onSelect={handleRangeSelect}
            captionLayout={captionLayout}
            startMonth={startMonth}
            endMonth={endMonth}
            classNames={classNames}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    );
  }

  // Handle single mode (default)
  const { date, onDateChange } = props;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    onDateChange(selectedDate ? applyBoundary(selectedDate, boundary) : undefined);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}
          disabled={triggerButtonDisabled}
        >
          <CalendarIcon className='mr-2 size-4' />
          {date ? format(date, dateFormat) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0'>
        <Calendar
          mode='single'
          disabled={disabled}
          selected={date}
          defaultMonth={date}
          onSelect={handleDateSelect}
          captionLayout={captionLayout}
          startMonth={startMonth}
          endMonth={endMonth}
          classNames={classNames}
        />
      </PopoverContent>
    </Popover>
  );
};
