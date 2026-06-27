import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { buildAgendaConflicts, DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function toIsoDayStart(date: Date): string {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  return start.toISOString();
}

function toIsoDayEnd(date: Date): string {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  return end.toISOString();
}

function AdminPage() {
  const { t } = useTranslation();

  const windowRange = useMemo(() => {
    const today = new Date();
    const windowEnd = new Date(today);
    windowEnd.setDate(windowEnd.getDate() + 7);

    return {
      startAt: toIsoDayStart(today),
      endAt: toIsoDayEnd(windowEnd),
      label: `${today.toLocaleDateString()} - ${windowEnd.toLocaleDateString()}`,
    };
  }, []);

  const canReadAgenda = useOrPermissions(AdminPermissions.scheduleBuilder);
  const canManageStudioRental = useOrPermissions(AdminPermissions.studioRental);
  const canReadReports = useOrPermissions(AdminPermissions.reports);
  const canManageAccess = useOrPermissions(AdminPermissions.access);

  const {
    response: listRequests,
    isLoading: isLoadingListRequest,
    error: listRequestError,
    reFetch: getListRequests,
  } = usePromise(
    () =>
      DansshipAPI.studioRentalAdmin.adminListRequests({
        status: 'pending_approval',
      }),
    canManageStudioRental,
  );

  const {
    response: agendaEventsList,
    isLoading: isLoadingAgendaEvents,
    error: agendaEventsError,
    reFetch: getAgendaEvents,
  } = usePromise(
    () =>
      DansshipAPI.schedulesAdmin.getAgendaEvents({
        start_at: windowRange.startAt,
        end_at: windowRange.endAt,
      }),
    canReadAgenda,
  );

  const pendingApprovals = listRequests?.data ?? [];
  const agendaEvents = useMemo(() => agendaEventsList?.data ?? [], [agendaEventsList?.data]);
  const conflicts = useMemo(() => buildAgendaConflicts(agendaEvents), [agendaEvents]);

  const internalReservedUseCount = agendaEvents.filter(event => event.event_type === 'internal_reserved_use').length;
  const blockedSpaceCount = agendaEvents.filter(event => event.event_type === 'blocked_space').length;

  const operations = [
    {
      id: 'agenda',
      to: PageURLS.admin.agenda,
      title: t('admin:workspace.cards.agenda', { defaultValue: 'Unified Agenda' }),
      description: t('admin:workspace.cards.agendaDescription', {
        defaultValue: 'Inspect events and occupancy in one command center.',
      }),
      metric: canReadAgenda ? agendaEvents.length : '-',
      visible: canReadAgenda,
    },
    {
      id: 'schedule',
      to: PageURLS.admin.scheduleBuilder,
      title: t('admin:workspace.cards.scheduleBuilder', { defaultValue: 'Schedule Builder' }),
      description: t('admin:workspace.cards.scheduleBuilderDescription', {
        defaultValue: 'Create and publish class weeks with occupancy safeguards.',
      }),
      metric: canReadAgenda ? conflicts.length : '-',
      visible: canReadAgenda,
    },
    {
      id: 'studio-rental',
      to: PageURLS.admin.studioRental,
      title: t('admin:workspace.cards.studioRental', { defaultValue: 'Studio Rental Ops' }),
      description: t('admin:workspace.cards.studioRentalDescription', {
        defaultValue: 'Handle approvals, reserved use, and blocked-space rules.',
      }),
      metric: pendingApprovals.length,
      visible: canManageStudioRental,
    },
    {
      id: 'reports',
      to: PageURLS.admin.reports,
      title: t('admin:workspace.cards.reports', { defaultValue: 'Reports' }),
      description: t('admin:workspace.cards.reportsDescription', {
        defaultValue: 'Track occupancy, attendance, and operational signals.',
      }),
      metric: blockedSpaceCount,
      visible: canReadReports,
    },
    {
      id: 'access',
      to: PageURLS.admin.access,
      title: t('admin:workspace.cards.access', { defaultValue: 'Access Control' }),
      description: t('admin:workspace.cards.accessDescription', {
        defaultValue: 'Review RBAC policies and role responsibilities.',
      }),
      metric: internalReservedUseCount,
      visible: canManageAccess,
    },
  ].filter(item => item.visible);

  const queueItems = [
    ...pendingApprovals.slice(0, 3).map(request => ({
      id: `approval-${request.id}`,
      severity: 'high',
      title: t('admin:workspace.queue.pendingApproval', {
        defaultValue: 'Pending rental approval',
      }),
      subtitle: `#${request.id.slice(0, 8)} - ${request.slots.length} slot(s)`,
      to: `${PageURLS.admin.studioRental}?tab=approval`,
    })),
    ...conflicts.slice(0, 3).map(conflict => ({
      id: `conflict-${conflict.id}`,
      severity: conflict.severity,
      title: t('admin:workspace.queue.conflictDetected', {
        defaultValue: 'Occupancy conflict detected',
      }),
      subtitle: `${new Date(conflict.overlapStart).toLocaleString()} - ${new Date(
        conflict.overlapEnd,
      ).toLocaleString()}`,
      to: PageURLS.admin.agendaConflicts,
    })),
  ];

  const isLoading = isLoadingListRequest || (canReadAgenda && isLoadingAgendaEvents);
  const isError = listRequestError || (canReadAgenda && agendaEventsError);

  const retryAll = () => {
    void getListRequests();

    if (canReadAgenda) {
      void getAgendaEvents();
    }
  };

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 space-y-6'>
      <header className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-5'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div>
            <h1 className='text-primary'>{t('admin:workspace.title', { defaultValue: 'Admin Workspace' })}</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t('admin:workspace.subtitle', {
                defaultValue: 'Coordinate schedules, rentals, and capacity from a single control point.',
              })}
            </p>
          </div>

          <span className='inline-flex w-fit items-center rounded-full bg-[hsl(var(--surface-container-highest))] px-3 py-1 text-xs font-semibold uppercase tracking-[0.05em] text-primary'>
            {windowRange.label}
          </span>
        </div>

        <div className='mt-4 flex flex-wrap gap-2'>
          {canReadAgenda ? (
            <Button asChild size='sm' variant='outline'>
              <Link to={PageURLS.admin.scheduleBuilder}>
                {t('admin:workspace.actions.createClass', { defaultValue: 'Create Class' })}
              </Link>
            </Button>
          ) : null}
          {canManageStudioRental ? (
            <Button asChild size='sm' variant='outline'>
              <Link to={`${PageURLS.admin.studioRental}?tab=reserved-use`}>
                {t('admin:workspace.actions.addReservedUse', { defaultValue: 'Add Internal Reserved Use' })}
              </Link>
            </Button>
          ) : null}
          {canManageStudioRental ? (
            <Button asChild size='sm' variant='outline'>
              <Link to={`${PageURLS.admin.studioRental}?tab=rules`}>
                {t('admin:workspace.actions.addBlockedSpace', { defaultValue: 'Add Blocked Space' })}
              </Link>
            </Button>
          ) : null}
        </div>
      </header>

      {isError ? (
        <div className='flex flex-col gap-2 rounded bg-[hsl(var(--error-container))] px-4 py-3 text-sm text-destructive md:flex-row md:items-center md:justify-between'>
          <span>
            {t('admin:workspace.error', {
              defaultValue: 'Unable to load one or more admin summary panels.',
            })}
          </span>
          <Button size='sm' variant='outline' onClick={retryAll}>
            {t('admin:workspace.retry', { defaultValue: 'Retry' })}
          </Button>
        </div>
      ) : null}

      <div className='grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <section>
          {isLoading ? (
            <SpinnerLoader
              message={t('admin:workspace.loading', {
                defaultValue: 'Loading operations and agenda summary...',
              })}
            />
          ) : operations.length === 0 ? (
            <p className='rounded bg-[hsl(var(--surface-container-low))] px-4 py-3 text-sm text-muted-foreground'>
              {t('admin:workspace.empty', {
                defaultValue: 'No admin operation cards are available for your permissions yet.',
              })}
            </p>
          ) : (
            <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
              {operations.map(operation => (
                <Link
                  key={operation.id}
                  to={operation.to}
                  className='rounded-[calc(var(--radius)+4px)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
                >
                  <Card className='h-full border-secondary/50 bg-[hsl(var(--surface-container-low))] shadow-sm transition-colors duration-200 hover:bg-[hsl(var(--surface-container))]'>
                    <CardHeader>
                      <CardTitle className='text-primary'>{operation.title}</CardTitle>

                      <CardDescription>{operation.description}</CardDescription>
                    </CardHeader>

                    <CardFooter>
                      <div className='flex w-full items-center justify-between'>
                        <span className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
                          {t('admin:workspace.metric', { defaultValue: 'Metric' })}
                        </span>

                        <span className='text-xl font-semibold text-foreground'>{operation.metric}</span>
                      </div>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        <aside className='rounded-[calc(var(--radius)+4px)] bg-surface-container-low p-4'>
          <h2 className='text-primary'>{t('admin:workspace.queue.title', { defaultValue: 'Attention Queue' })}</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('admin:workspace.queue.subtitle', {
              defaultValue: 'Prioritized items that need immediate follow-up from operations.',
            })}
          </p>

          <div className='mt-4 space-y-2'>
            {isLoading ? (
              <SpinnerLoader
                message={t('admin:workspace.queue.loading', {
                  defaultValue: 'Loading queue...',
                })}
              />
            ) : queueItems.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {t('admin:workspace.queue.empty', {
                  defaultValue: 'No urgent items at the moment.',
                })}
              </p>
            ) : (
              queueItems.map(item => (
                <Link
                  key={item.id}
                  to={item.to}
                  className='block rounded-(--radius) bg-[hsl(var(--surface-container-highest))] px-3 py-2 transition hover:bg-[hsl(var(--surface-container))]'
                >
                  <p className='text-xs uppercase tracking-[0.06em] text-primary'>{item.severity}</p>
                  <p className='text-sm font-semibold text-foreground'>{item.title}</p>
                  <p className='text-xs text-muted-foreground'>{item.subtitle}</p>
                </Link>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

export const SecureAdminPage = SecurityGuard(AdminPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminPageEnabled],
  orPermissions: [
    ...AdminPermissions.access,
    ...AdminPermissions.bookings,
    ...AdminPermissions.figures,
    ...AdminPermissions.inventory,
    ...AdminPermissions.merch,
    ...AdminPermissions.merchPos,
    ...AdminPermissions.payments,
    ...AdminPermissions.reports,
    ...AdminPermissions.scheduleBuilder,
    ...AdminPermissions.studioRental,
  ],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
