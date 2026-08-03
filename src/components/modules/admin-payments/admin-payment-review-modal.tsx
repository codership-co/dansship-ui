import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Dialog, DialogContent, DialogHeader, DialogTitle, Button, Textarea } from '@components/ui';
import { PaymentIntent, PaymentIntentDetail, AdminPaymentReviewPayload, DansshipAPI, PaymentStatus } from '@core/api';
import { formatPrice, paymentPurchaseLabel, purchaseTypeLabel, purchaseTypeLabelKey } from '@helpers';

interface AdminPaymentReviewModalProps {
  open: boolean;
  intent: PaymentIntent | null;
  onOpenChange: (open: boolean) => void;
  onReview: (id: string, payload: AdminPaymentReviewPayload) => Promise<void>;
  isReviewing: boolean;
  onSynced?: () => void;
}

const PENDING_STATUSES = new Set([PaymentStatus.PENDING, PaymentStatus.PENDING_MANUAL_REVIEW]);

export function AdminPaymentReviewModal({
  open,
  intent,
  onOpenChange,
  onReview,
  isReviewing,
  onSynced,
}: AdminPaymentReviewModalProps) {
  const { t } = useTranslation();
  const [notes, setNotes] = useState('');
  const [detail, setDetail] = useState<PaymentIntentDetail | null>(null);
  const [proofViewUrl, setProofViewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncingBold, setIsSyncingBold] = useState(false);
  const [isRejectConfirmOpen, setIsRejectConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open || !intent) {
      setDetail(null);
      setProofViewUrl(null);
      setNotes('');
      setIsLoading(false);
      setIsSyncingBold(false);

      return;
    }

    let isMounted = true;
    setIsLoading(true);

    DansshipAPI.paymentsAdmin
      .getAdminPaymentDetail(intent.id)
      .then(async response => {
        if (!response.ok) {
          return;
        }

        const data = response.data;

        if (isMounted) {
          setDetail(data);
        }

        if (data.proof_url) {
          try {
            const { data: proof } = await DansshipAPI.paymentsAdmin.getAdminPaymentProofViewUrl(intent.id);

            if (isMounted && proof) {
              setProofViewUrl(proof.view_url);
            }
          } catch {
            if (isMounted) {
              setProofViewUrl(null);
            }
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [open, intent]);

  const current = detail ?? intent;

  if (!current) {
    return null;
  }

  const canSyncBold = current.gateway_provider === 'bold' && PENDING_STATUSES.has(current.status as PaymentStatus);

  const handleApprove = async () => {
    await onReview(current.id, {
      action: 'approve',
      admin_notes: notes.trim() || undefined,
    });
    onOpenChange(false);
  };

  const handleReject = async () => {
    await onReview(current.id, {
      action: 'reject',
      admin_notes: notes.trim() || undefined,
    });
    setIsRejectConfirmOpen(false);
    onOpenChange(false);
  };

  const handleSyncBold = async () => {
    setIsSyncingBold(true);

    try {
      const { ok, data } = await DansshipAPI.paymentsAdmin.syncBoldPayment(current.id);

      if (!ok || !data) {
        toast.error(t('payments:admin.syncBoldFailedDesc'));

        return;
      }

      setDetail(prev => ({ ...(prev ?? current), ...data.intent }) as PaymentIntentDetail);

      if (data.outcome === 'finalized_approved' || data.outcome === 'finalized_rejected') {
        toast.success(t('payments:admin.syncBoldSuccess'));
        onSynced?.();
      } else {
        toast.message(t('payments:admin.syncBoldNoChange'), {
          description: data.message,
        });
      }
    } catch {
      toast.error(t('payments:admin.syncBoldFailedDesc'));
    } finally {
      setIsSyncingBold(false);
    }
  };

  const purchaseLabel = paymentPurchaseLabel(current);
  const userEmail = current.user?.human_identifier ?? current.user?.name ?? t('common:noData');
  const busy = isReviewing || isSyncingBold;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='max-w-lg'>
          <DialogHeader>
            <DialogTitle>{t('payments:admin.reviewTitle')}</DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className='flex justify-center p-6'>
              <SpinnerLoader />
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700'>
                <p>
                  <span className='font-medium'>{t('payments:planLabel')}:</span> {purchaseLabel}
                </p>
                <p>
                  <span className='font-medium'>{t('common:type')}:</span>{' '}
                  {t(purchaseTypeLabelKey(current.purchase_type), {
                    defaultValue: purchaseTypeLabel(current.purchase_type),
                  })}
                </p>
                <p>
                  <span className='font-medium'>{t('payments:total')}:</span>{' '}
                  {formatPrice(current.amount, current.currency)}
                </p>
                <p>
                  <span className='font-medium'>{t('payments:methodLabel')}:</span>{' '}
                  {t(`payments.method.${current.payment_method_type}`)}
                </p>
                <p>
                  <span className='font-medium'>{t('payments:userLabel')}:</span> {userEmail}
                </p>
              </div>

              <div className='space-y-2'>
                <p className='text-sm font-medium text-gray-900'>{t('payments:proofLabel')}</p>
                {proofViewUrl ? (
                  <a href={proofViewUrl} target='_blank' rel='noreferrer' className='text-sm text-primary underline'>
                    {t('payments:admin.viewProof')}
                  </a>
                ) : (
                  <p className='text-sm text-gray-500'>{t('payments:admin.noProof')}</p>
                )}
              </div>

              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-900' htmlFor='admin_notes'>
                  {t('payments:admin.notesLabel')}
                </label>
                <Textarea
                  id='admin_notes'
                  rows={3}
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder={t('payments:admin.notesPlaceholder')}
                />
              </div>

              <div className='flex flex-wrap justify-end gap-2 pt-2'>
                <Button variant='outline' onClick={() => onOpenChange(false)} disabled={busy}>
                  {t('common:cancel')}
                </Button>
                {canSyncBold && (
                  <Button variant='outline' onClick={() => void handleSyncBold()} disabled={busy}>
                    {isSyncingBold ? t('common:saving') : t('payments:admin.syncBold')}
                  </Button>
                )}
                <Button variant='destructive' onClick={() => setIsRejectConfirmOpen(true)} disabled={busy}>
                  {t('payments:admin.reject')}
                </Button>
                <Button onClick={() => void handleApprove()} disabled={busy}>
                  {isReviewing ? t('common:saving') : t('payments:admin.approve')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={isRejectConfirmOpen}
        onOpenChange={setIsRejectConfirmOpen}
        onConfirm={handleReject}
        title={t('payments:admin.rejectConfirmTitle')}
        description={t('payments:admin.rejectConfirmDesc')}
        confirmLabel={t('payments:admin.reject')}
        confirmVariant='destructive'
        isLoading={isReviewing}
      />
    </>
  );
}
