import { Button } from 'polpo/components';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';

import { Section, SectionHeading } from '@components/containers';
import { Spinner } from '@components/loaders';
import { ConfirmDialog } from '@components/modals/confirm-dialog';
import { SecurityGuard, useAuth } from '@contexts';
import { DansshipAPI, DansshipAPIError, GiftClaimPreview } from '@core/api';
import { PageURLS } from '@core/constants';
import {
  clearPendingGiftClaimToken,
  formatDateTime,
  getPendingGiftClaimToken,
  setPendingGiftClaimToken,
} from '@helpers';
import { useCallablePromise } from '@hooks';

const GIFT_ERROR_LOCALE_KEYS: Record<string, string> = {
  GIFT_EMAIL_MISMATCH: 'emailMismatch',
  GIFT_CLAIM_EXPIRED: 'claimExpired',
  GIFT_CLAIM_TOKEN_INVALID: 'claimInvalid',
  GIFT_ALREADY_CLAIMED: 'claimAlreadyClaimed',
  GIFT_NOT_CLAIMABLE: 'claimNotClaimable',
};

function resolveGiftErrorMessage(error: unknown, t: (key: string) => string): string {
  if (error instanceof DansshipAPIError) {
    const localeKey = GIFT_ERROR_LOCALE_KEYS[String(error.body.error_code)];

    if (localeKey) {
      return t(`gifts:${localeKey}`);
    }
  }

  return t('gifts:claimFailed');
}

function GiftClaimPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const redirectedRef = useRef(false);

  const tokenFromQuery = searchParams.get('token');
  const token = useMemo(() => tokenFromQuery ?? getPendingGiftClaimToken(), [tokenFromQuery]);

  const [preview, setPreview] = useState<GiftClaimPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { call: previewClaim } = useCallablePromise((claimToken: string) => DansshipAPI.gifts.previewClaim(claimToken));
  const { call: claimGift, isLoading: isClaiming } = useCallablePromise((claimToken: string) =>
    DansshipAPI.gifts.claimGift(claimToken),
  );

  useEffect(() => {
    if (tokenFromQuery) {
      setPendingGiftClaimToken(tokenFromQuery);
    }
  }, [tokenFromQuery]);

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!token) {
      setPreviewError(t('gifts:noToken'));

      return;
    }

    if (!isAuthenticated) {
      if (redirectedRef.current) {
        return;
      }

      redirectedRef.current = true;
      setPendingGiftClaimToken(token);
      navigate(PageURLS.auth.login, { state: { from: location }, replace: true });

      return;
    }

    let cancelled = false;

    const loadPreview = async () => {
      setIsPreviewLoading(true);
      setPreviewError(null);

      const { data, ok, error } = await previewClaim(token);

      if (cancelled) {
        return;
      }

      setIsPreviewLoading(false);

      if (!ok) {
        setPreviewError(resolveGiftErrorMessage(error, t));

        return;
      }

      setPreview(data);
    };

    void loadPreview();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, location, navigate, previewClaim, ready, t, token]);

  const handleClaim = useCallback(async () => {
    if (!token) {
      return;
    }

    const { ok, error } = await claimGift(token);

    if (!ok) {
      toast.error(resolveGiftErrorMessage(error, t));

      return;
    }

    clearPendingGiftClaimToken();
    setConfirmOpen(false);
    toast.success(t('gifts:claimSuccess'));
    navigate(PageURLS.profile.subscription, { replace: true });
  }, [claimGift, navigate, t, token]);

  const confirmDescription = useMemo(() => {
    if (!preview) {
      return t('gifts:claimConfirm');
    }

    const senderLine = preview.is_anonymous
      ? t('gifts:anonymousSender')
      : t('gifts:fromSender', { name: preview.sender_display_name ?? '' });

    const lines = [t('gifts:claimConfirm'), `${t('gifts:planLabel')}: ${preview.plan_name}`, senderLine];

    if (preview.message) {
      lines.push(`${t('gifts:messageLabel')}: ${preview.message}`);
    }

    return lines.join('\n');
  }, [preview, t]);

  if (!ready || (!isAuthenticated && token)) {
    return (
      <Section navbarPadding className='grid place-content-center min-h-[50dvh]'>
        <Spinner />
      </Section>
    );
  }

  if (!token || previewError) {
    return (
      <Section navbarPadding>
        <SectionHeading title={t('gifts:claimTitle')} subtitle={previewError ?? t('gifts:claimInvalid')} />
      </Section>
    );
  }

  if (isPreviewLoading || !preview) {
    return (
      <Section navbarPadding className='grid place-content-center min-h-[50dvh]'>
        <Spinner />
      </Section>
    );
  }

  return (
    <Section navbarPadding>
      <SectionHeading title={t('gifts:claimTitle')} subtitle={t('gifts:claimSubtitle')} />

      <div className='mx-auto max-w-lg grid gap-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm'>
        <div className='grid gap-2 text-sm'>
          <p>
            <span className='font-medium text-gray-700'>{t('gifts:planLabel')}: </span>
            {preview.plan_name}
          </p>
          <p>
            <span className='font-medium text-gray-700'>{t('gifts:recipientLabel')}: </span>
            {preview.recipient_name}
          </p>
          <p>
            {preview.is_anonymous
              ? t('gifts:anonymousSender')
              : t('gifts:fromSender', { name: preview.sender_display_name ?? '' })}
          </p>
          {preview.message ? (
            <p>
              <span className='font-medium text-gray-700'>{t('gifts:messageLabel')}: </span>
              {preview.message}
            </p>
          ) : null}
          <p className='text-gray-600'>
            {t('gifts:claimDeadline', {
              date: formatDateTime(preview.claim_deadline, i18n.language),
            })}
          </p>
        </div>

        <Button color='primary' className='w-full' onClick={() => setConfirmOpen(true)}>
          {t('gifts:claimCta')}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={handleClaim}
        title={t('gifts:claimTitle')}
        description={confirmDescription}
        confirmLabel={t('gifts:confirmClaim')}
        cancelLabel={t('gifts:cancel')}
        isLoading={isClaiming}
      />
    </Section>
  );
}

export const SecureGiftClaimPage = SecurityGuard(GiftClaimPage);
