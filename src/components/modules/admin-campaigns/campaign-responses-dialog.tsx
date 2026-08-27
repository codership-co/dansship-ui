import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Badge, Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { type Campaign, type CampaignQuestion, type CampaignResponseItem, DansshipAPI } from '@core/api';
import { classLevelLabelKey, formatDateTime } from '@helpers';
import { usePromise } from '@hooks';

interface ClassOption {
  id: string;
  name: string;
}

interface CampaignResponsesDialogProps {
  campaign: Campaign | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes?: Array<ClassOption>;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function formatLevelValue(value: unknown, t: (key: string) => string): string {
  const labelKey = classLevelLabelKey(typeof value === 'string' ? value : undefined);

  return labelKey ? t(labelKey) : String(value ?? '—');
}

function formatAnswer(question: CampaignQuestion | undefined, value: unknown, t: (key: string) => string): string {
  if (value === undefined || value === null || value === '') {
    return '—';
  }

  if (question?.type === 'multiple_choice') {
    const selected = Array.isArray(value) ? value.map(String) : [String(value)];

    return selected
      .map(optionId => {
        const optionLabel = question.options.find(option => option.id === optionId)?.label ?? optionId;
        const levelKey = classLevelLabelKey(optionLabel) ?? classLevelLabelKey(optionId);

        return levelKey ? t(levelKey) : optionLabel;
      })
      .join(', ');
  }

  const levelKey = classLevelLabelKey(typeof value === 'string' ? value : undefined);

  if (levelKey) {
    return t(levelKey);
  }

  if (isRecord(value)) {
    return Object.entries(value)
      .map(([nestedKey, nestedValue]) => `${nestedKey}: ${formatAnswer(question, nestedValue, t)}`)
      .join(', ');
  }

  return String(value);
}

function answerRows(
  answers: Record<string, unknown>,
  questionsById: Map<string, CampaignQuestion>,
  classNames: Map<string, string>,
  t: (key: string) => string,
): Array<{ key: string; label: string; value: string }> {
  const rows: Array<{ key: string; label: string; value: string }> = [];

  for (const [key, value] of Object.entries(answers)) {
    if (key === 'levels' && isRecord(value)) {
      for (const [classId, level] of Object.entries(value)) {
        rows.push({
          key: `levels.${classId}`,
          label: classNames.get(classId) ?? classId,
          value: formatLevelValue(level, t),
        });
      }

      continue;
    }

    if (isRecord(value)) {
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        const nestedQuestion = questionsById.get(nestedKey);
        rows.push({
          key: `${key}.${nestedKey}`,
          label: nestedQuestion?.prompt ?? classNames.get(nestedKey) ?? nestedKey,
          value: formatAnswer(nestedQuestion, nestedValue, t),
        });
      }

      continue;
    }

    const question = questionsById.get(key);
    rows.push({
      key,
      label: question?.prompt ?? classNames.get(key) ?? key,
      value: formatAnswer(question, value, t),
    });
  }

  return rows;
}

export function CampaignResponsesDialog({ campaign, open, onOpenChange, classes = [] }: CampaignResponsesDialogProps) {
  const { t, i18n } = useTranslation();
  const enabled = open && Boolean(campaign?.id);
  const { response, isLoading } = usePromise(
    () => DansshipAPI.campaignsAdmin.listResponses(campaign?.id ?? ''),
    enabled,
    [campaign?.id, enabled],
  );

  const items = response?.ok ? (response.data ?? []) : [];
  const questionsById = new Map((campaign?.questions ?? []).map(question => [question.id, question]));
  const classNames = new Map(classes.map(classDefinition => [classDefinition.id, classDefinition.name]));
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
              <ResponseCard
                key={item.id}
                item={item}
                questionsById={questionsById}
                classNames={classNames}
                locale={i18n.language}
                t={t}
              />
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
  classNames,
  locale,
  t,
}: {
  item: CampaignResponseItem;
  questionsById: Map<string, CampaignQuestion>;
  classNames: Map<string, string>;
  locale: string;
  t: (key: string) => string;
}) {
  const studentLabel = item.user_name || item.user_email || t('campaigns:admin.responsesAnonymous');
  const isDismissed = item.status === 'dismissed';
  const rows = answerRows(item.answers, questionsById, classNames, t);

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
          {rows.map(row => (
            <div key={row.key}>
              <dt className='text-sm font-medium text-gray-700'>{row.label}</dt>
              <dd className='text-sm text-gray-600'>{row.value}</dd>
            </div>
          ))}
        </dl>
      )}
    </li>
  );
}
