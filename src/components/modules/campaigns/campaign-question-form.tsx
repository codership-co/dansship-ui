import { type ReactNode, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { CLASS_CSAT_TYPE } from '../../../helpers/class-feedback';

import { ClassCsatForm } from './class-csat-form';
import { CLASS_LEVEL_SELF_ASSESSMENT_TYPE, ClassLevelSelfAssessmentForm } from './class-level-self-assessment-form';

import { Button, Checkbox, Label, Textarea } from '@components/ui';
import { type CampaignAnswerValue, type CampaignQuestion, type PendingCampaign } from '@core/api';
import { cn } from '@helpers';

type AnswerValue = CampaignAnswerValue;

interface CampaignQuestionFormProps {
  campaign: PendingCampaign;
  isSubmitting?: boolean;
  onSubmit: (answers: Record<string, AnswerValue>) => Promise<void>;
  onDismiss?: () => void;
}

export type { CampaignQuestionFormProps };

export const STRUCTURED_CAMPAIGN_RENDERERS: Record<string, (props: CampaignQuestionFormProps) => ReactNode> = {
  [CLASS_LEVEL_SELF_ASSESSMENT_TYPE]: ClassLevelSelfAssessmentForm,
  [CLASS_CSAT_TYPE]: ClassCsatForm,
};

export function CampaignQuestionForm({ campaign, isSubmitting, onSubmit, onDismiss }: CampaignQuestionFormProps) {
  const Renderer = campaign.structured_type ? STRUCTURED_CAMPAIGN_RENDERERS[campaign.structured_type] : undefined;

  if (Renderer) {
    return <Renderer campaign={campaign} isSubmitting={isSubmitting} onSubmit={onSubmit} onDismiss={onDismiss} />;
  }

  return (
    <GenericCampaignQuestionForm
      campaign={campaign}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
    />
  );
}

function GenericCampaignQuestionForm({ campaign, isSubmitting, onSubmit, onDismiss }: CampaignQuestionFormProps) {
  const { t } = useTranslation();
  const defaultValues = useMemo(() => {
    const values: Record<string, AnswerValue | undefined> = {};

    for (const question of campaign.questions) {
      if (question.type === 'multiple_choice' && question.allow_multiple) {
        values[question.id] = [];
      } else {
        values[question.id] = undefined;
      }
    }

    return values;
  }, [campaign.questions]);

  const form = useForm<Record<string, AnswerValue | undefined>>({ defaultValues });

  const handleSubmit = form.handleSubmit(async values => {
    const answers: Record<string, AnswerValue> = {};

    for (const question of campaign.questions) {
      const value = values[question.id];

      if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
        if (question.required) {
          form.setError(question.id, { message: t('campaigns:overlay.required') });

          return;
        }

        continue;
      }

      answers[question.id] = value;
    }

    await onSubmit(answers);
  });

  return (
    <form className='space-y-6 p-6' onSubmit={handleSubmit}>
      <div>
        <h2 className='text-xl font-semibold text-gray-900'>{campaign.title}</h2>
        {campaign.description ? <p className='mt-2 text-sm text-gray-600'>{campaign.description}</p> : null}
      </div>
      {campaign.questions.map(question => (
        <QuestionField
          key={question.id}
          question={question}
          value={form.watch(question.id)}
          error={form.formState.errors[question.id]?.message}
          onChange={value => {
            form.clearErrors(question.id);
            form.setValue(question.id, value);
          }}
        />
      ))}
      <div className='grid gap-2'>
        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? t('campaigns:overlay.submitting') : t('campaigns:overlay.submit')}
        </Button>
        {onDismiss ? (
          <Button type='button' variant='ghost' disabled={isSubmitting} className='w-full' onClick={onDismiss}>
            {t('campaigns:overlay.skip')}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

function QuestionField({
  question,
  value,
  error,
  onChange,
}: {
  question: CampaignQuestion;
  value: AnswerValue | undefined;
  error?: string;
  onChange: (value: AnswerValue) => void;
}) {
  const { t } = useTranslation();

  return (
    <fieldset className='space-y-2'>
      <Label>
        {question.prompt}
        {question.required ? ' *' : ''}
      </Label>
      {question.type === 'text' ? (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          placeholder={t('campaigns:overlay.writeAnswer')}
          onChange={event => onChange(event.target.value)}
        />
      ) : null}
      {question.type === 'multiple_choice' && !question.allow_multiple ? (
        <div className='grid gap-2'>
          {question.options.map(option => (
            <button
              key={option.id}
              type='button'
              className={cn(
                'rounded-lg border px-4 py-2 text-left text-sm',
                value === option.id ? 'border-primary bg-primary/10' : 'border-gray-200',
              )}
              onClick={() => onChange(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
      {question.type === 'multiple_choice' && question.allow_multiple ? (
        <div className='grid gap-2'>
          {question.options.map(option => {
            const selected = Array.isArray(value) ? value.includes(option.id) : false;

            return (
              <label key={option.id} className='flex items-center gap-2 text-sm'>
                <Checkbox
                  checked={selected}
                  onCheckedChange={checked => {
                    const current = Array.isArray(value) ? value : [];
                    onChange(checked ? [...current, option.id] : current.filter(item => item !== option.id));
                  }}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      ) : null}
      {question.type === 'scale' ? (
        <div className='flex flex-wrap items-center gap-2'>
          {question.min_label ? <span className='text-xs text-gray-500'>{question.min_label}</span> : null}
          {Array.from({ length: question.max - question.min + 1 }, (_, index) => question.min + index).map(score => (
            <button
              key={score}
              type='button'
              className={cn(
                'size-10 rounded-full border text-sm',
                value === score ? 'border-primary bg-primary text-white' : 'border-gray-200',
              )}
              onClick={() => onChange(score)}
            >
              {score}
            </button>
          ))}
          {question.max_label ? <span className='text-xs text-gray-500'>{question.max_label}</span> : null}
        </div>
      ) : null}
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
    </fieldset>
  );
}
