import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { addDaysToFormat, getMonday, getNextMonday, getPrevMonday } from '@helpers';
import { useDateLocale } from '@hooks';

interface WeekSelectorProps {
  week: string;
  setWeek: (week: string) => void;
  children: React.ReactNode;
  disablePastWeeks?: boolean;
}

export function WeekSelector({ week, setWeek, children, disablePastWeeks }: WeekSelectorProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const currentWeek = getMonday(new Date(), true);
  const parsedWeek = parseISO(week);
  const weekEnd = parseISO(addDaysToFormat(week, 6));

  return (
    <div className='grid grid-cols-[auto_1fr_auto] items-end gap-2 sm:gap-4'>
      <Button
        size='small'
        color='primary'
        variant='outlined'
        disabled={disablePastWeeks && parsedWeek <= currentWeek}
        onClick={() => setWeek(getPrevMonday(week))}
      >
        <LuChevronLeft className='h-4 w-4' />
        <span className='hidden md:inline'>{t('common:prevWeek')}</span>
      </Button>
      <section className='grid justify-items-center gap-4'>
        <label className='m-0 text-center'>
          {t('schedules:weekOf')}
          {format(parsedWeek, 'MMM d', { locale })} - {format(weekEnd, 'MMM d, yyyy', { locale })}
        </label>
        {children}
      </section>
      <Button size='small' color='primary' variant='outlined' onClick={() => setWeek(getNextMonday(week))}>
        <span className='hidden md:inline'>{t('common:nextWeek')}</span>
        <LuChevronRight className='h-4 w-4' />
      </Button>
    </div>
  );
}
