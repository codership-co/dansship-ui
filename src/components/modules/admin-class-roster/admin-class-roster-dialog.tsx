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
import { classLevelLabelKey } from '@helpers';
import { usePromise } from '@hooks';

function rosterClassLevel(student: RosterStudent, t: (key: string) => string) {
  const key = classLevelLabelKey(student.class_level);

  return key ? t(key) : t('admin:roster.noLevel');
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
                : t('admin:roster.enrolled', { count: enrolled.length })}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className='grid place-content-center py-10'>
            <SpinnerLoader message={t('admin:roster.loading')} />
          </div>
        ) : hasError || !roster ? (
          <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:roster.notFound')}</p>
        ) : (
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
                {enrolled.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className='py-6 text-center text-muted-foreground'>
                      {t('admin:roster.noStudents')}
                    </TableCell>
                  </TableRow>
                ) : (
                  enrolled.map(student => (
                    <TableRow key={student.id}>
                      <TableCell>{student.user_name || '-'}</TableCell>
                      <TableCell>{student.user_email || '-'}</TableCell>
                      <TableCell>{rosterClassLevel(student, t)}</TableCell>
                      <TableCell>{student.status}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
