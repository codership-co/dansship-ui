import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCalendar } from 'react-icons/lu';

import { ClassRoster } from './class-roster';

import { Container } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ScheduleGrid, WeekSelector } from '@components/modules';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { DansshipAPI, ScheduledClass } from '@core/api';
import { getMonday } from '@helpers';
import { usePromise } from '@hooks';

export function AssignedSchedule() {
  const { t } = useTranslation();
  const currentWeek = getMonday(new Date());
  const [week, setWeek] = useState(currentWeek);
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);

  const { response: instructorSchedule, isLoading: isLoadingInstructorSchedule } = usePromise(
    () => DansshipAPI.instructors.getInstructorWeeklySchedule(week),
    Boolean(week),
    [week],
  );

  return (
    <section className='grid gap-8'>
      <Container>
        <WeekSelector week={week} setWeek={setWeek}>
          <Button
            size='small'
            color='primary'
            disabled={currentWeek === week}
            variant='outlined'
            onClick={() => setWeek(currentWeek)}
          >
            <span className='hidden sm:inline'>{t('common:thisWeek')}</span>
            <LuCalendar className='size-4' />
          </Button>
        </WeekSelector>
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
