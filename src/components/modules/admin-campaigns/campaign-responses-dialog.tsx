import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { type Campaign, type CampaignQuestion, type CampaignResponseItem, DansshipAPI } from '@core/api';
import { formatDateTime } from '@helpers';
import { usePromise } from '@hooks';

interface CampaignResponsesDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function formatAnswer(question: CampaignQuestion | undefined, value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (question?.type === 'multiple_choice') {
    const selected = Array.isArray(value) ? value.map(String) : [String(value)];

    return selected
      .map(optionId => question.options.find(option => option.id === optionId)?.label ?? optionId)
      .join(', ');
  }

  return String(value);
}

export function CampaignResponsesDialog({ campaign, open, onOpenChange }: CampaignResponsesDialogProps) {
  const { t, i18n } = useTranslation();
  const enabled = open && Boolean(campaign?.id);
  const { response, isLoading } = usePromise(
    () => DansshipAPI.campaignsAdmin.listResponses(campaign?.id ?? ''),
    enabled,
    [campaign?.id, enabled],
  );

  const items = response?.ok ? (response.data ?? []) : [];
  const questionsById = new Map((campaign?.questions ?? []).map(question => [question.id, question]));
  const loadFailed = Boolean(response && !response.ok);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl max-h-[80dvh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {campaign
              ? t('campaigns:admin.responsesTitle', { title: campaign.title })
              : t('campaigns:admin.viewResponses')}
          </DialogTitle>
        </DialogHeader>
        {!campaign || isLoading ? (
          <div className='py-8 flex justify-center'>
            <SpinnerLoader />
          </div>
        ) : loadFailed ? (
          <p className='text-sm text-gray-500'>{t('campaigns:admin.responsesLoadFailed')}</p>
        ) : items.length === 0 ? (
          <p className='text-sm text-gray-500'>{t('campaigns:admin.responsesEmpty')}</p>
        ) : (
          <ul className='space-y-4'>
            {items.map(item => (
              <ResponseCard key={item.id} item={item} questionsById={questionsById} locale={i18n.language} t={t} />
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ResponseCard({
  item,
  questionsById,
  locale,
  t,
}: {
  item: CampaignResponseItem;
  questionsById: Map<string, CampaignQuestion>;
  locale: string;
  t: (key: string) => string;
}) {
  const studentLabel = item.user_name || item.user_email || t('campaigns:admin.responsesAnonymous');
  const isDismissed = item.status === 'dismissed';

  return (
    <li className='rounded-lg border border-gray-200 p-4 space-y-3'>
      <div className='flex flex-wrap items-start justify-between gap-2'>
        <div>
          <p className='font-medium text-gray-900'>{studentLabel}</p>
          {item.user_name && item.user_email ? <p className='text-sm text-gray-500'>{item.user_email}</p> : null}
          <p className='text-xs text-gray-400 mt-1'>{formatDateTime(item.created_at, locale)}</p>
        </div>
        <Badge variant={isDismissed ? 'secondary' : 'default'}>
          {isDismissed ? t('campaigns:admin.responsesDismissed') : t('campaigns:admin.responsesAnswered')}
        </Badge>
      </div>
      {isDismissed ? (
        <p className='text-sm text-gray-500'>{t('campaigns:admin.responsesSkipped')}</p>
      ) : (
        <dl className='space-y-2'>
          {Object.entries(item.answers).map(([questionId, value]) => {
            const question = questionsById.get(questionId);

            return (
              <div key={questionId}>
                <dt className='text-sm font-medium text-gray-700'>{question?.prompt ?? questionId}</dt>
                <dd className='text-sm text-gray-600'>{formatAnswer(question, value)}</dd>
              </div>
            );
          })}
        </dl>
      )}
    </li>
  );
}
