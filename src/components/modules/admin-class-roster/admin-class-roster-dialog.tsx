import { useTranslation } from 'react-i18next';

import { AdminRosterTable } from './admin-roster-table';

import { SpinnerLoader } from '@components/loaders';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { splitRosterAttendees } from '@helpers';
import { usePromise } from '@hooks';

interface AdminClassRosterDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classTitle?: string;
}

export function AdminClassRosterDialog({ classId, open, onOpenChange, classTitle }: AdminClassRosterDialogProps) {
  const { t } = useTranslation();
  const { response, isLoading, error, reFetch } = usePromise(
    () => DansshipAPI.bookingsAdmin.getAdminClassRoster(classId),
    Boolean(classId) && open,
    [classId],
  );
  const roster = response?.data;
  const enrolled = roster?.enrolled ?? [];
  const { students, instructorAttendees } = splitRosterAttendees(enrolled);
  const capacity = roster?.capacity ?? 0;
  const hasError = Boolean(error) || Boolean(response && !response.ok);
  const isPastStartTime = Boolean(roster?.start_time && new Date(roster.start_time) < new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[92vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {classTitle ? t('schedules:classRoster', { name: classTitle }) : t('admin:roster.title')}
          </DialogTitle>
          <DialogDescription>
            {isLoading
              ? t('admin:roster.loading')
              : hasError || !roster
                ? t('admin:roster.notFound')
                : t('admin:roster.enrolled', { count: students.length, capacity })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='grid place-content-center py-10'>
            <SpinnerLoader message={t('admin:roster.loading')} />
          </div>
        ) : hasError || !roster ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:roster.notFound')}</p>
        ) : (
          <div className='grid gap-6'>
            {!isPastStartTime ? (
              <p className='text-sm text-muted-foreground'>{t('admin:roster.attendanceNote')}</p>
            ) : null}
            <AdminRosterTable
              attendees={students}
              emptyLabel={t('admin:roster.noStudents')}
              isPastStartTime={isPastStartTime}
              onAttendanceUpdated={() => void reFetch()}
            />
            {instructorAttendees.length > 0 ? (
              <section className='grid gap-3'>
                <h5 className='text-sm font-semibold'>{t('admin:roster.instructorAttendees')}</h5>
                <AdminRosterTable
                  attendees={instructorAttendees}
                  emptyLabel={t('admin:roster.noStudents')}
                  isPastStartTime={isPastStartTime}
                  onAttendanceUpdated={() => void reFetch()}
                />
              </section>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
