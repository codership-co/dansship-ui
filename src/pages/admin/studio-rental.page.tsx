import { useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { AvailabilityBlocksPanel, InternalReservedUsePanel, RentalPricingPanel } from '@components/modules';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { type AdminRejectPayload, DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { useCallablePromise, usePromise } from '@hooks';

const TAB_VALUES = ['approval', 'reserved-use', 'blocks', 'pricing'] as const;
type StudioRentalTab = (typeof TAB_VALUES)[number];

function isStudioRentalTab(value: string | null): value is StudioRentalTab {
  return TAB_VALUES.includes((value ?? '') as StudioRentalTab);
}

function AdminStudioRentalPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: StudioRentalTab =
    tabParam === 'rules' ? 'blocks' : isStudioRentalTab(tabParam) ? tabParam : 'approval';

  useEffect(() => {
    if (tabParam === 'rules') {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'blocks');
      setSearchParams(next, { replace: true });

      return;
    }

    if (!isStudioRentalTab(tabParam)) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'approval');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, tabParam]);

  const setActiveTab = (tab: string) => {
    if (!isStudioRentalTab(tab)) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  const {
    response: listRequests,
    isLoading: isLoadingListRequests,
    reFetch: refetchRequests,
  } = usePromise(() =>
    DansshipAPI.studioRentalAdmin.adminListRequests({
      status: 'pending_approval',
    }),
  );

  const {
    response: listSeries,
    isLoading: isLoadingListSeries,
    reFetch: refetchSeries,
  } = usePromise(() =>
    DansshipAPI.studioRentalAdmin.adminListSeries({
      status: 'pending_approval',
    }),
  );

  const { response: rooms } = usePromise(() => DansshipAPI.studioRental.getRooms());

  const { call: adminApproveRequestPromise, isLoading: isApprovingRequest } = useCallablePromise((id: string) =>
    DansshipAPI.studioRentalAdmin.adminApproveRequest(id),
  );
  const { call: adminRejectRequestPromise, isLoading: isRejectingRequest } = useCallablePromise(
    (id: string, payload: AdminRejectPayload) => DansshipAPI.studioRentalAdmin.adminRejectRequest(id, payload),
  );
  const { call: adminApproveSeriesPromise, isLoading: isApprovingSeries } = useCallablePromise((id: string) =>
    DansshipAPI.studioRentalAdmin.adminApproveSeries(id),
  );
  const { call: adminRejectSeriesPromise, isLoading: isRejectingSeries } = useCallablePromise(
    (id: string, payload: AdminRejectPayload) => DansshipAPI.studioRentalAdmin.adminRejectSeries(id, payload),
  );

  const refreshApprovals = useCallback(async () => {
    await Promise.all([refetchRequests(), refetchSeries()]);
  }, [refetchRequests, refetchSeries]);

  const adminApproveRequest = useCallback(
    async (id: string) => {
      const { ok } = await adminApproveRequestPromise(id);

      if (ok) {
        toast.success(t('studioRental:toast.requestApproved'));
        await refreshApprovals();
      } else {
        toast.error(t('studioRental:toast.requestApproveFailed'));
      }
    },
    [adminApproveRequestPromise, refreshApprovals, t],
  );

  const adminRejectRequest = useCallback(
    async (id: string, payload: AdminRejectPayload) => {
      const { ok } = await adminRejectRequestPromise(id, payload);

      if (ok) {
        toast.success(t('studioRental:toast.requestRejected'));
        await refreshApprovals();
      } else {
        toast.error(t('studioRental:toast.requestRejectFailed'));
      }
    },
    [adminRejectRequestPromise, refreshApprovals, t],
  );

  const adminApproveSeries = useCallback(
    async (id: string) => {
      const { ok } = await adminApproveSeriesPromise(id);

      if (ok) {
        toast.success(t('studioRental:toast.seriesApproved'));
        await refreshApprovals();
      } else {
        toast.error(t('studioRental:toast.seriesApproveFailed'));
      }
    },
    [adminApproveSeriesPromise, refreshApprovals, t],
  );

  const adminRejectSeries = useCallback(
    async (id: string, payload: AdminRejectPayload) => {
      const { ok } = await adminRejectSeriesPromise(id, payload);

      if (ok) {
        toast.success(t('studioRental:toast.seriesRejected'));
        await refreshApprovals();
      } else {
        toast.error(t('studioRental:toast.seriesRejectFailed'));
      }
    },
    [adminRejectSeriesPromise, refreshApprovals, t],
  );

  const roomNameById = (rooms?.data ?? []).reduce<Record<string, string>>((acc, room) => {
    acc[room.id] = room.name;

    return acc;
  }, {});

  const isLoadingApprovals = isLoadingListRequests || isLoadingListSeries;
  const approvalFailed = Boolean((listRequests && !listRequests.ok) || (listSeries && !listSeries.ok));
  const pendingRequests = listRequests?.data ?? [];
  const pendingSeries = listSeries?.data ?? [];
  const approvalsEmpty = pendingRequests.length === 0 && pendingSeries.length === 0;
  const isBusy = isApprovingRequest || isRejectingRequest || isApprovingSeries || isRejectingSeries;

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8 pt-20'>
      <div>
        <h1 className='text-primary'>{t('studioRental:admin.title')}</h1>
        <p className='mt-2 text-muted-foreground'>{t('studioRental:admin.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='mb-4 bg-[hsl(var(--surface-container-low))]'>
          <TabsTrigger value='approval'>{t('studioRental:admin.tabs.approval')}</TabsTrigger>
          <TabsTrigger value='reserved-use'>{t('studioRental:admin.tabs.reservedUse')}</TabsTrigger>
          <TabsTrigger value='blocks'>{t('studioRental:admin.tabs.blocks')}</TabsTrigger>
          <TabsTrigger value='pricing'>{t('studioRental:admin.tabs.pricing')}</TabsTrigger>
        </TabsList>

        <TabsContent
          value='approval'
          className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-6'
        >
          {isLoadingApprovals ? (
            <SpinnerLoader message={t('studioRental:admin.approval.loading')} />
          ) : approvalFailed ? (
            <p className='text-sm text-alert'>{t('studioRental:admin.approval.loadError')}</p>
          ) : approvalsEmpty ? (
            <p className='text-sm text-muted-foreground'>{t('studioRental:admin.approval.empty')}</p>
          ) : (
            <div className='space-y-6'>
              {pendingSeries.length > 0 ? (
                <div className='space-y-3'>
                  <h2 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                    {t('studioRental:admin.approval.seriesSection')}
                  </h2>
                  {pendingSeries.map(series => (
                    <div key={series.id} className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-4'>
                      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                        <div>
                          <p className='font-semibold text-foreground'>
                            {t('studioRental:admin.approval.seriesLabel', { id: series.id.slice(0, 8) })}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {roomNameById[series.room_id] ?? series.room_id} · {t(`common:days.${series.day_of_week}`)}{' '}
                            · {series.start_time.slice(0, 5)} – {series.end_time.slice(0, 5)}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {t('studioRental:admin.approval.total')}: {series.total_price} {series.currency}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {t('studioRental:admin.approval.occurrences', {
                              count: series.requests?.length ?? series.occurrence_count ?? 0,
                            })}
                          </p>
                        </div>
                        <div className='flex gap-2'>
                          <Button size='sm' disabled={isBusy} onClick={() => void adminApproveSeries(series.id)}>
                            {t('studioRental:admin.approval.approve')}
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={isBusy}
                            onClick={() => void adminRejectSeries(series.id, { reason: '' })}
                          >
                            {t('studioRental:admin.approval.reject')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}

              {pendingRequests.length > 0 ? (
                <div className='space-y-3'>
                  <h2 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                    {t('studioRental:admin.approval.oneOffSection')}
                  </h2>
                  {pendingRequests.map(request => (
                    <div key={request.id} className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-4'>
                      <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                        <div>
                          <p className='font-semibold text-foreground'>#{request.id.slice(0, 8)}</p>
                          <p className='text-sm text-muted-foreground'>
                            {t('studioRental:admin.approval.total')}: {request.total_price} {request.currency}
                          </p>
                          <p className='text-sm text-muted-foreground'>
                            {t('studioRental:admin.approval.slots', { count: request.slots.length })}
                          </p>
                        </div>
                        <div className='flex gap-2'>
                          <Button size='sm' disabled={isBusy} onClick={() => void adminApproveRequest(request.id)}>
                            {t('studioRental:admin.approval.approve')}
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={isBusy}
                            onClick={() => void adminRejectRequest(request.id, { reason: '' })}
                          >
                            {t('studioRental:admin.approval.reject')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value='reserved-use'
          className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-6'
        >
          <InternalReservedUsePanel />
        </TabsContent>

        <TabsContent
          value='blocks'
          className='space-y-4 rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-6'
        >
          <AvailabilityBlocksPanel />
        </TabsContent>

        <TabsContent
          value='pricing'
          className='space-y-4 rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-6'
        >
          <RentalPricingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureAdminStudioRentalPage = SecurityGuard(AdminStudioRentalPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.studioRental,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
