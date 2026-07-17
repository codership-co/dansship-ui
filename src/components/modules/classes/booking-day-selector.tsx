import { format, parseISO } from 'date-fns';
import { cn, toCapitalize } from 'polpo/helpers';
import { useTranslation } from 'react-i18next';

import { PublishedClass } from '@core/api';
import { useDateLocale } from '@hooks';

interface BookingDaySelectorProps {
  day: string;
  classes: Array<PublishedClass>;
  activeDay: string | undefined;
  setActiveDay: () => void;
}

export function BookingDaySelector({ day, classes, activeDay, setActiveDay }: BookingDaySelectorProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();

  return (
    <section
      onClick={classes.length ? () => setActiveDay() : undefined}
      className={cn(
        'flex items-center justify-center text-center py-4 px-2 md:py-8 md:px-4 select-none rounded-2xl transition-all',
        // eslint-disable-next-line quotes
        "relative after:content-[''] after:absolute after:top-full after:opacity-0 after:left-1/2 after:-translate-x-1/2 after:-translate-y-full after:border-t-tertiary/20 after:transition-all after:border-x-transparent",
        classes.length && 'text-accent-700',
        classes.length && activeDay !== day && 'hover:bg-tertiary/10 hover:text-primary cursor-pointer',
        !classes.length && 'text-gray-300',
        'after:border-t-10 after:border-x-15',
        'xs:after:border-t-14 xs:after:border-x-22',
        classes.length && activeDay === day && 'bg-tertiary/20 text-primary after:translate-y-0 after:opacity-100',
      )}
    >
      <section className='grid lg:border-r lg:border-r-solid lg:pr-2 lg:mr-2'>
        <p className='m-0 font-bold inline-block rotate-90 xs:rotate-0'>
          {toCapitalize(format(parseISO(day), 'EEE', { locale }))}
        </p>
        <span className='m-0 hidden sm:inline-block text-label whitespace-nowrap'>
          {format(parseISO(day), 'MMM d', { locale })}
        </span>
      </section>
      <section className='hidden lg:grid content-center'>
        <h3 className='m-0 leading-[1em]'>{classes.length}</h3>
        <small className='m-0'>
          {t('bookings:classes', {
            count: classes.length,
          })}
        </small>
      </section>
    </section>
  );
}
