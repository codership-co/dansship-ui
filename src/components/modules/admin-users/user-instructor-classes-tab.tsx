import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI, type ScheduledClass } from '@core/api';
import { PageURLS } from '@core/constants';
import { useDateLocale, usePromise } from '@hooks';

function ClassesTable({ classes, emptyLabel }: { classes: Array<ScheduledClass>; emptyLabel: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();

  if (!classes.length) {
    return <p className='py-6 text-center text-sm text-muted-foreground'>{emptyLabel}</p>;
  }

  return (
    <div className='rounded-md border bg-white/50'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:users.details.columns.class')}</TableHead>
            <TableHead>{t('admin:users.details.columns.startTime')}</TableHead>
            <TableHead>{t('admin:users.details.columns.room')}</TableHead>
            <TableHead />
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map(scheduledClass => (
            <TableRow key={scheduledClass.id}>
              <TableCell>{scheduledClass.class_definition?.name ?? '-'}</TableCell>
              <TableCell>{format(parseISO(scheduledClass.start_time), 'MMM d, yyyy HH:mm', { locale })}</TableCell>
              <TableCell>{scheduledClass.room?.name ?? '-'}</TableCell>
              <TableCell className='text-right'>
                <Link to={PageURLS.admin.classRoster(scheduledClass.id)} viewTransition>
                  <Button color='primary' size='small' variant='flat'>
                    {t('admin:users.details.viewRoster')}
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function UserInstructorClassesTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.schedulesAdmin.getInstructorClasses(userId), !!userId);
  const assigned = response?.data?.assigned ?? [];
  const taught = response?.data?.taught ?? [];

  if (isLoading) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  return (
    <div className='grid gap-8'>
      <section className='grid gap-3'>
        <h5 className='text-sm font-semibold'>{t('admin:users.details.assignedClasses')}</h5>
        <ClassesTable classes={assigned} emptyLabel={t('admin:users.details.emptyAssignedClasses')} />
      </section>
      <section className='grid gap-3'>
        <h5 className='text-sm font-semibold'>{t('admin:users.details.taughtClasses')}</h5>
        <ClassesTable classes={taught} emptyLabel={t('admin:users.details.emptyTaughtClasses')} />
      </section>
    </div>
  );
}
