import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { TallerRoster } from '../admin-talleres/taller-roster';

import { AdminRosterTable } from './admin-roster-table';
import { RetroactiveAttendanceDialog } from './retroactive-attendance-dialog';

import { SpinnerLoader } from '@components/loaders';
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { splitRosterAttendees } from '@helpers';
import { usePromise } from '@hooks';

interface AdminClassRosterDialogProps {
  kind: 'class' | 'workshop';
  id: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

export function AdminClassRosterDialog({ kind, id, open, onOpenChange, title }: AdminClassRosterDialogProps) {
  const { t } = useTranslation();
  const [isRetroactiveOpen, setIsRetroactiveOpen] = useState(false);
  const isClass = kind === 'class';
  const {
    response: classResponse,
    isLoading: isLoadingClass,
    error: classError,
    reFetch: reFetchClass,
  } = usePromise(() => DansshipAPI.bookingsAdmin.getAdminClassRoster(id), Boolean(id) && open && isClass, [id, kind]);
  const {
    response: workshopResponse,
    isLoading: isLoadingWorkshop,
    error: workshopError,
  } = usePromise(() => DansshipAPI.talleresAdmin.listRoster(id), Boolean(id) && open && !isClass, [id, kind]);

  const roster = classResponse?.data;
  const enrolled = roster?.enrolled ?? [];
  const { students, instructorAttendees } = splitRosterAttendees(enrolled);
  const capacity = roster?.capacity ?? 0;
  const workshopRows = workshopResponse?.data ?? [];
  const isLoading = isClass ? isLoadingClass : isLoadingWorkshop;
  const hasError = isClass
    ? Boolean(classError) || Boolean(classResponse && !classResponse.ok)
    : Boolean(workshopError) || Boolean(workshopResponse && !workshopResponse.ok);
  const isPastStartTime = Boolean(roster?.start_time && new Date(roster.start_time) < new Date());
  const canRegisterRetroactive = Boolean(roster?.can_register_retroactive_attendance);

  useEffect(() => {
    if (!open) {
      setIsRetroactiveOpen(false);
    }
  }, [open]);

  const classTitle = title ? t('schedules:classRoster', { name: title }) : t('admin:roster.title');
  const workshopTitle = title ? t('schedules:workshopRoster', { name: title }) : t('talleres:admin.roster');

  return (
    <>
      <Dialog open={open} onOpenChange={nextOpen => !isRetroactiveOpen && onOpenChange(nextOpen)}>
        <DialogContent className='sm:max-w-4xl max-h-[92vh] overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>{isClass ? classTitle : workshopTitle}</DialogTitle>
            <DialogDescription>
              {isLoading
                ? t('admin:roster.loading')
                : hasError
                  ? t('admin:roster.notFound')
                  : isClass
                    ? !roster
                      ? t('admin:roster.notFound')
                      : t('admin:roster.enrolled', { count: students.length, capacity })
                    : t('talleres:admin.rosterEnrolled', { count: workshopRows.length })}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className='grid place-content-center py-10'>
              <SpinnerLoader message={t('admin:roster.loading')} />
            </div>
          ) : hasError || (isClass && !roster) ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:roster.notFound')}</p>
          ) : isClass ? (
            <div className='grid gap-6'>
              {canRegisterRetroactive ? (
                <div>
                  <Button type='button' onClick={() => setIsRetroactiveOpen(true)}>
                    {t('admin:roster.registerRetroactive')}
                  </Button>
                </div>
              ) : null}
              {!isPastStartTime ? (
                <p className='text-sm text-muted-foreground'>{t('admin:roster.attendanceNote')}</p>
              ) : null}
              <AdminRosterTable
                attendees={students}
                emptyLabel={t('admin:roster.noStudents')}
                isPastStartTime={isPastStartTime}
                onAttendanceUpdated={() => void reFetchClass()}
              />
              {instructorAttendees.length > 0 ? (
                <section className='grid gap-3'>
                  <h5 className='text-sm font-semibold'>{t('admin:roster.instructorAttendees')}</h5>
                  <AdminRosterTable
                    attendees={instructorAttendees}
                    emptyLabel={t('admin:roster.noStudents')}
                    isPastStartTime={isPastStartTime}
                    onAttendanceUpdated={() => void reFetchClass()}
                  />
                </section>
              ) : null}
            </div>
          ) : (
            <TallerRoster rows={workshopRows} />
          )}
        </DialogContent>
      </Dialog>
      {isClass && id ? (
        <RetroactiveAttendanceDialog
          classId={id}
          open={isRetroactiveOpen}
          onOpenChange={setIsRetroactiveOpen}
          instructorPaymentDocumentIssued={Boolean(roster?.instructor_payment_document_issued)}
          rosterIsEmpty={enrolled.length === 0}
          willReopenAutoCancelledClass={Boolean(roster?.will_reopen_auto_cancelled_class)}
          onRegistered={() => void reFetchClass()}
        />
      ) : null}
    </>
  );
}
