import { format } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { type CancelRequestPayload, DansshipAPI, RentalRequest, RentalRequestStatus, RentalSeries } from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise, usePromise } from '@hooks';

const statusKey: Record<RentalRequestStatus, string> = {
  draft: 'studioRental:status.draft',
  pending_payment: 'studioRental:status.pendingPayment',
  pending_approval: 'studioRental:status.pendingApproval',
  confirmed: 'studioRental:status.confirmed',
  cancelled: 'studioRental:status.cancelled',
};

function canCancel(status: RentalRequestStatus): boolean {
  return status !== 'cancelled' && status !== 'confirmed';
}

function StudioRentalRequestsPage() {
  const { t } = useTranslation();
  const {
    response: requestsResponse,
    isLoading: isLoadingRequests,
    reFetch: refetchRequests,
  } = usePromise(() => DansshipAPI.studioRental.getMyRequests());
  const {
    response: seriesResponse,
    isLoading: isLoadingSeries,
    reFetch: refetchSeries,
  } = usePromise(() => DansshipAPI.studioRental.getMySeries());
  const { response: rooms } = usePromise(() => DansshipAPI.studioRental.getRooms());

  const { call: cancelRequest, isLoading: isLoadingCancelRequest } = useCallablePromise(
    (id: string, payload?: CancelRequestPayload) => DansshipAPI.studioRental.cancelRequest(id, payload),
  );
  const { call: cancelSeries, isLoading: isLoadingCancelSeries } = useCallablePromise(
    (id: string, payload?: CancelRequestPayload) => DansshipAPI.studioRental.cancelSeries(id, payload),
  );

  const roomNameById = useMemo(() => {
    const dictionary: Record<string, string> = {};
    (rooms?.data ?? []).forEach(room => {
      dictionary[room.id] = room.name;
    });

    return dictionary;
  }, [rooms?.data]);

  const standaloneRequests = useMemo(
    () => (requestsResponse?.data ?? []) as Array<RentalRequest>,
    [requestsResponse?.data],
  );
  const seriesList = useMemo(() => (seriesResponse?.data ?? []) as Array<RentalSeries>, [seriesResponse?.data]);

  const refresh = useCallback(async () => {
    await Promise.all([refetchRequests(), refetchSeries()]);
  }, [refetchRequests, refetchSeries]);

  const handleCancelRequest = useCallback(
    async (id: string) => {
      const { error } = await cancelRequest(id);

      if (error) {
        toast.error(t('studioRental:toast.requestCancelFailed'));
      } else {
        toast.success(t('studioRental:toast.requestCancelled'));
        await refresh();
      }
    },
    [cancelRequest, refresh, t],
  );

  const handleCancelSeries = useCallback(
    async (id: string) => {
      const { error } = await cancelSeries(id);

      if (error) {
        toast.error(t('studioRental:toast.seriesCancelFailed'));
      } else {
        toast.success(t('studioRental:toast.seriesCancelled'));
        await refresh();
      }
    },
    [cancelSeries, refresh, t],
  );

  const isLoading = isLoadingRequests || isLoadingSeries;
  const loadFailed = Boolean((requestsResponse && !requestsResponse.ok) || (seriesResponse && !seriesResponse.ok));
  const isEmpty = standaloneRequests.length === 0 && seriesList.length === 0;
  const isCanceling = isLoadingCancelRequest || isLoadingCancelSeries;

  return (
    <div className='mx-auto max-w-6xl space-y-6 px-4 py-8 pt-20'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>{t('studioRental:myRequests.title')}</h1>
        <p className='mt-2 text-gray-500'>{t('studioRental:myRequests.subtitle')}</p>
      </div>

      <div className='space-y-4 rounded-lg border border-gray-100 bg-white p-4 shadow-sm'>
        {isLoading ? (
          <SpinnerLoader message={t('studioRental:myRequests.loading')} />
        ) : loadFailed ? (
          <p className='text-sm text-alert-600'>{t('studioRental:myRequests.loadError')}</p>
        ) : isEmpty ? (
          <p className='text-sm text-gray-500'>{t('studioRental:myRequests.empty')}</p>
        ) : (
          <>
            {seriesList.length > 0 ? (
              <div className='space-y-3'>
                <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  {t('studioRental:myRequests.seriesSection')}
                </h2>
                {seriesList.map(series => (
                  <div key={series.id} className='space-y-2 rounded-md border border-gray-200 p-4'>
                    <div className='flex items-center justify-between gap-2'>
                      <span className='text-sm font-semibold text-gray-900'>
                        {t('studioRental:myRequests.seriesLabel', { id: series.id.slice(0, 8) })}
                      </span>
                      <span className='rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700'>
                        {t(statusKey[series.status])}
                      </span>
                    </div>
                    <p className='text-sm text-gray-600'>
                      {t('studioRental:myRequests.room')}: {roomNameById[series.room_id] ?? series.room_id}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t(`common:days.${series.day_of_week}`)} · {series.start_time.slice(0, 5)} –{' '}
                      {series.end_time.slice(0, 5)}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('studioRental:myRequests.seriesRange')}: {series.series_start_date}
                      {series.series_end_date
                        ? ` → ${series.series_end_date}`
                        : series.occurrence_count
                          ? ` · ${t('studioRental:myRequests.occurrences', { count: series.occurrence_count })}`
                          : ''}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('studioRental:myRequests.total')}: {series.total_price} {series.currency}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('studioRental:myRequests.memberRequests', { count: series.requests?.length ?? 0 })}
                    </p>
                    {canCancel(series.status) ? (
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={isCanceling}
                        onClick={() => void handleCancelSeries(series.id)}
                      >
                        {t('studioRental:myRequests.cancelSeries')}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            {standaloneRequests.length > 0 ? (
              <div className='space-y-3'>
                <h2 className='text-sm font-semibold uppercase tracking-wide text-gray-500'>
                  {t('studioRental:myRequests.oneOffSection')}
                </h2>
                {standaloneRequests.map(request => (
                  <div key={request.id} className='space-y-2 rounded-md border border-gray-200 p-4'>
                    <div className='flex items-center justify-between'>
                      <span className='text-sm font-semibold text-gray-900'>#{request.id.slice(0, 8)}</span>
                      <span className='rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700'>
                        {t(statusKey[request.status])}
                      </span>
                    </div>
                    <p className='text-sm text-gray-600'>
                      {t('studioRental:myRequests.total')}: {request.total_price} {request.currency}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('studioRental:myRequests.createdAt')}: {format(new Date(request.created_at), 'PPpp')}
                    </p>
                    <p className='text-sm text-gray-600'>
                      {t('studioRental:myRequests.slots', { count: request.slots.length })}
                    </p>
                    {canCancel(request.status) ? (
                      <Button
                        variant='outline'
                        size='sm'
                        disabled={isCanceling}
                        onClick={() => void handleCancelRequest(request.id)}
                      >
                        {t('studioRental:myRequests.cancel')}
                      </Button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export const SecureStudioRentalRequestsPage = SecurityGuard(StudioRentalRequestsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isStudioRentalRequestsPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
