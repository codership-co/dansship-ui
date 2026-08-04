import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { AdminPageLayout } from '@components/layouts';
import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { useDateLocale, usePromise } from '@hooks';

function AdminClassRosterPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { classId = '' } = useParams<{ classId: string }>();
  const { response, isLoading, error } = usePromise(
    () => DansshipAPI.bookingsAdmin.getAdminClassRoster(classId),
    !!classId,
  );
  const roster = response?.data;
  const enrolled = roster?.enrolled ?? [];
  const waitlisted = roster?.waitlisted ?? [];
  const hasError = Boolean(error) || Boolean(response && !response.ok);

  return (
    <AdminPageLayout
      title={t('admin:roster.title')}
      dataComponent='AdminClassRosterPage'
      actions={
        <Link to={PageURLS.admin.users} viewTransition>
          <Button color='primary' size='small' variant='flat'>
            {t('admin:users.details.backToList')}
          </Button>
        </Link>
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
                    <TableHead>{t('common:status')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrolled.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className='py-6 text-center text-muted-foreground'>
                        {t('admin:roster.noStudents')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    enrolled.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.user_name || '-'}</TableCell>
                        <TableCell>{student.user_email || '-'}</TableCell>
                        <TableCell>{student.status}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>

          <section className='grid gap-3'>
            <h5 className='text-sm font-semibold'>{t('admin:roster.waitlist', { count: waitlisted.length })}</h5>
            <div className='rounded-md border bg-white/50'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('admin:roster.studentName')}</TableHead>
                    <TableHead>{t('common:email')}</TableHead>
                    <TableHead>{t('admin:roster.joinedAt')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {waitlisted.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className='py-6 text-center text-muted-foreground'>
                        {t('admin:roster.noWaitlist')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    waitlisted.map(student => (
                      <TableRow key={student.id}>
                        <TableCell>{student.user_name || '-'}</TableCell>
                        <TableCell>{student.user_email || '-'}</TableCell>
                        <TableCell>{format(parseISO(student.created_at), 'MMM d, yyyy HH:mm', { locale })}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </section>
        </div>
      )}
    </AdminPageLayout>
  );
}

export const SecureAdminClassRosterPage = SecurityGuard(AdminClassRosterPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.bookings,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
