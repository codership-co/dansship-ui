import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LoaderFunctionArgs, useLoaderData, useRevalidator } from 'react-router';

import { UserPaymentHistory } from '@components/modules';
import { Button } from '@components/ui';
import { SecurityGuard } from '@contexts';
import { DansshipAPI, PaymentIntentDetail, PaymentMethod } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatDateTime, formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

export interface PaymentsResultsLoaderData {
  intentId: string;
  boldStatusParam: string;
  intent: PaymentIntentDetail | null;
}

export async function PaymentsResultsLoader({ url }: LoaderFunctionArgs): Promise<PaymentsResultsLoaderData> {
  const intentIdState = window.history.state.usr?.intentId;
  const intentIdParam = url.searchParams.get('intentId');
  const boldIntentIdParam = url.searchParams.get('bold-order-id');
  const boldStatusParam = url.searchParams.get('bold-tx-status') || '';
  const intentId = intentIdState || intentIdParam || boldIntentIdParam || '';

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
  const { intent } = useLoaderData<PaymentsResultsLoaderData>();
  const { call: cancelIntentPromise, isLoading: isCancellingIntent } = useCallablePromise((id: string) =>
    DansshipAPI.payments.cancelIntent(id),
  );
  const { call: getProofViewUrlPromise, isLoading: isGettingProofViewUrl } = useCallablePromise((id: string) =>
    DansshipAPI.payments.getProofViewUrl(id),
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
    <div className='px-2 sm:px-4 md:px-8 pt-8 max-w-7xl mx-auto grid gap-8'>
      <h3>{t('payments:result.title')}</h3>

      {intent && (
        <section className='rounded-2xl shadow-2xl'>
          <section className='bg-white p-8 rounded-2xl grid md:grid-cols-[1fr_1fr] gap-8 overflow-hidden'>
            <section className='relative min-h-70 bg-primary text-primary-foreground px-8 py-16 rounded-lg shadow-lg'>
              <img
                src='/assets/images/bailarina.png'
                alt='Dansship'
                className='absolute w-40 xs:w-50 sm:w-60 md:w-50/100 bottom-1/2 right-1/2 translate-1/2'
              />
            </section>
            <section className='grid content-center gap-4 py-14 relative bg-white'>
              <h4 className='m-0 text-center'>{intent.purchase_reference?.human_identifier}</h4>
              {intent.payment_method_type === PaymentMethod.CARD ? (
                <p className='m-0 text-center'>{t('payments:result.description')}</p>
              ) : (
                <p className='m-0 text-center'>{t('payments:intentCreatedDesc')}</p>
              )}

              <section className='border border-gray-200 rounded-2xl overflow-hidden'>
                {[
                  {
                    label: t('payments:ammount'),
                    value: formatPrice(intent.amount, intent.currency),
                  },
                  {
                    label: t('payments:methodLabel'),
                    value: t(`payments:method.${intent.payment_method_type}`),
                  },
                  {
                    label: t('payments:createdAt'),
                    value: formatDateTime(intent.created_at, i18n.language),
                  },
                  {
                    label: t('payments:intentStatus'),
                    value: t(`payments:status.${intent.status}`),
                  },
                  {
                    label: t('payments:referenceId'),
                    value: <span className='font-code'>{intent.reference_id}</span>,
                  },
                ].map(({ label, value }) => (
                  <section
                    key={label}
                    className='grid grid-cols-[auto_1fr_auto] justify-between gap-2 items-center px-4 py-2 hover:bg-gray-100'
                  >
                    <small className='m-0'>{label}</small>
                    <span className='border-b border-dashed border-gray-300' />
                    <small className='m-0'>{value}</small>
                  </section>
                ))}
              </section>

              <section className='bg-gray-200/60 rounded-2xl flex overflow-hidden'>
                <small className='m-0 block bg-gray-200 px-4 py-2'>{t('payments:intentId')}</small>
                <small className='m-0 block font-code px-4 py-2'>{intent.id}</small>
              </section>

              <section className='flex gap-8 items-center'>
                {intent.proof_url && (
                  <Button
                    size='sm'
                    variant='outline'
                    disabled={isGettingProofViewUrl}
                    onClick={() => void getProofViewUrl(intent.id)}
                  >
                    {t('payments:viewProof')}
                  </Button>
                )}
                {intent.status !== 'cancelled' && (
                  <Button
                    size='sm'
                    variant='destructive'
                    disabled={isCancellingIntent}
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
