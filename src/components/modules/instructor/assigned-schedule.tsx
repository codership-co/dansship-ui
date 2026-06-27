import { format, addDays, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { ClassRoster } from './class-roster';

import { SpinnerLoader } from '@components/loaders';
import { ScheduleGrid } from '@components/modules';
import { Button, Dialog, DialogContent, DialogDescription, DialogTitle } from '@components/ui';
import { DansshipAPI, ScheduledClass } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

// Helpers to get current week Monday string
const getMonday = (d: Date) => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);

  return format(new Date(date.setDate(diff)), 'yyyy-MM-dd');
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
  const [currentWeek, setCurrentWeek] = useState(() => getMonday(new Date()));
  const [selectedClass, setSelectedClass] = useState<ScheduledClass | null>(null);

  const { response: instructorSchedule, isLoading: isLoadingInstructorSchedule } = usePromise(
    () => DansshipAPI.instructors.getInstructorWeeklySchedule(currentWeek),
    Boolean(currentWeek),
  );

  return (
    <div className='space-y-6 bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
      <div className='mb-6 grid grid-cols-[auto_1fr_auto] items-center gap-2 sm:gap-4'>
        <Button
          size='sm'
          className='px-2 sm:px-4 text-xs sm:text-sm'
          aria-label={t('common:prevWeek')}
          onClick={() => setCurrentWeek(getPrevMonday(currentWeek))}
        >
          <LuChevronLeft className='h-4 w-4' />
          <span className='hidden sm:inline'>{t('common:prevWeek')}</span>
        </Button>
        <div className='font-semibold text-base sm:text-lg text-gray-800 text-center'>
          {t('schedules:weekOf')}
          {format(new Date(currentWeek), 'MMM d, yyyy', { locale })}
        </div>
        <Button
          size='sm'
          className='px-2 sm:px-4 text-xs sm:text-sm'
          aria-label={t('common:nextWeek')}
          onClick={() => setCurrentWeek(getNextMonday(currentWeek))}
        >
          <span className='hidden sm:inline'>{t('common:nextWeek')}</span>
          <LuChevronRight className='h-4 w-4' />
        </Button>
      </div>

      {isLoadingInstructorSchedule ? (
        <div className='flex justify-center p-12'>
          <SpinnerLoader />
        </div>
      ) : (
        <ScheduleGrid
          weekDate={currentWeek}
          classes={instructorSchedule?.data ?? []}
          onClassClick={cls => setSelectedClass(cls as ScheduledClass)}
        />
      )}

      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className='max-w-4xl max-h-[90vh] overflow-y-auto'>
          <DialogTitle>
            {t('schedules:classRoster', { name: selectedClass?.class_definition?.name || t('bookings:classDefault') })}
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
    </div>
  );
}
