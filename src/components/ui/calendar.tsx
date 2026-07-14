import { DayPicker, DayPickerProps } from 'react-day-picker';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { buttonVariants } from '@components/ui/button';
import { cn } from '@helpers';

export const Calendar = ({ className, classNames, showOutsideDays = true, ...props }: DayPickerProps) => {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('relative p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'my-2 flex-1',
        month_caption: 'flex justify-center py-1 items-center',
        caption_label: 'text-sm font-medium sr-only',
        dropdowns: 'relative inline-flex items-center gap-2 mb-4',
        nav: 'items-top',
        button_previous: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 absolute left-8 top-5',
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0 opacity-50 absolute right-4 top-5',
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'text-neutral-500 rounded-md w-9 font-normal text-[0.8rem] dark:text-neutral-400',
        week: 'flex w-full mt-2',
        day: 'h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-primary [&:has([aria-selected])]:bg-primary first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20 dark:[&:has([aria-selected].day-outside)]:bg-neutral-800/50 dark:[&:has([aria-selected])]:bg-neutral-800',
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-none hover:bg-primary hover:text-white',
        ),
        range_end: 'day-range-end',
        selected: 'bg-primary text-neutral-50 hover:bg-primary',
        outside:
          'day-outside text-neutral-500 opacity-50 aria-selected:bg-neutral-100/50 aria-selected:text-neutral-500 aria-selected:opacity-30 dark:text-neutral-400 dark:aria-selected:bg-neutral-800/50 dark:aria-selected:text-neutral-400',
        disabled: 'text-neutral-500 opacity-50 dark:text-neutral-400',
        range_middle: 'aria-selected:bg-accent aria-selected:text-neutral-900 aria-selected:rounded-none',
        hidden: 'invisible',
        ...classNames,
      }}
      components={{
        Chevron: props => {
          // eslint-disable-next-line react/prop-types,react/destructuring-assignment
          if (props.orientation === 'left') {
            return <LuChevronLeft className='size-4' />;
          }

          return <LuChevronRight className='size-4' />;
        },
      }}
      {...props}
    />
  );
};
