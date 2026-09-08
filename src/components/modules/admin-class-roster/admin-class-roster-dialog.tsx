import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { DansshipAPI, type RosterStudent } from '@core/api';
import { classLevelLabelKey, rosterStudentName, splitRosterAttendees } from '@helpers';
import { usePromise } from '@hooks';

function rosterClassLevel(student: RosterStudent, t: (key: string) => string) {
  const key = classLevelLabelKey(student.class_level);

  return key ? t(key) : t('admin:roster.noLevel');
}

function AdminRosterTable({ attendees, emptyLabel }: { attendees: Array<RosterStudent>; emptyLabel: string }) {
  const { t } = useTranslation();

  return (
    <div className='rounded-md border bg-white/50'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:roster.studentName')}</TableHead>
            <TableHead>{t('common:email')}</TableHead>
            <TableHead>{t('common:level')}</TableHead>
            <TableHead>{t('common:status')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className='py-6 text-center text-muted-foreground'>
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            attendees.map(student => (
              <TableRow key={student.id}>
                <TableCell>{rosterStudentName(student)}</TableCell>
                <TableCell>{student.user_email || '-'}</TableCell>
                <TableCell>{rosterClassLevel(student, t)}</TableCell>
                <TableCell>{student.status}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

interface AdminClassRosterDialogProps {
  classId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classTitle?: string;
}

export function AdminClassRosterDialog({ classId, open, onOpenChange, classTitle }: AdminClassRosterDialogProps) {
  const { t } = useTranslation();
  const { response, isLoading, error } = usePromise(
    () => DansshipAPI.bookingsAdmin.getAdminClassRoster(classId),
    Boolean(classId) && open,
    [classId],
  );
  const roster = response?.data;
  const enrolled = roster?.enrolled ?? [];
  const { students, instructorAttendees } = splitRosterAttendees(enrolled);
  const capacity = roster?.capacity ?? 0;
  const hasError = Boolean(error) || Boolean(response && !response.ok);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-3xl max-h-[92vh] overflow-y-auto'>
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
            <AdminRosterTable attendees={students} emptyLabel={t('admin:roster.noStudents')} />
            {instructorAttendees.length > 0 ? (
              <section className='grid gap-3'>
                <h5 className='text-sm font-semibold'>{t('admin:roster.instructorAttendees')}</h5>
                <AdminRosterTable attendees={instructorAttendees} emptyLabel={t('admin:roster.noStudents')} />
              </section>
            ) : null}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
