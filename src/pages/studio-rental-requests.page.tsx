import { format } from 'date-fns';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { type CancelRequestPayload, DansshipAPI, DansshipAPIError, RentalRequestStatus } from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise, usePromise } from '@hooks';

const statusKey: Record<RentalRequestStatus, string> = {
  draft: 'studioRental:status.draft',
  pending_payment: 'studioRental:status.pendingPayment',
  pending_approval: 'studioRental:status.pendingApproval',
  confirmed: 'studioRental:status.confirmed',
  cancelled: 'studioRental:status.cancelled',
};

function StudioRentalRequestsPage() {
  const { t } = useTranslation();
  const { response: studioRental, isLoading: isLoadingStudioRental } = usePromise(() =>
    DansshipAPI.studioRental.getMyRequests(),
  );
  const { call: cancelRequest, isLoading: isLoadingCanceling } = useCallablePromise(
    (id: string, payload?: CancelRequestPayload) => DansshipAPI.studioRental.cancelRequest(id, payload),
  );

  const handleCancel = useCallback(
    async (id: string) => {
      const { error } = await cancelRequest(id);

      if (error) {
        if (error instanceof DansshipAPIError) {
          toast.error(t('studioRental:toast.requestCancelFailed'));
        } else {
          toast.error(t('studioRental:toast.requestCancelFailed'));
        }
      } else {
        toast.success(t('studioRental:toast.requestCancelled'));
      }
    },
    [cancelRequest, t],
  );

  return (
    <div className='max-w-6xl mx-auto py-8 px-4 space-y-6'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>{t('studioRental:myRequests.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('studioRental:myRequests.subtitle')}</p>
      </div>

      <div className='bg-white border border-gray-100 rounded-lg shadow-sm p-4'>
        {isLoadingStudioRental ? (
          <SpinnerLoader message={t('studioRental:myRequests.loading')} />
        ) : !studioRental?.ok ? (
          <p className='text-sm text-alert-600'>{t('studioRental:myRequests.loadError')}</p>
        ) : (studioRental?.data ?? []).length === 0 ? (
          <p className='text-sm text-gray-500'>{t('studioRental:myRequests.empty')}</p>
        ) : (
          <div className='space-y-3'>
            {(studioRental?.data ?? []).map(request => (
              <div key={request.id} className='border border-gray-200 rounded-md p-4 space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-semibold text-gray-900'>#{request.id.slice(0, 8)}</span>
                  <span className='text-xs rounded-full px-2 py-1 bg-gray-100 text-gray-700'>
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

                {request.status !== 'cancelled' && request.status !== 'confirmed' && (
                  <Button
                    variant='outline'
                    size='sm'
                    disabled={isLoadingCanceling}
                    onClick={() => handleCancel(request.id)}
                  >
                    {t('studioRental:myRequests.cancel')}
                  </Button>
                )}
              </div>
            ))}
          </div>
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
