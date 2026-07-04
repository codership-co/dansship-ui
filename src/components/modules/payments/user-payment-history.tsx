import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { PaymentStatusBadge } from '@components/modules';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@components/ui';
import { PaymentProofContentType, PaymentProofContentTypesList, type PaymentStatus } from '@core/api';
import { formatPrice, paymentPurchaseLabel, purchaseTypeLabelKey } from '@helpers';
import { useDateLocale, usePaymentIntents } from '@hooks';

interface UserPaymentHistoryProps {
  title?: string;
  statuses?: Array<PaymentStatus>;
  emptyStateKey?: 'payments:emptyState' | 'payments:historicalEmptyState' | 'payments:inProgressEmptyState';
}

export function UserPaymentHistory({
  title,
  statuses,
  emptyStateKey = 'payments:emptyState',
}: UserPaymentHistoryProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const {
    intents,
    isLoading,
    cancelIntent,
    isCancellingIntent,
    getProofViewUrl,
    isGettingProofViewUrl,
    getProofUploadUrl,
    isGettingProofUploadUrl,
  } = usePaymentIntents();

  const visibleIntents = statuses ? intents.filter(intent => statuses.includes(intent.status)) : intents;

  const handleViewProof = async (intentId: string) => {
    await getProofViewUrl(intentId);
  };

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

  if (isLoading) {
    return (
      <Card>
        <div className='flex justify-center p-8'>
          <SpinnerLoader />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? t('payments:myPayments')}</CardTitle>
      </CardHeader>

      <CardContent className='space-y-3'>
        {visibleIntents.length === 0 ? (
          <p className='text-sm text-gray-500'>{t(emptyStateKey)}</p>
        ) : (
          visibleIntents.map(intent => {
            const canAct = intent.status === 'pending_manual_review';
            const purchaseLabel = paymentPurchaseLabel(intent);

            return (
              <div key={intent.id} className='rounded-lg border border-gray-200 p-4'>
                <div className='flex flex-wrap items-start justify-between gap-2'>
                  <div>
                    <p className='font-semibold text-gray-900'>{purchaseLabel}</p>

                    <p className='text-sm text-gray-600'>{formatPrice(intent.amount, intent.currency)}</p>

                    <p className='text-xs text-gray-500'>
                      {t('payments:createdAt')}:{' '}
                      {format(new Date(intent.created_at), 'MMM d, yyyy', {
                        locale,
                      })}
                    </p>

                    <p className='text-xs text-gray-500'>
                      {t('common:type')}: {t(purchaseTypeLabelKey(intent.purchase_type))}
                    </p>

                    <p className='text-xs text-gray-500'>
                      {t('payments:methodLabel')}: {t(`payments:method.${intent.payment_method_type}`)}
                    </p>
                  </div>

                  <PaymentStatusBadge status={intent.status} />
                </div>

                {canAct && (
                  <div className='mt-3 space-y-3'>
                    <div className='flex flex-wrap gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        disabled={isGettingProofUploadUrl}
                        onClick={() => handleUploadProof(intent.id)}
                      >
                        {t('payments:uploadProof')}
                      </Button>

                      {intent.proof_url && (
                        <Button
                          size='sm'
                          variant='outline'
                          disabled={isGettingProofViewUrl}
                          onClick={() => void handleViewProof(intent.id)}
                        >
                          {t('payments:viewProof')}
                        </Button>
                      )}

                      <Button
                        size='sm'
                        variant='destructive'
                        disabled={isCancellingIntent}
                        onClick={() => void cancelIntent(intent.id)}
                      >
                        {t('payments:cancelIntent')}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
