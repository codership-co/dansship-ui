import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LoaderFunctionArgs, useLoaderData, useNavigate, useRevalidator } from 'react-router';
import { toast } from 'sonner';

import { Section } from '@components/containers';
import { PaymentStatusBadge } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import {
  DansshipAPI,
  PaymentMethod,
  PaymentProofContentType,
  PaymentProofContentTypesList,
  PaymentStatus,
  type RentalPaymentResult,
  type RentalRequestStatus,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatDateTime, formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

const rentalStatusKey: Record<RentalRequestStatus, string> = {
  pending_payment: 'studioRental:status.pendingPayment',
  confirmed: 'studioRental:status.confirmed',
  cancelled: 'studioRental:status.cancelled',
};

export interface StudioRentalResultLoaderData {
  intentId: string;
  result: RentalPaymentResult | null;
}

export async function StudioRentalResultLoader({ url }: LoaderFunctionArgs): Promise<StudioRentalResultLoaderData> {
  const intentId = url.searchParams.get('intentId') || url.searchParams.get('bold-order-id') || '';

  if (!intentId) {
    return { intentId: '', result: null };
  }

  const { data } = await DansshipAPI.studioRental.getPaymentResult(intentId);

  return {
    intentId,
    result: data ?? null,
  };
}

function formatTimeLabel(value: string) {
  return value.slice(0, 5);
}

function StudioRentalResultPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const { intentId, result } = useLoaderData<StudioRentalResultLoaderData>();
  const { call: getProofViewUrlPromise, isLoading: isGettingProofViewUrl } = useCallablePromise((id: string) =>
    DansshipAPI.payments.getProofViewUrl(id),
  );
  const { call: uploadProofPromise, isLoading: isUploadingProof } = useCallablePromise((id: string, file: File) =>
    DansshipAPI.payments.uploadProof(id, file),
  );

  const getProofViewUrl = useCallback(
    async (id: string) => {
      const { ok, data } = await getProofViewUrlPromise(id);

      if (ok) {
        window.open(data.view_url, '_blank', 'noopener,noreferrer');
      }
    },
    [getProofViewUrlPromise],
  );

  const uploadProof = useCallback(
    async (id: string, file: File) => {
      try {
        await uploadProofPromise(id, file);
        toast.success(t('payments:proofUploadSuccess'));
        revalidator.revalidate();
      } catch {
        toast.error(t('payments:proofUploadFailedDesc'));
      }
    },
    [revalidator, t, uploadProofPromise],
  );

  const handleUploadProof = (paymentIntentId: string) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = PaymentProofContentTypesList.join(',');

    input.onchange = async () => {
      const file = input.files?.[0] ?? null;

      if (!file) return;

      if (!PaymentProofContentTypesList.includes(file.type as PaymentProofContentType)) {
        toast(t('payments:proofInvalidTypeDesc'));

        return;
      }

      await uploadProof(paymentIntentId, file);
    };

    input.click();
  };

  const payment = result?.payment;
  const canUploadProof =
    result?.rental_status === 'pending_payment' &&
    payment?.payment_method_type === PaymentMethod.TRANSFER &&
    (payment.status === PaymentStatus.PENDING || payment.status === PaymentStatus.PENDING_MANUAL_REVIEW);
  const resourceLabel = result?.resource
    ? (result.resource.label ??
      t(`studioRental:resourceTypes.${result.resource.resource_type}`, { position: result.resource.position }))
    : t('studioRental:browse.wholeRoom');

  const amountRows = payment
    ? [
        {
          label: t('payments:createdAt'),
          value: formatDateTime(payment.created_at, i18n.language),
        },
        {
          label: t('payments:methodLabel'),
          value: t(`payments:method.${payment.payment_method_type}`),
        },
        {
          label: t('studioRental:result.rentalStatus'),
          value: result ? t(rentalStatusKey[result.rental_status]) : '',
        },
        { label: '', value: '' },
        ...(payment.base_amount !== null && payment.base_amount !== undefined
          ? [{ label: t('payments:subtotal'), value: formatPrice(payment.base_amount, payment.currency) }]
          : []),
        ...(payment.tax_amount !== null && payment.tax_amount !== undefined
          ? [{ label: t('payments:iva'), value: formatPrice(payment.tax_amount, payment.currency) }]
          : []),
        ...(payment.wallet_amount_applied > 0
          ? [
              {
                label: t('studioRental:result.walletApplied'),
                value: formatPrice(payment.wallet_amount_applied, payment.currency),
              },
            ]
          : []),
        {
          label: t('payments:ammount'),
          value: formatPrice(payment.amount, payment.currency),
        },
      ]
    : [];

  return (
    <section className='grid gap-20' data-sentry-mask>
      {result && payment ? (
        <Section contentClassName='grid gap-20' navbarPadding>
          <section className='rounded-2xl shadow-2xl'>
            <section className='grid gap-8 overflow-hidden rounded-2xl bg-white p-4 sm:p-8 md:grid-cols-[1fr_1fr]'>
              <section className='relative min-h-70 bg-accent px-8 py-16 rounded-lg shadow-lg'>
                <img
                  src='/assets/images/bailarina.png'
                  alt='Dansship'
                  className='absolute w-40 xs:w-50 sm:w-60 md:w-60/100 bottom-1/2 right-1/2 translate-1/2'
                />
              </section>
              <section className='grid content-center gap-4 py-14 relative bg-white min-w-0'>
                <h4 className='m-0 text-center'>{result.room.name}</h4>
                <p className='m-0 text-center text-sm text-muted-foreground'>{resourceLabel}</p>
                <p className='m-0 text-center text-sm'>
                  {result.kind === 'series' ? t('studioRental:browse.series') : t('studioRental:browse.oneOff')}
                </p>

                {result.kind === 'one_off'
                  ? result.slots.map(slot => (
                      <p key={`${slot.start_time}-${slot.end_time}`} className='m-0 text-center text-sm'>
                        {format(parseISO(slot.start_time), 'PP')} · {format(parseISO(slot.start_time), 'HH:mm')} –{' '}
                        {format(parseISO(slot.end_time), 'HH:mm')}
                      </p>
                    ))
                  : result.series && (
                      <p className='m-0 text-center text-sm'>
                        {t(`common:days.${result.series.day_of_week}`)} · {formatTimeLabel(result.series.start_time)} –{' '}
                        {formatTimeLabel(result.series.end_time)}
                        {result.series.occurrence_total
                          ? ` · ${t('studioRental:result.occurrences', { count: result.series.occurrence_total })}`
                          : ''}
                      </p>
                    )}

                {payment.payment_method_type === PaymentMethod.CARD &&
                  ['pending', 'pending_manual_review'].includes(payment.status) && (
                    <p className='m-0 text-center'>{t('payments:result.description')}</p>
                  )}

                <section className='grid place-content-center gap-1 justify-items-center py-4'>
                  <PaymentStatusBadge status={payment.status} />
                  <small className='m-0'>{t('payments:currentIntentStatus')}</small>
                </section>

                <section className='border py-4 border-gray-200 rounded-2xl overflow-x-auto'>
                  {amountRows.map(({ label, value }, index) => (
                    <section
                      key={`${label}-${index}`}
                      className={cn(
                        'grid grid-cols-[auto_minmax(0,1fr)_auto] items-baseline gap-x-3',
                        label && 'px-4 py-2 hover:bg-gray-100',
                        !label && 'border-b border-gray-200 my-4',
                      )}
                    >
                      {label && (
                        <>
                          <small className='m-0 whitespace-nowrap'>{label}</small>
                          <span className='min-w-4 self-center border-b border-dashed border-gray-300' />
                          <small className='m-0 text-right whitespace-nowrap'>{value}</small>
                        </>
                      )}
                    </section>
                  ))}
                </section>

                <section className='flex min-w-0 overflow-hidden rounded-2xl bg-gray-200/60'>
                  <small className='m-0 block shrink-0 bg-gray-200 px-4 py-2'>{t('payments:intentId')}</small>
                  <small className='m-0 block min-w-0 flex-1 truncate font-code px-4 py-2'>{payment.id}</small>
                </section>

                <section
                  className={cn(
                    'mt-4 flex flex-wrap items-center gap-4',
                    canUploadProof ? 'justify-end' : 'justify-center',
                  )}
                >
                  {canUploadProof && (
                    <Button
                      size='small'
                      color='primary'
                      variant='outlined'
                      isLoading={isUploadingProof}
                      onClick={() => void handleUploadProof(payment.id)}
                    >
                      {t('payments:uploadProof')}
                    </Button>
                  )}

                  {payment.proof_url && (
                    <Button
                      size='small'
                      color='primary'
                      variant='outlined'
                      isLoading={isGettingProofViewUrl}
                      onClick={() => void getProofViewUrl(payment.id)}
                    >
                      {t('payments:viewProof')}
                    </Button>
                  )}

                  <Button size='small' color='primary' onClick={() => navigate(PageURLS.studioRentalRequests)}>
                    {t('studioRental:wizard.goToRequests')}
                  </Button>
                </section>
              </section>
            </section>
          </section>
        </Section>
      ) : null}

      {!result && intentId && (
        <Section contentClassName='grid gap-20' navbarPadding>
          <section className='rounded-2xl shadow-2xl'>
            <section className='bg-white rounded-2xl grid md:grid-cols-[3fr_2fr] overflow-hidden'>
              <section className='grid px-8 py-40 place-content-center gap-4 justify-items-center text-center'>
                <p className='whitespace-pre-line m-0'>{t('studioRental:result.notFound')}</p>
                <section className='flex min-w-0 overflow-hidden rounded-2xl bg-gray-200/60'>
                  <small className='m-0 block shrink-0 bg-gray-200 px-4 py-2'>{t('payments:intentId')}</small>
                  <small className='m-0 block min-w-0 flex-1 truncate font-code px-4 py-2'>{intentId}</small>
                </section>
                <Button
                  color='primary'
                  onClick={() => revalidator.revalidate()}
                  isLoading={revalidator.state === 'loading'}
                >
                  {t('payments:retryIntentDetails')}
                </Button>
              </section>
              <section className='relative bg-primary hidden md:block'>
                <img
                  src='/assets/images/bailarina.png'
                  alt='Dansship'
                  className='absolute w-60/100 bottom-1/2 right-1/2 translate-1/2'
                />
              </section>
            </section>
          </section>
        </Section>
      )}
    </section>
  );
}

export const SecureStudioRentalResultPage = SecurityGuard(StudioRentalResultPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isStudioRentalRequestsPageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
