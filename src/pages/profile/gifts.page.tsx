import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { ConfirmDialog } from '@components/modals';
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI, GiftListItem, GiftOrderStatus } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatDateTime } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

function statusVariant(status: GiftOrderStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  switch (status) {
    case GiftOrderStatus.CLAIMED:
      return 'default';
    case GiftOrderStatus.PENDING_CLAIM:
      return 'secondary';
    case GiftOrderStatus.EXPIRED:
      return 'destructive';
    default:
      return 'outline';
  }
}

function GiftCard({
  gift,
  direction,
  onClaim,
  claimingId,
}: {
  gift: GiftListItem;
  direction: 'sent' | 'received';
  onClaim?: (gift: GiftListItem) => void;
  claimingId?: string | null;
}) {
  const { t, i18n } = useTranslation();

  return (
    <div className='rounded-lg border border-gray-200 p-4'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <p className='font-semibold text-gray-900'>{gift.plan_name}</p>
          <p className='text-sm text-gray-500 mt-1'>{formatDateTime(gift.created_at, i18n.language)}</p>

          {direction === 'sent' ? (
            <p className='text-sm text-gray-500 mt-1'>
              {t('gifts:recipientLabel')}: {gift.recipient_name} ({gift.recipient_email})
            </p>
          ) : (
            <p className='text-sm text-gray-500 mt-1'>
              {gift.is_anonymous
                ? t('gifts:anonymousSender')
                : t('gifts:fromSender', { name: gift.sender_display_name ?? '' })}
            </p>
          )}

          {gift.message ? (
            <p className='text-sm text-gray-500 mt-1'>
              {t('gifts:messageLabel')}: {gift.message}
            </p>
          ) : null}

          {gift.status === GiftOrderStatus.PENDING_CLAIM && gift.claim_deadline ? (
            <p className='text-sm text-gray-500 mt-1'>
              {t('gifts:claimDeadline', {
                date: formatDateTime(gift.claim_deadline, i18n.language),
              })}
            </p>
          ) : null}
        </div>

        <Badge variant={statusVariant(gift.status)}>{t(`gifts:status.${gift.status}`)}</Badge>
      </div>

      {direction === 'received' && gift.can_claim && onClaim ? (
        <div className='mt-4'>
          <Button variant='outline' size='sm' disabled={claimingId === gift.id} onClick={() => onClaim(gift)}>
            {claimingId === gift.id ? t('gifts:claimProcessing') : t('gifts:claimCta')}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function GiftsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [confirmGift, setConfirmGift] = useState<GiftListItem | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const {
    response: sentResponse,
    isLoading: sentLoading,
    error: sentError,
    reFetch: reloadSent,
  } = usePromise(() => DansshipAPI.gifts.listSent());
  const {
    response: receivedResponse,
    isLoading: receivedLoading,
    error: receivedError,
    reFetch: reloadReceived,
  } = usePromise(() => DansshipAPI.gifts.listReceived());

  const { call: claimById } = useCallablePromise((giftOrderId: string) => DansshipAPI.gifts.claimGiftById(giftOrderId));

  const sent = sentResponse?.data ?? [];
  const received = receivedResponse?.data ?? [];
  const isLoading = (sentLoading && !sentResponse) || (receivedLoading && !receivedResponse);
  const hasError =
    Boolean(sentError) ||
    Boolean(receivedError) ||
    Boolean(sentResponse && !sentResponse.ok) ||
    Boolean(receivedResponse && !receivedResponse.ok);

  const handleClaim = async () => {
    if (!confirmGift) return;

    setClaimingId(confirmGift.id);
    try {
      const result = await claimById(confirmGift.id);

      if (!result.ok) {
        toast.error(t('gifts:claimFailed'));

        return;
      }

      toast.success(t('gifts:claimSuccess'));
      setConfirmGift(null);
      await Promise.all([reloadReceived(), reloadSent()]);
      navigate(PageURLS.profile.subscription, { replace: true });
    } catch {
      toast.error(t('gifts:claimFailed'));
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className='max-w-6xl mx-auto py-10 px-4 pt-20'>
      <div className='mb-10'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('profile:gifts.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('profile:gifts.subtitle')}</p>
      </div>

      <div className='bg-white rounded-lg shadow-sm border border-gray-100 p-6'>
        {isLoading ? (
          <p className='text-gray-500'>{t('profile:gifts.loading')}</p>
        ) : hasError ? (
          <p className='text-alert-600'>{t('profile:gifts.loadFailed')}</p>
        ) : (
          <Tabs defaultValue='received'>
            <TabsList className='mb-4 h-auto flex-wrap gap-1 border border-gray-200 bg-white p-1 shadow-sm'>
              <TabsTrigger value='received'>{t('profile:gifts.received')}</TabsTrigger>
              <TabsTrigger value='sent'>{t('profile:gifts.sent')}</TabsTrigger>
            </TabsList>

            <TabsContent value='received'>
              {!received.length ? (
                <p className='text-gray-500'>{t('profile:gifts.emptyReceived')}</p>
              ) : (
                <div className='space-y-4'>
                  {received.map(gift => (
                    <GiftCard
                      key={gift.id}
                      gift={gift}
                      direction='received'
                      claimingId={claimingId}
                      onClaim={setConfirmGift}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value='sent'>
              {!sent.length ? (
                <p className='text-gray-500'>{t('profile:gifts.emptySent')}</p>
              ) : (
                <div className='space-y-4'>
                  {sent.map(gift => (
                    <GiftCard key={gift.id} gift={gift} direction='sent' />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(confirmGift)}
        onOpenChange={open => {
          if (!open) setConfirmGift(null);
        }}
        onConfirm={handleClaim}
        title={t('gifts:claimTitle')}
        description={
          confirmGift
            ? `${t('gifts:claimConfirm')}\n${t('gifts:planLabel')}: ${confirmGift.plan_name}`
            : t('gifts:claimConfirm')
        }
        confirmLabel={claimingId ? t('gifts:claimProcessing') : t('gifts:confirmClaim')}
        cancelLabel={t('gifts:cancel')}
        isLoading={Boolean(claimingId)}
      />
    </div>
  );
}

export const SecureGiftsPage = SecurityGuard(GiftsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
