import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { Button } from '@components/ui/button';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui/card';
import { useAuth, useOrPermissions } from '@contexts';
import { buildAgendaConflicts, DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { toIsoDayStart, toIsoDayEnd } from '@helpers';
import { usePromise } from '@hooks';

export const HomeAdminDashboard = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const canAccessAnyAdminArea = useOrPermissions([
    ...AdminPermissions.scheduleManage,
    ...AdminPermissions.inventory,
    ...AdminPermissions.bookings,
    ...AdminPermissions.payments,
    ...AdminPermissions.merch,
    ...AdminPermissions.merchPos,
    ...AdminPermissions.figures,
    ...AdminPermissions.reports,
    ...AdminPermissions.studioRental,
  ]);
  const canReadAgenda = useOrPermissions(AdminPermissions.scheduleManage);
  const canManageStudioRental = useOrPermissions(AdminPermissions.studioRental);

  const adminWindow = useMemo(() => {
    const today = new Date();
    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);

    return {
      startAt: toIsoDayStart(today),
      endAt: toIsoDayEnd(weekEnd),
    };
  }, []);

  const {
    response: adminListResponse,
    isLoading: isAdminListLoading,
    reFetch: adminListRefetch,
    error: adminListError,
  } = usePromise(
    () =>
      DansshipAPI.studioRentalAdmin.adminListRequests({
        status: 'pending_payment',
      }),
    isAuthenticated && canManageStudioRental,
  );
  const {
    response: adminAgendaResponse,
    isLoading: isAdminAgendaLoading,
    reFetch: adminAgendaRefetch,
  } = usePromise(
    () =>
      DansshipAPI.schedulesAdmin.getAgendaEvents({
        start_at: adminWindow.startAt,
        end_at: adminWindow.endAt,
      }),
    isAuthenticated && canReadAgenda,
  );

  const adminAgendaEvents = useMemo(() => adminAgendaResponse?.data ?? [], [adminAgendaResponse?.data]);
  const adminConflicts = useMemo(() => buildAgendaConflicts(adminAgendaEvents), [adminAgendaEvents]);

  const adminCards = [
    {
      id: 'agenda',
      to: PageURLS.admin.agenda,
      label: t('home:admin.cards.unifiedAgenda'),
      description: t('home:admin.cards.unifiedAgendaDescription'),
      metric: canReadAgenda ? adminAgendaEvents.length : '-',
      visible: canReadAgenda,
    },
    {
      id: 'pending-payment',
      to: `${PageURLS.admin.studioRental}?tab=pricing`,
      label: t('home:admin.cards.pendingPayments'),
      description: t('home:admin.cards.pendingPaymentsDescription'),
      metric: adminListResponse?.data?.length ?? 0,
      visible: canManageStudioRental,
    },
    {
      id: 'reserved-use',
      to: `${PageURLS.admin.studioRental}?tab=reserved-use`,
      label: t('home:admin.cards.internalReservedUse'),
      description: t('home:admin.cards.internalReservedUseDescription'),
      metric: canReadAgenda
        ? adminAgendaEvents.filter(event => event.event_type === 'internal_reserved_use').length
        : '-',
      visible: canManageStudioRental,
    },
    {
      id: 'rules',
      to: `${PageURLS.admin.studioRental}?tab=blocks`,
      label: t('home:admin.cards.blockedSpaces'),
      description: t('home:admin.cards.blockedSpacesDescription'),
      metric: canReadAgenda ? adminAgendaEvents.filter(event => event.event_type === 'blocked_space').length : '-',
      visible: canManageStudioRental,
    },
    {
      id: 'conflicts',
      to: PageURLS.admin.agendaConflicts,
      label: t('home:admin.cards.occupancyConflicts'),
      description: t('home:admin.cards.occupancyConflictsDescription'),
      metric: canReadAgenda ? adminConflicts.length : '-',
      visible: canReadAgenda,
    },
  ].filter(card => card.visible);

  const adminLoading =
    (isAuthenticated && canManageStudioRental && isAdminListLoading) ||
    (isAuthenticated && canReadAgenda && isAdminAgendaLoading);

  const adminError =
    (isAuthenticated && canManageStudioRental && adminListError) ||
    (isAuthenticated && canReadAgenda && isAdminAgendaLoading);

  if (!isAuthenticated || !canAccessAnyAdminArea) {
    return null;
  }

  return (
    <Section id='admin-operations' className='py-8'>
      <SectionHeading
        className='max-w-3xl'
        intro={t('home:admin.kicker')}
        title={t('home:admin.title')}
        subtitle={t('home:admin.subtitle')}
      />

      {adminError ? (
        <div className='mt-4 flex flex-col gap-2 rounded-md bg-error-container px-4 py-3 text-sm text-destructive md:flex-row md:items-center md:justify-between'>
          <span>{t('home:admin.error')}</span>
          <Button
            size='sm'
            variant='outline'
            onClick={() => {
              if (canManageStudioRental) void adminListRefetch();

              if (canReadAgenda) void adminAgendaRefetch();
            }}
          >
            {t('home:admin.retry')}
          </Button>
        </div>
      ) : null}

      {adminLoading ? (
        <div className='mt-6 grid gap-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1'>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`admin-loading-${index}`} className='h-36 rounded-lg bg-surface-container-low animate-pulse' />
          ))}
        </div>
      ) : adminCards.length === 0 ? (
        <p className='mt-4 text-sm text-muted-foreground'>{t('home:admin.empty')}</p>
      ) : (
        <div className='mt-6 grid gap-4 lg:grid-cols-3 md:grid-cols-2 grid-cols-1'>
          {adminCards.map(card => (
            <Link
              key={card.id}
              to={card.to}
              className='rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ringprimary focus-visible:ring-offset-2'
            >
              <Card className='border-secondary/50 bg-surface-container-low shadow-sm transition-colors duration-200 hover:bg-surface-container'>
                <CardHeader>
                  <CardTitle className='text-primary'>{card.label}</CardTitle>

                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>

                <CardFooter>
                  <div className='flex w-full items-center justify-between'>
                    <span className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
                      {t('home:admin.metric')}
                    </span>

                    <span className='text-xl font-semibold text-foreground'>{card.metric}</span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </Section>
  );
};
