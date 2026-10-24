import { useTranslation } from 'react-i18next';
import { LuUsers } from 'react-icons/lu';

import { cn } from '@helpers';

export interface BookingAttendeeOption {
  id: string;
  label: string;
  initials: string | null;
  count: number;
}

interface BookingAttendeeFilterProps {
  value: string;
  options: Array<BookingAttendeeOption>;
  onChange: (id: string) => void;
}

export function BookingAttendeeFilter({ value, options, onChange }: BookingAttendeeFilterProps) {
  const { t } = useTranslation();

  return (
    <section className='mb-8 grid gap-3'>
      <h2 className='m-0 text-[11px] font-semibold tracking-[0.12em] text-muted-foreground uppercase'>
        {t('family:viewBookingsOf')}
      </h2>
      <div className='flex gap-3 overflow-x-auto pb-1'>
        {options.map(option => {
          const selected = option.id === value;

          return (
            <button
              key={option.id}
              type='button'
              aria-pressed={selected}
              onClick={() => onChange(option.id)}
              className={cn(
                'flex shrink-0 items-center gap-3 rounded-2xl border-2 px-4 py-3 text-left transition-colors',
                selected ? 'border-primary bg-primary/10' : 'border-primary/15 bg-white hover:bg-primary/5',
              )}
            >
              {option.initials ? (
                <span className='grid size-10 shrink-0 place-items-center rounded-full bg-primary text-xs font-semibold text-white'>
                  {option.initials}
                </span>
              ) : (
                <span className='grid size-10 shrink-0 place-items-center rounded-full border-2 border-primary text-primary'>
                  <LuUsers className='size-4' />
                </span>
              )}
              <span className='grid'>
                <span className='text-sm font-semibold'>{option.label}</span>
                <span className='text-xs text-muted-foreground'>
                  {t('family:upcomingCount', { count: option.count })}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
