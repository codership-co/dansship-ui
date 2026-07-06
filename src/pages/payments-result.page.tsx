import { Button } from 'polpo/components';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LoaderFunctionArgs, useLoaderData, useRevalidator } from 'react-router';
import { toast } from 'sonner';

import { PaymentStatusBadge, UserPaymentHistory } from '@components/modules';
import { SecurityGuard } from '@contexts';
import {
  type ConfirmPaymentProofPayload,
  DansshipAPI,
  PaymentIntentDetail,
  PaymentMethod,
  PaymentProofContentType,
  PaymentProofContentTypesList,
  type PaymentProofUploadRequest,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatDateTime, formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

export interface PaymentsResultsLoaderData {
  intentId: string;
  boldStatusParam: string;
  intent: PaymentIntentDetail | null;
}

export async function PaymentsResultsLoader({ url }: LoaderFunctionArgs): Promise<PaymentsResultsLoaderData> {
  const intentIdParam = url.searchParams.get('intentId');
  const boldIntentIdParam = url.searchParams.get('bold-order-id');
  const boldStatusParam = url.searchParams.get('bold-tx-status') || '';
  const intentId = intentIdParam || boldIntentIdParam || '';

  const { data } = await DansshipAPI.payments.getIntent(intentId);

  return {
    intentId,
    boldStatusParam,
    intent: data,
  };
}

function PaymentsResultPage() {
  const { t, i18n } = useTranslation();
  const revalidator = useRevalidator();
  const { intent, intentId } = useLoaderData<PaymentsResultsLoaderData>();
  const { call: cancelIntentPromise, isLoading: isCancellingIntent } = useCallablePromise((id: string) =>
    DansshipAPI.payments.cancelIntent(id),
  );
  const { call: getProofViewUrlPromise, isLoading: isGettingProofViewUrl } = useCallablePromise((id: string) =>
    DansshipAPI.payments.getProofViewUrl(id),
  );
  const { call: getProofUploadUrlPromise, isLoading: isGettingProofUploadUrl } = useCallablePromise(
    (id: string, payload: PaymentProofUploadRequest) => DansshipAPI.payments.getProofUploadUrl(id, payload),
  );
  const { call: confirmProofUploadPromise, isLoading: isConfirmingUpload } = useCallablePromise(
    (id: string, payload: ConfirmPaymentProofPayload) => DansshipAPI.payments.confirmProofUpload(id, payload),
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

  const confirmProofUpload = useCallback(
    async (id: string, payload: ConfirmPaymentProofPayload) => {
      const { error } = await confirmProofUploadPromise(id, payload);

      if (error) {
        toast.error(t('payments:proofUploadFailedDesc'));
      } else {
        toast.success(t('payments:proofUploadSuccess'));
      }
    },
    [confirmProofUploadPromise, t],
  );

  const getProofUploadUrl = useCallback(
    async (id: string, file: File) => {
      try {
        const { data } = await getProofUploadUrlPromise(id, {
          content_type: file.type as PaymentProofContentType,
        });

        if (data) {
          const { upload_url, file_key } = data;

          const uploadResponse = await fetch(upload_url, {
            method: 'PUT',
            headers: {
              'Content-Type': file.type,
            },
            body: file,
          });

          if (!uploadResponse.ok) {
            toast.error(t('payments:proofUploadFailedDesc'));
          }

          await confirmProofUpload(id, { file_key });
        }
      } catch {
        toast.error(t('payments:proofUploadFailedDesc'));
      }
    },
    [confirmProofUpload, getProofUploadUrlPromise, t],
  );

  const handleUploadProof = (intentId: string) => {
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

      await getProofUploadUrl(intentId, file);
    };

    input.click();
  };

  const cancelIntent = useCallback(
    async (id: string) => {
      const { ok } = await cancelIntentPromise(id);

      if (ok) {
        await revalidator.revalidate();
      }
    },
    [cancelIntentPromise, revalidator],
  );

  return (
    <div className='px-2 sm:px-4 md:px-8 pt-20 max-w-7xl mx-auto grid gap-20'>
      {intent && (
        <section className='rounded-2xl shadow-2xl'>
          <section className='bg-white p-8 rounded-2xl grid md:grid-cols-[1fr_1fr] gap-8 overflow-hidden'>
            <section className='relative min-h-70 bg-primary text-primary-foreground px-8 py-16 rounded-lg shadow-lg'>
              <img
                src='/assets/images/bailarina.png'
                alt='Dansship'
                className='absolute w-40 xs:w-50 sm:w-60 md:w-60/100 bottom-1/2 right-1/2 translate-1/2'
              />
            </section>
            <section className='grid content-center gap-4 py-14 relative bg-white'>
              <h4 className='m-0 text-center'>{intent.purchase_reference?.human_identifier}</h4>
              {intent.payment_method_type === PaymentMethod.CARD &&
                ['pending', 'pending_manual_review'].includes(intent.status) && (
                  <p className='m-0 text-center'>{t('payments:result.description')}</p>
                )}

              <section className='grid place-content-center gap-1 justify-items-center py-4'>
                <PaymentStatusBadge status={intent.status} />
                <small className='m-0'>{t('payments:currentIntentStatus')}</small>
              </section>

              <section className='border py-4 border-gray-200 rounded-2xl overflow-hidden'>
                {[
                  {
                    label: t('payments:createdAt'),
                    value: formatDateTime(intent.created_at, i18n.language),
                  },
                  {
                    label: t('payments:referenceId'),
                    value: <span className='font-code'>{intent.reference_id}</span>,
                  },
                  {
                    label: t('payments:methodLabel'),
                    value: t(`payments:method.${intent.payment_method_type}`),
                  },
                  {
                    label: '',
                    value: '',
                  },
                  {
                    label: t('payments:subtotal'),
                    value: formatPrice(intent.amount * 0.81, intent.currency),
                  },
                  {
                    label: t('payments:iva'),
                    value: formatPrice(intent.amount * 0.19, intent.currency),
                  },
                  {
                    label: t('payments:ammount'),
                    value: formatPrice(intent.amount, intent.currency),
                  },
                ].map(({ label, value }) => (
                  <section
                    key={label}
                    className={cn(
                      'grid grid-cols-[auto_1fr_auto] justify-between gap-2 items-center',
                      label && 'px-4 py-2 hover:bg-gray-100',
                      !label && 'border-b border-gray-200 my-4',
                    )}
                  >
                    {label && (
                      <>
                        <small className='m-0'>{label}</small>
                        <span className='border-b border-dashed border-gray-300' />
                        <small className='m-0'>{value}</small>
                      </>
                    )}
                  </section>
                ))}
              </section>

              <section className='bg-gray-200/60 rounded-2xl flex overflow-hidden'>
                <small className='m-0 block bg-gray-200 px-4 py-2'>{t('payments:intentId')}</small>
                <small className='m-0 block font-code px-4 py-2'>{intent.id}</small>
              </section>

              <section className='flex gap-4 items-center justify-end mt-4'>
                {intent.payment_method_type === PaymentMethod.TRANSFER && (
                  <Button
                    size='small'
                    color='primary'
                    variant='outlined'
                    isLoading={isGettingProofUploadUrl || isConfirmingUpload}
                    onClick={() => void handleUploadProof(intent.id)}
                  >
                    {t('payments:uploadProof')}
                  </Button>
                )}

                {intent.proof_url && (
                  <Button
                    size='small'
                    color='primary'
                    variant='outlined'
                    isLoading={isGettingProofViewUrl}
                    onClick={() => void getProofViewUrl(intent.id)}
                  >
                    {t('payments:viewProof')}
                  </Button>
                )}
                {intent.status !== 'cancelled' && (
                  <Button
                    size='small'
                    color='alert'
                    variant='outlined'
                    isLoading={isCancellingIntent}
                    onClick={() => void cancelIntent(intent.id)}
                  >
                    {t('payments:cancelIntent')}
                  </Button>
                )}
              </section>
            </section>
          </section>
        </section>
      )}

      {!intent && intentId && (
        <section className='rounded-2xl shadow-2xl'>
          <section className='bg-white rounded-2xl grid md:grid-cols-[3fr_2fr] overflow-hidden'>
            <section className='grid px-8 py-40 place-content-center gap-4 justify-items-center text-center'>
              <p className='whitespace-pre-line m-0'>{t('payments:intentDetailsNotFound')}</p>
              <section className='bg-gray-200/60 rounded-2xl flex overflow-hidden'>
                <small className='m-0 block bg-gray-200 px-4 py-2'>{t('payments:intentId')}</small>
                <small className='m-0 block font-code px-4 py-2'>{intentId}</small>
              </section>
              <Button
                color='primary'
                onClick={() => revalidator.revalidate()}
                isLoading={revalidator.state === 'loading'}
              >
                {t('payments:retryIntentDetails')}
              </Button>
            </section>
            <section className='relative bg-accent hidden md:block'>
              <img
                src='/assets/images/bailarina.png'
                alt='Dansship'
                className='absolute w-60/100 bottom-1/2 right-1/2 translate-1/2'
              />
            </section>
          </section>
        </section>
      )}

      <UserPaymentHistory
        title={t('payments:result.historyTitle')}
        statuses={['pending_manual_review', 'approved', 'rejected', 'cancelled', 'expired']}
      />
    </div>
  );
}

export const SecurePaymentsResultPage = SecurityGuard(PaymentsResultPage, {
  featureFlags: [],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
