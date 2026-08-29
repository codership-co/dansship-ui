import { ActionModal } from 'polpo/components';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClipboardList } from 'react-icons/lu';
import { useLocation } from 'react-router';
import { toast } from 'sonner';

import { CLASS_CSAT_TYPE } from '../../../helpers/class-feedback';

import { CampaignQuestionForm } from './campaign-question-form';

import { useAuth } from '@contexts';
import { DansshipAPI, DansshipAPIError, type CampaignAnswerValue } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

const STUDENT_CAMPAIGN_PREFIXES = ['/classes', '/profile', '/figures', '/figure', '/studio-rental'];

function isStudentCampaignRoute(pathname: string) {
  return STUDENT_CAMPAIGN_PREFIXES.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function CampaignOverlayHost() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const { ready, isAuthenticated, user } = useAuth();
  const enabled = ready && isAuthenticated && Boolean(user?.onboardingCompleted) && isStudentCampaignRoute(pathname);
  const [dismissedId, setDismissedId] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dismissingRef = useRef(false);
  const handledRef = useRef(false);

  const { response, reFetch } = usePromise(() => DansshipAPI.campaigns.getPending(), enabled, [pathname, enabled]);
  const { call: submitPromise, isLoading: isSubmitting } = useCallablePromise(
    (campaignId: string, answers: Record<string, CampaignAnswerValue>) =>
      DansshipAPI.campaigns.submitResponse(campaignId, { answers }),
  );
  const { call: dismissPromise, isLoading: isDismissing } = useCallablePromise((campaignId: string) =>
    DansshipAPI.campaigns.dismiss(campaignId),
  );

  const pending = response?.data?.campaign ?? null;
  const campaign = pending && pending.id !== dismissedId ? pending : null;
  const isBusy = isSubmitting || isDismissing;

  useEffect(() => {
    handledRef.current = false;
    dismissingRef.current = false;
  }, [pending?.id]);

  useEffect(() => {
    setIsOpen(Boolean(campaign));
  }, [campaign]);

  if (!enabled || !campaign) {
    return null;
  }

  const persistDismiss = async () => {
    if (handledRef.current || dismissingRef.current) {
      return true;
    }

    dismissingRef.current = true;
    handledRef.current = true;
    setDismissedId(campaign.id);
    setIsOpen(false);

    if (campaign.structured_type === CLASS_CSAT_TYPE) {
      dismissingRef.current = false;

      return true;
    }

    try {
      const result = await dismissPromise(campaign.id);
      const alreadyHandled = !result.ok && result.error instanceof DansshipAPIError && result.error.status === 409;

      if (!result.ok && !alreadyHandled) {
        toast.error(t('campaigns:overlay.dismissFailed'));
        handledRef.current = false;
        setDismissedId(null);
        setIsOpen(true);
        dismissingRef.current = false;

        return false;
      }

      await reFetch();
      dismissingRef.current = false;

      return true;
    } catch {
      toast.error(t('campaigns:overlay.dismissFailed'));
      handledRef.current = false;
      setDismissedId(null);
      setIsOpen(true);
      dismissingRef.current = false;

      return false;
    }
  };

  return (
    <ActionModal
      closeOnClickOutside={false}
      lineOnTop
      icon={LuClipboardList}
      isOpen={isOpen}
      onClose={() => {
        void persistDismiss();
      }}
      className='w-[min(100dvw,32rem)] max-w-lg max-h-[min(90dvh,40rem)] overflow-y-auto p-0'
    >
      <CampaignQuestionForm
        campaign={campaign}
        isSubmitting={isBusy}
        onDismiss={() => {
          void persistDismiss();
        }}
        onSubmit={async answers => {
          try {
            const { ok } = await submitPromise(campaign.id, answers);

            if (!ok) {
              toast.error(t('campaigns:overlay.submitFailed'));

              return;
            }

            toast.success(t('campaigns:overlay.submitSuccess'));
            handledRef.current = true;
            setIsOpen(false);
            setDismissedId(null);
            await reFetch();
          } catch {
            toast.error(t('campaigns:overlay.submitFailed'));
          }
        }}
      />
    </ActionModal>
  );
}
