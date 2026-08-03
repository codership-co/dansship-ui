import { format } from 'date-fns';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { AdminPaymentReviewModal } from './admin-payment-review-modal';

import { SpinnerLoader } from '@components/loaders';
import { PaymentStatusBadge } from '@components/modules';
import {
  Card,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  CardContent,
  CardHeader,
  CardTitle,
} from '@components/ui';
import { type AdminPaymentReviewPayload, DansshipAPI, PaymentIntent, PaymentStatus } from '@core/api';
import { formatPrice, paymentPurchaseLabel, purchaseTypeLabel, purchaseTypeLabelKey } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

const STATUS_OPTIONS: Array<{ value: 'all' | PaymentStatus; labelKey: string }> = [
  { value: 'all', labelKey: 'payments:admin.filter.all' },
  { value: PaymentStatus.PENDING_MANUAL_REVIEW, labelKey: 'payments:status.pending_manual_review' },
  { value: PaymentStatus.APPROVED, labelKey: 'payments:status.approved' },
  { value: PaymentStatus.REJECTED, labelKey: 'payments:status.rejected' },
  { value: PaymentStatus.CANCELLED, labelKey: 'payments:status.cancelled' },
  { value: PaymentStatus.EXPIRED, labelKey: 'payments:status.expired' },
];

export function AdminPaymentList() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentStatus>('all');
  const [selectedIntent, setSelectedIntent] = useState<PaymentIntent | null>(null);

  const filters = useMemo(
    () => ({
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [statusFilter],
  );

  const {
    response: payments,
    isLoading,
    reFetch,
  } = usePromise(() => DansshipAPI.paymentsAdmin.getAdminPayments(filters));
  const items = payments?.data?.items ?? [];
  const total = payments?.data?.total ?? 0;

  const { call: reviewPaymentPromise, isLoading: isReviewing } = useCallablePromise(
    (id: string, payload: AdminPaymentReviewPayload) => DansshipAPI.paymentsAdmin.reviewPayment(id, payload),
  );

  const reviewPayment = useCallback(
    async (id: string, payload: AdminPaymentReviewPayload) => {
      const { ok } = await reviewPaymentPromise(id, payload);

      if (ok) {
        toast.success(t('payments:admin.reviewSuccess'));
        await reFetch();
      } else {
        toast.error(t('payments:admin.reviewFailedDesc'));
      }
    },
    [reFetch, reviewPaymentPromise, t],
  );

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
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t('payments:admin.title')}</CardTitle>
        </CardHeader>

        <CardContent className='space-y-4'>
          <div className='flex flex-wrap items-center justify-between gap-3'>
            <div className='w-full max-w-xs'>
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | PaymentStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('payments:admin.filter.status')} />
                </SelectTrigger>

                <SelectContent>
                  {STATUS_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <p className='text-sm text-gray-500'>{t('payments:admin.total', { count: total })}</p>
          </div>

          <div className='rounded-md border'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payments:userLabel')}</TableHead>
                  <TableHead>{t('payments:planLabel')}</TableHead>
                  <TableHead>{t('common:type')}</TableHead>
                  <TableHead>{t('payments:total')}</TableHead>
                  <TableHead>{t('payments:methodLabel')}</TableHead>
                  <TableHead>{t('common:status')}</TableHead>
                  <TableHead>{t('payments:createdAt')}</TableHead>
                  <TableHead className='text-right'>{t('common:actions')}</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className='py-6 text-center text-gray-500'>
                      {t('payments:admin.empty')}
                    </TableCell>
                  </TableRow>
                ) : (
                  items.map(intent => {
                    const purchaseLabel = paymentPurchaseLabel(intent);
                    const userEmail = intent.user?.human_identifier ?? intent.user?.name ?? t('common:noData');

                    return (
                      <TableRow key={intent.id}>
                        <TableCell>{userEmail}</TableCell>

                        <TableCell>{purchaseLabel}</TableCell>

                        <TableCell>
                          {t(purchaseTypeLabelKey(intent.purchase_type), {
                            defaultValue: purchaseTypeLabel(intent.purchase_type),
                          })}
                        </TableCell>

                        <TableCell>{formatPrice(intent.amount, intent.currency)}</TableCell>

                        <TableCell>{t(`payments.method.${intent.payment_method_type}`)}</TableCell>

                        <TableCell>
                          <PaymentStatusBadge status={intent.status} />
                        </TableCell>

                        <TableCell>{format(new Date(intent.created_at), 'MMM d, yyyy', { locale })}</TableCell>

                        <TableCell className='text-right'>
                          <Button
                            size='sm'
                            variant='outline'
                            disabled={intent.status !== 'pending_manual_review'}
                            onClick={() => setSelectedIntent(intent)}
                          >
                            {t('payments:admin.review')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AdminPaymentReviewModal
        open={Boolean(selectedIntent)}
        intent={selectedIntent}
        onOpenChange={open => {
          if (!open) {
            setSelectedIntent(null);
          }
        }}
        onReview={reviewPayment}
        isReviewing={isReviewing}
        onSynced={() => {
          void reFetch();
        }}
      />
    </>
  );
}
