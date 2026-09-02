import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { AdminPageLayout } from '@components/layouts';
import { SpinnerLoader } from '@components/loaders';
import { RetroactiveAttendanceDialog } from '@components/modules';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI, type RosterStudent } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { classLevelLabelKey } from '@helpers';
import { usePromise } from '@hooks';

function rosterClassLevel(student: RosterStudent, t: (key: string) => string) {
  const key = classLevelLabelKey(student.class_level);

  return key ? t(key) : t('admin:roster.noLevel');
}

function AdminClassRosterPage() {
  const { t } = useTranslation();
  const { classId = '' } = useParams<{ classId: string }>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { response, isLoading, error, reFetch } = usePromise(
    () => DansshipAPI.bookingsAdmin.getAdminClassRoster(classId),
    !!classId,
  );
  const roster = response?.data;
  const enrolled = roster?.enrolled ?? [];
  const hasError = Boolean(error) || Boolean(response && !response.ok);
  const canRegisterRetroactive = Boolean(roster?.can_register_retroactive_attendance);

  return (
    <AdminPageLayout
      title={t('admin:roster.title')}
      dataComponent='AdminClassRosterPage'
      actions={
        <div className='flex flex-wrap items-center gap-2'>
          {canRegisterRetroactive ? (
            <Button color='primary' size='small' onClick={() => setIsDialogOpen(true)}>
              {t('admin:roster.registerRetroactive')}
            </Button>
          ) : null}
          <Link to={PageURLS.admin.users} viewTransition>
            <Button color='primary' size='small' variant='flat'>
              {t('admin:users.details.backToList')}
            </Button>
          </Link>
        </div>
      }
    >
      {isLoading ? (
        <div className='grid place-content-center py-16'>
          <SpinnerLoader message={t('admin:roster.loading')} />
        </div>
      ) : hasError || !roster ? (
        <p className='py-12 text-center text-sm text-muted-foreground'>{t('admin:roster.notFound')}</p>
      ) : (
        <div className='grid gap-8'>
          <section className='grid gap-3'>
            <h5 className='text-sm font-semibold'>{t('admin:roster.enrolled', { count: enrolled.length })}</h5>
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
          </section>
        </div>
      )}
      {classId ? (
        <RetroactiveAttendanceDialog
          classId={classId}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          instructorPaymentDocumentIssued={Boolean(roster?.instructor_payment_document_issued)}
          rosterIsEmpty={enrolled.length === 0}
          onRegistered={() => void reFetch()}
        />
      ) : null}
    </AdminPageLayout>
  );
}

export const SecureAdminClassRosterPage = SecurityGuard(AdminClassRosterPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.bookings,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
