import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { PaymentProofUpload, PaymentStatusBadge } from '@components/modules';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PERMISSION } from '@core/permissions';
import { formatMerchPrice } from '@helpers';
import { usePromise } from '@hooks';

interface OrderDetailProps {
  orderId: string;
  onCancelOrder?: (orderId: string) => Promise<unknown>;
  isCancelling?: boolean;
}

export function OrderDetail({ orderId, onCancelOrder, isCancelling = false }: OrderDetailProps) {
  const { t } = useTranslation();
  const [isOpeningProof, setIsOpeningProof] = useState(false);

  const { response: order, isLoading } = usePromise(() => DansshipAPI.merchAdmin.getOrder(orderId), Boolean(orderId));

  const paymentIntentId = order?.data?.payment_intent?.id ?? order?.data?.payment_intent_id;
  const canManagePayment = useOrPermissions([PERMISSION.PAYMENT_MANAGE]);
  const canUploadProof = useOrPermissions([
    PERMISSION.PAYMENT_MANAGE,
    PERMISSION.SUBSCRIPTION_PURCHASE,
    PERMISSION.ORDER_CREATE,
  ]);
  const proofUploadMode = useOrPermissions([PERMISSION.PAYMENT_MANAGE, PERMISSION.ORDER_CREATE]) ? 'admin' : 'owner';

  const { response: paymentDetail } = usePromise(
    () => DansshipAPI.paymentsAdmin.getAdminPaymentDetail(paymentIntentId as string),
    Boolean(paymentIntentId) && canManagePayment,
  );

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <SpinnerLoader />
      </div>
    );
  }

  if (!order) {
    return <p className='text-sm text-gray-500'>{t('common:noData')}</p>;
  }

  const resolvedPaymentStatus = paymentDetail?.data?.status ?? order?.data?.payment_intent?.status;
  const resolvedPaymentMethod =
    paymentDetail?.data?.payment_method_type ?? order?.data?.payment_intent?.payment_method_type;
  const isPendingManualReview = resolvedPaymentStatus === 'pending_manual_review';
  const resolvedProofUrl = paymentDetail?.data?.proof_url ?? order?.data?.payment_intent?.proof_url ?? null;
  const hasProof = Boolean(resolvedProofUrl);
  const directProofUrl =
    typeof resolvedProofUrl === 'string' &&
    (resolvedProofUrl.startsWith('http://') || resolvedProofUrl.startsWith('https://'))
      ? resolvedProofUrl
      : null;

  const customerDisplay = order?.data?.customer?.human_identifier ?? order?.data?.customer?.name ?? '-';

  const handleViewProof = async () => {
    if (!paymentIntentId || !canManagePayment || isOpeningProof) return;

    setIsOpeningProof(true);
    const { data, ok } = await DansshipAPI.paymentsAdmin.getAdminPaymentProofViewUrl(paymentIntentId);
    setIsOpeningProof(false);

    if (ok) {
      window.open(data?.view_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 gap-3 rounded-md border bg-gray-50 p-4 sm:grid-cols-2'>
        <div>
          <p className='text-xs text-gray-500'>ID</p>
          <p className='font-medium'>{order?.data?.id}</p>
        </div>
        <div>
          <p className='text-xs text-gray-500'>{t('common:status')}</p>
          <p className='font-medium capitalize'>{order?.data?.status}</p>
        </div>
        <div>
          <p className='text-xs text-gray-500'>{t('common:email')}</p>
          <p className='font-medium'>{customerDisplay}</p>
        </div>
        <div>
          <p className='text-xs text-gray-500'>{t('payments:methodLabel')}</p>
          <p className='font-medium'>{resolvedPaymentMethod ? t(`payments.method.${resolvedPaymentMethod}`) : '-'}</p>
        </div>
        <div>
          <p className='text-xs text-gray-500'>{t('payments:total')}</p>
          <p className='font-medium'>{formatMerchPrice(order?.data?.total_amount ?? 0)}</p>
        </div>
        <div>
          <p className='text-xs text-gray-500'>{t('common:status')}</p>
          {resolvedPaymentStatus ? (
            <PaymentStatusBadge status={resolvedPaymentStatus} />
          ) : (
            <p className='font-medium'>-</p>
          )}
        </div>
      </div>

      {paymentIntentId ? (
        <div className='space-y-2 rounded-md border border-gray-200 bg-gray-50 p-3'>
          <div>
            <p className='text-sm font-semibold text-gray-900'>
              {t('merch:paymentReview.title', { defaultValue: 'Payment review context' })}
            </p>
            <p className='text-xs text-gray-600'>
              {t('merch:paymentReview.subtitle', {
                defaultValue:
                  'This order is linked to a payment intent. Use the payments queue for approve or reject actions.',
              })}
            </p>
          </div>
          <p className='text-sm font-semibold text-gray-900'>{t('payments:proofLabel')}</p>
          {hasProof ? (
            <div className='space-y-2'>
              {directProofUrl ? (
                <a href={directProofUrl} target='_blank' rel='noreferrer' className='text-xs text-primary underline'>
                  {t('payments:viewProof', { defaultValue: 'View uploaded receipt' })}
                </a>
              ) : canManagePayment ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  disabled={isOpeningProof}
                  onClick={() => void handleViewProof()}
                >
                  {isOpeningProof
                    ? t('common:loading', { defaultValue: 'Loading...' })
                    : t('payments:viewProof', { defaultValue: 'View uploaded receipt' })}
                </Button>
              ) : (
                <p className='text-xs text-gray-600'>{t('payments:proofLabel')}</p>
              )}
            </div>
          ) : (
            <p className='text-xs text-gray-500'>
              {t('payments:admin.noProof', { defaultValue: 'No proof uploaded' })}
            </p>
          )}

          {isPendingManualReview ? (
            canUploadProof ? (
              <PaymentProofUpload
                intentId={paymentIntentId}
                currentProofUrl={resolvedProofUrl}
                mode={proofUploadMode}
              />
            ) : (
              <p className='text-xs text-gray-600'>
                {t('merch:proofUploadPolicyHint', {
                  defaultValue:
                    'Proof upload is only available for the payment owner; use admin payments review to continue.',
                })}
              </p>
            )
          ) : (
            <p className='text-xs text-gray-600'>
              {t('payments:admin.noLongerPending', {
                defaultValue: 'Payment review is already resolved for this order.',
              })}
            </p>
          )}

          <Link to='/admin/payments' className='text-xs text-primary underline'>
            {t('payments:admin.openQueue', { defaultValue: 'Open payment review queue' })}
          </Link>
        </div>
      ) : null}

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('merch:productName')}</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>{t('merch:productPrice')}</TableHead>
              <TableHead className='text-right'>{t('payments:total')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order?.data?.items.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.product?.name ?? item.product_id}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{formatMerchPrice(item.unit_price)}</TableCell>
                <TableCell className='text-right'>{formatMerchPrice(item.unit_price * item.quantity)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {order?.data?.status === 'pending' && onCancelOrder ? (
        <div className='flex justify-end'>
          <Button
            variant='destructive'
            disabled={isCancelling || !order?.data?.id}
            onClick={order?.data?.id ? () => void onCancelOrder(order?.data?.id) : undefined}
          >
            {t('merch:cancelOrder')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
