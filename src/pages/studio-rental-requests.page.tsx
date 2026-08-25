import { format } from 'date-fns';
import { ActionModal } from 'polpo/components';
import { KeyboardEvent, MouseEvent, ReactNode, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { PaymentProofUpload } from '@components/modules/payments/payment-proof-upload';
import { TransferPaymentInstructions } from '@components/modules/payments/transfer-payment-instructions';
import { Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import {
  type CancelRequestPayload,
  DansshipAPI,
  PaymentMethod,
  type PaymentIntent,
  PaymentStatus,
  RentalRequest,
  RentalRequestStatus,
  RentalSeries,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatPrice } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

const rentalStatusKey: Record<RentalRequestStatus, string> = {
  pending_payment: 'studioRental:status.pendingPayment',
  on_hold: 'studioRental:status.onHold',
  confirmed: 'studioRental:status.confirmed',
  cancelled: 'studioRental:status.cancelled',
};

interface PaymentSummary {
  intentId: string | null;
  status: PaymentStatus | null;
  proofUrl: string | null;
  method: PaymentMethod | null;
}

function resolvePayment(
  entity: {
    payment_intent_id?: string | null;
    payment_status?: PaymentStatus | null;
    payment_method_type?: PaymentMethod | null;
    payment_proof_url?: string | null;
  },
  intentById: Record<string, PaymentIntent>,
): PaymentSummary {
  const intentId = entity.payment_intent_id ?? null;
  const intent = intentId ? intentById[intentId] : undefined;

  return {
    intentId,
    status: entity.payment_status ?? intent?.status ?? null,
    proofUrl: entity.payment_proof_url ?? intent?.proof_url ?? null,
    method: entity.payment_method_type ?? intent?.payment_method_type ?? null,
  };
}

function RequestListCard({
  title,
  subtitle,
  status,
  balanceDueDate,
  clickable,
  onOpen,
  actions,
}: {
  title: string;
  subtitle: string;
  status: RentalRequestStatus;
  balanceDueDate?: string | null;
  clickable: boolean;
  onOpen?: () => void;
  actions?: ReactNode;
}) {
  const { t } = useTranslation();

  const open = () => {
    if (clickable) {
      onOpen?.();
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (!clickable) {
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen?.();
    }
  };

  return (
    <article
      className={cn(
        'rounded-xl bg-[hsl(var(--surface-container-highest))] px-4 py-3',
        clickable && 'cursor-pointer transition-colors hover:bg-black/5',
      )}
      role={clickable ? 'link' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={open}
      onKeyDown={onKeyDown}
    >
      <div className='flex items-center justify-between gap-3'>
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold'>{title}</p>
          <p className='truncate text-sm text-muted-foreground'>{subtitle}</p>
          {status === 'on_hold' && balanceDueDate ? (
            <p className='mt-1 text-xs text-muted-foreground'>
              {t('studioRental:myRequests.balanceDue', { date: balanceDueDate })}
            </p>
          ) : null}
        </div>
        <span className='shrink-0 rounded-full bg-background px-2 py-1 text-xs'>{t(rentalStatusKey[status])}</span>
      </div>
      {actions ? (
        <div
          className='mt-2 flex flex-wrap gap-2'
          onClick={(event: MouseEvent<HTMLDivElement>) => event.stopPropagation()}
          onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => event.stopPropagation()}
        >
          {actions}
        </div>
      ) : null}
    </article>
  );
}

function StudioRentalRequestsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [payingIntentId, setPayingIntentId] = useState<string | null>(null);
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
  const { response: intentsResponse, reFetch: refetchIntents } = usePromise(() => DansshipAPI.payments.getMyIntents());

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

  const intentById = useMemo(() => {
    const dictionary: Record<string, PaymentIntent> = {};
    (intentsResponse?.data ?? []).forEach(intent => {
      dictionary[intent.id] = intent;
    });

    return dictionary;
  }, [intentsResponse?.data]);

  const standaloneRequests = useMemo(
    () => (requestsResponse?.data ?? []) as Array<RentalRequest>,
    [requestsResponse?.data],
  );
  const seriesList = useMemo(() => (seriesResponse?.data ?? []) as Array<RentalSeries>, [seriesResponse?.data]);

  const refresh = useCallback(async () => {
    await Promise.all([refetchRequests(), refetchSeries(), refetchIntents()]);
  }, [refetchIntents, refetchRequests, refetchSeries]);

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

  const canPay = (rentalStatus: RentalRequestStatus, payment: PaymentSummary) => {
    if ((rentalStatus !== 'pending_payment' && rentalStatus !== 'on_hold') || !payment.intentId) {
      return false;
    }

    if (
      payment.status === PaymentStatus.REJECTED ||
      payment.status === PaymentStatus.CANCELLED ||
      payment.status === PaymentStatus.EXPIRED ||
      payment.status === PaymentStatus.APPROVED
    ) {
      return false;
    }

    if (payment.method === PaymentMethod.CARD) {
      return false;
    }

    return !payment.proofUrl;
  };

  const canCancel = (rentalStatus: RentalRequestStatus, payment: PaymentSummary) => {
    if (rentalStatus !== 'pending_payment') {
      return false;
    }

    return !payment.intentId || !payment.proofUrl;
  };

  const openDetail = (intentId: string) => {
    navigate(`${PageURLS.studioRentalResult}?intentId=${intentId}`);
  };

  const isLoading = isLoadingRequests || isLoadingSeries;
  const loadFailed = Boolean((requestsResponse && !requestsResponse.ok) || (seriesResponse && !seriesResponse.ok));
  const isEmpty = standaloneRequests.length === 0 && seriesList.length === 0;
  const isCanceling = isLoadingCancelRequest || isLoadingCancelSeries;

  return (
    <div className='mx-auto max-w-6xl space-y-6 px-4 py-8 pt-20'>
      <div>
        <h1 className='text-3xl font-bold text-primary'>{t('studioRental:myRequests.title')}</h1>
        <p className='mt-2 text-muted-foreground'>{t('studioRental:myRequests.subtitle')}</p>
      </div>

      <div className='space-y-4 rounded-xl border bg-card p-4 shadow-sm'>
        {isLoading ? (
          <SpinnerLoader message={t('studioRental:myRequests.loading')} />
        ) : loadFailed ? (
          <p className='text-sm text-alert'>{t('studioRental:myRequests.loadError')}</p>
        ) : isEmpty ? (
          <p className='text-sm text-muted-foreground'>{t('studioRental:myRequests.empty')}</p>
        ) : (
          <>
            {seriesList.length > 0 ? (
              <div className='space-y-3'>
                <h2 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t('studioRental:myRequests.seriesSection')}
                </h2>
                {seriesList.map(series => {
                  const payment = resolvePayment(series, intentById);
                  const showPay = canPay(series.status, payment);
                  const showCancel = canCancel(series.status, payment);

                  return (
                    <RequestListCard
                      key={series.id}
                      title={t('studioRental:myRequests.seriesLabel', { id: series.id.slice(0, 8) })}
                      subtitle={`${roomNameById[series.room_id] ?? series.room_id} · ${t(`common:days.${series.day_of_week}`)} ${series.start_time.slice(0, 5)}–${series.end_time.slice(0, 5)} · ${formatPrice(Number(series.total_price), series.currency)}`}
                      status={series.status}
                      balanceDueDate={series.balance_due_date}
                      clickable={Boolean(payment.intentId)}
                      onOpen={() => {
                        if (payment.intentId) {
                          openDetail(payment.intentId);
                        }
                      }}
                      actions={
                        showPay || showCancel ? (
                          <>
                            {showPay ? (
                              <Button size='sm' onClick={() => setPayingIntentId(payment.intentId)}>
                                {t(
                                  series.status === 'on_hold'
                                    ? 'studioRental:myRequests.payBalance'
                                    : 'studioRental:myRequests.pay',
                                )}
                              </Button>
                            ) : null}
                            {showCancel ? (
                              <Button
                                variant='outline'
                                size='sm'
                                disabled={isCanceling}
                                onClick={() => void handleCancelSeries(series.id)}
                              >
                                {t('studioRental:myRequests.cancelSeries')}
                              </Button>
                            ) : null}
                          </>
                        ) : null
                      }
                    />
                  );
                })}
              </div>
            ) : null}

            {standaloneRequests.length > 0 ? (
              <div className='space-y-3'>
                <h2 className='text-sm font-semibold uppercase tracking-wide text-muted-foreground'>
                  {t('studioRental:myRequests.oneOffSection')}
                </h2>
                {standaloneRequests.map(request => {
                  const payment = resolvePayment(request, intentById);
                  const showPay = canPay(request.status, payment);
                  const showCancel = canCancel(request.status, payment);

                  return (
                    <RequestListCard
                      key={request.id}
                      title={`#${request.id.slice(0, 8)}`}
                      subtitle={`${formatPrice(Number(request.total_price ?? 0), request.currency)} · ${format(new Date(request.created_at), 'PP')}`}
                      status={request.status}
                      balanceDueDate={request.balance_due_date}
                      clickable={Boolean(payment.intentId)}
                      onOpen={() => {
                        if (payment.intentId) {
                          openDetail(payment.intentId);
                        }
                      }}
                      actions={
                        showPay || showCancel ? (
                          <>
                            {showPay ? (
                              <Button size='sm' onClick={() => setPayingIntentId(payment.intentId)}>
                                {t(
                                  request.status === 'on_hold'
                                    ? 'studioRental:myRequests.payBalance'
                                    : 'studioRental:myRequests.pay',
                                )}
                              </Button>
                            ) : null}
                            {showCancel ? (
                              <Button
                                variant='outline'
                                size='sm'
                                disabled={isCanceling}
                                onClick={() => void handleCancelRequest(request.id)}
                              >
                                {t('studioRental:myRequests.cancel')}
                              </Button>
                            ) : null}
                          </>
                        ) : null
                      }
                    />
                  );
                })}
              </div>
            ) : null}
          </>
        )}
      </div>

      <ActionModal isOpen={Boolean(payingIntentId)} onClose={() => setPayingIntentId(null)} className='max-w-lg'>
        {payingIntentId ? (
          <div className='space-y-4 p-2'>
            <TransferPaymentInstructions />
            <PaymentProofUpload
              intentId={payingIntentId}
              currentProofUrl={intentById[payingIntentId]?.proof_url ?? null}
              onUploaded={() => {
                toast.success(t('studioRental:toast.proofUploaded'));
                setPayingIntentId(null);
                void refresh();
              }}
            />
          </div>
        ) : null}
      </ActionModal>
    </div>
  );
}

export const SecureStudioRentalRequestsPage = SecurityGuard(StudioRentalRequestsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isStudioRentalRequestsPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
