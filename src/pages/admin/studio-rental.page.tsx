import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { InternalReservedUsePanel } from '@components/modules';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { type AdminRejectPayload, type AvailabilityRulePayload, DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { useCallablePromise, usePromise } from '@hooks';

const TAB_VALUES = ['approval', 'reserved-use', 'rules'] as const;
type StudioRentalTab = (typeof TAB_VALUES)[number];

function isStudioRentalTab(value: string | null): value is StudioRentalTab {
  return TAB_VALUES.includes((value ?? '') as StudioRentalTab);
}

function AdminStudioRentalPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [roomId, setRoomId] = useState('');

  const tabParam = searchParams.get('tab');
  const activeTab: StudioRentalTab = isStudioRentalTab(tabParam) ? tabParam : 'approval';

  useEffect(() => {
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

  const { response: listRequests, isLoading: isLoadingListRequests } = usePromise(() =>
    DansshipAPI.studioRentalAdmin.adminListRequests({
      status: 'pending_approval',
    }),
  );

  const { response: rooms, isLoading: isLoadingRooms } = usePromise(() => DansshipAPI.studioRental.getRooms());
  const { response: rules, isLoading: isLoadingRules } = usePromise(
    () =>
      DansshipAPI.studioRentalAdmin.listRules({
        room_id: roomId,
      }),
    Boolean(roomId),
  );

  const { call: adminApproveRequestPromise, isLoading: isApproving } = useCallablePromise((id: string) =>
    DansshipAPI.studioRentalAdmin.adminApproveRequest(id),
  );

  const adminApproveRequest = useCallback(
    async (id: string) => {
      const { ok } = await adminApproveRequestPromise(id);

      if (ok) {
        toast.success(t('studioRental:toast.requestApproved'));
      } else {
        toast.error(t('studioRental:toast.requestApproveFailed'));
      }
    },
    [adminApproveRequestPromise, t],
  );

  const { call: adminRejectRequestPromise, isLoading: isRejecting } = useCallablePromise(
    (id: string, payload: AdminRejectPayload) => DansshipAPI.studioRentalAdmin.adminRejectRequest(id, payload),
  );

  const adminRejectRequest = useCallback(
    async (id: string, payload: AdminRejectPayload) => {
      const { ok } = await adminRejectRequestPromise(id, payload);

      if (ok) {
        toast.success(t('studioRental:toast.requestRejectd'));
      } else {
        toast.error(t('studioRental:toast.requestRejectFailed'));
      }
    },
    [adminRejectRequestPromise, t],
  );

  const { call: createRulePromise, isLoading: isCreatingRule } = useCallablePromise(
    (payload: AvailabilityRulePayload) => DansshipAPI.studioRentalAdmin.createRule(payload),
  );

  const createRule = useCallback(
    async (payload: AvailabilityRulePayload) => {
      const { ok } = await createRulePromise(payload);

      if (ok) {
        toast.success(t('studioRental:toast.ruleCreated'));
      }
    },
    [createRulePromise, t],
  );

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 space-y-6'>
      <div>
        <h1 className='text-primary'>{t('studioRental:admin.title')}</h1>
        <p className='text-muted-foreground mt-2'>{t('studioRental:admin.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='mb-4 bg-[hsl(var(--surface-container-low))]'>
          <TabsTrigger value='approval'>{t('studioRental:admin.tabs.approval')}</TabsTrigger>
          <TabsTrigger value='reserved-use'>
            {t('studioRental:admin.tabs.reservedUse', { defaultValue: 'Reserved Use' })}
          </TabsTrigger>
          <TabsTrigger value='rules'>{t('studioRental:admin.tabs.rules')}</TabsTrigger>
        </TabsList>

        <TabsContent
          value='approval'
          className='bg-[hsl(var(--surface-container-low))] p-6 rounded-[calc(var(--radius)+4px)]'
        >
          {isLoadingListRequests ? (
            <SpinnerLoader message={t('studioRental:admin.approval.loading')} />
          ) : !listRequests?.ok ? (
            <p className='text-sm text-alert'>{t('studioRental:admin.approval.loadError')}</p>
          ) : (listRequests.data ?? []).length === 0 ? (
            <p className='text-sm text-muted-foreground'>{t('studioRental:admin.approval.empty')}</p>
          ) : (
            <div className='space-y-3'>
              {(listRequests.data ?? []).map(request => (
                <div key={request.id} className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-4'>
                  <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3'>
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
                      <Button size='sm' disabled={isApproving} onClick={() => adminApproveRequest(request.id)}>
                        {t('studioRental:admin.approval.approve')}
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={isRejecting}
                        onClick={() =>
                          adminRejectRequest(request.id, {
                            reason: '',
                          })
                        }
                      >
                        {t('studioRental:admin.approval.reject')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent
          value='reserved-use'
          className='bg-[hsl(var(--surface-container-low))] p-6 rounded-[calc(var(--radius)+4px)]'
        >
          <InternalReservedUsePanel />
        </TabsContent>

        <TabsContent
          value='rules'
          className='bg-[hsl(var(--surface-container-low))] p-6 rounded-[calc(var(--radius)+4px)] space-y-4'
        >
          <div className='grid gap-3 md:grid-cols-3'>
            <div>
              <label className='text-sm text-muted-foreground'>{t('studioRental:admin.rules.room')}</label>
              <Select value={roomId} onValueChange={setRoomId}>
                <SelectTrigger>
                  <SelectValue placeholder={t('studioRental:admin.rules.roomPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(rooms?.data ?? []).map(room => (
                    <SelectItem key={room.id} value={room.id}>
                      {room.name} {room.room_type ? `(${room.room_type})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isLoadingRooms ? (
                <p className='text-xs text-muted-foreground mt-2'>{t('studioRental:admin.rules.roomsLoading')}</p>
              ) : null}
              {!rooms?.ok ? (
                <p className='text-xs text-alert mt-2'>{t('studioRental:admin.rules.roomsLoadError')}</p>
              ) : null}
            </div>
            <div className='md:col-span-2 flex items-end'>
              <Button
                variant='outline'
                disabled={!roomId || isCreatingRule}
                onClick={() =>
                  createRule({
                    room_id: roomId,
                    start_time: '09:00:00',
                    end_time: '12:00:00',
                    rule_type: 'block',
                    is_active: true,
                    day_of_week: null,
                  })
                }
              >
                {t('studioRental:admin.rules.addDefaultRule')}
              </Button>
            </div>
          </div>

          {!roomId ? (
            <p className='text-sm text-muted-foreground'>{t('studioRental:admin.rules.selectRoom')}</p>
          ) : isLoadingRules ? (
            <SpinnerLoader message={t('studioRental:admin.rules.loading')} />
          ) : !rules?.ok ? (
            <p className='text-sm text-alert'>{t('studioRental:admin.rules.loadError')}</p>
          ) : (rules.data ?? []).length === 0 ? (
            <p className='text-sm text-muted-foreground'>{t('studioRental:admin.rules.empty')}</p>
          ) : (
            <div className='space-y-2'>
              {(rules.data ?? []).map(rule => (
                <div
                  key={rule.id}
                  className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-3 text-sm text-foreground'
                >
                  <p>
                    {t('studioRental:admin.rules.type')}: {rule.rule_type}
                  </p>
                  <p>
                    {t('studioRental:admin.rules.time')}: {rule.start_time} - {rule.end_time}
                  </p>
                  <p>
                    {t('studioRental:admin.rules.dayOfWeek')}:{' '}
                    {rule.day_of_week ?? t('studioRental:admin.rules.allDays')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureAdminStudioRentalPage = SecurityGuard(AdminStudioRentalPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminStudioRentalPageEnabled],
  orPermissions: AdminPermissions.studioRental,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
