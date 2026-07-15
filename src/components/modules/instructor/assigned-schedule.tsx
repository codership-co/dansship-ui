import { format, addDays, parseISO, startOfWeek } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { ClassRoster } from './class-roster';

import { Container } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ScheduleGrid } from '@components/modules';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { DansshipAPI, ScheduledClass } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

// Helpers to get current week Monday string
const getMonday = (d: Date) => {
  return format(startOfWeek(d, { weekStartsOn: 1 }), 'yyyy-MM-dd');
};

const getNextMonday = (mondayStr: string) => {
  return format(addDays(parseISO(mondayStr), 7), 'yyyy-MM-dd');
};

const getPrevMonday = (mondayStr: string) => {
  return format(addDays(parseISO(mondayStr), -7), 'yyyy-MM-dd');
};

export function AssignedSchedule() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const currentWeek = getMonday(new Date());
  const [week, setWeek] = useState(currentWeek);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);

  const { response: instructorSchedule, isLoading: isLoadingInstructorSchedule } = usePromise(
    () => DansshipAPI.instructors.getInstructorWeeklySchedule(week),
    Boolean(week),
  );

  return (
    <section className='grid gap-8'>
      <Container>
        <div className='grid grid-cols-[auto_1fr_auto] items-end gap-2 sm:gap-4'>
          <Button size='small' color='primary' variant='outlined' onClick={() => setWeek(getPrevMonday(week))}>
            <LuChevronLeft className='h-4 w-4' />
            <span className='hidden md:inline'>{t('common:prevWeek')}</span>
          </Button>
          <section className='grid justify-items-center gap-4'>
            <label className='m-0 text-center'>
              {t('schedules:weekOf')}
              {format(new Date(week), 'MMM d, yyyy', { locale })}
            </label>
            <Button
              size='small'
              color='primary'
              disabled={currentWeek === week}
              variant='outlined'
              onClick={() => setWeek(currentWeek)}
            >
              <span className='hidden sm:inline'>{t('common:thisWeek')}</span>
            </Button>
          </section>
          <Button size='small' color='primary' variant='outlined' onClick={() => setWeek(getNextMonday(week))}>
            <span className='hidden md:inline'>{t('common:nextWeek')}</span>
            <LuChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </Container>

      <section className='grid'>
        {isLoadingInstructorSchedule ? (
          <div className='flex justify-center p-12'>
            <SpinnerLoader />
          </div>
        ) : (
          <ScheduleGrid
            weekDate={week}
            classes={instructorSchedule?.data ?? []}
            onClassClick={cls => setSelectedClass(cls as ScheduledClass)}
          />
        )}

        <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
          <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
            <DialogTitle>
              {t('schedules:classRoster', {
                name: selectedClass?.class_definition?.name || t('bookings:classDefault'),
              })}
            </DialogTitle>
            <DialogDescription>{t('schedules:rosterDescription')}</DialogDescription>
            {selectedClass && (
              <ClassRoster
                classId={selectedClass.id}
                className={selectedClass.class_definition?.name || 'Class'}
                startTime={selectedClass.start_time}
              />
            )}
          </DialogContent>
        </Dialog>
      </section>
    </section>
  );
}
