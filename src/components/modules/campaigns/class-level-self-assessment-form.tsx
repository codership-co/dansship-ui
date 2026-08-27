import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Label } from '@components/ui';
import { type CampaignAnswerValue, type PendingCampaign } from '@core/api';
import { CLASS_LEVELS, classLevelLabelKey, cn } from '@helpers';

export const CLASS_LEVEL_SELF_ASSESSMENT_TYPE = 'class_level_self_assessment';

interface ClassLevelSelfAssessmentFormProps {
  campaign: PendingCampaign;
  isSubmitting?: boolean;
  onSubmit: (answers: Record<string, CampaignAnswerValue>) => Promise<void>;
  onDismiss?: () => void;
}

export function ClassLevelSelfAssessmentForm({
  campaign,
  isSubmitting,
  onSubmit,
  onDismiss,
}: ClassLevelSelfAssessmentFormProps) {
  const { t } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const questions = campaign.questions.filter(question => question.type === 'multiple_choice');
  const currentQuestion = questions[stepIndex];
  const isLastStep = stepIndex >= questions.length - 1;
  const selectedLevel = currentQuestion ? values[currentQuestion.id] : undefined;
  const defaultHint = useMemo(() => t('campaigns:classLevel.profileHint'), [t]);

  const persistAnswers = async () => {
    const levels: Record<string, string> = {};

    for (const question of questions) {
      levels[question.id] = values[question.id];
    }

    await onSubmit({ levels } as Record<string, CampaignAnswerValue>);
  };

  const handleContinue = async () => {
    if (!currentQuestion) {
      return;
    }

    if (currentQuestion.required && !selectedLevel) {
      setError(t('campaigns:overlay.required'));

      return;
    }

    setError(null);

    if (isLastStep) {
      await persistAnswers();

      return;
    }

    setStepIndex(current => current + 1);
  };

  if (!currentQuestion) {
    return (
      <div className='space-y-6 p-6'>
        <h2 className='text-xl font-semibold text-gray-900'>{campaign.title}</h2>
        {onDismiss ? (
          <Button type='button' variant='outline' className='w-full' onClick={onDismiss}>
            {t('common:close')}
          </Button>
        ) : null}
      </div>
    );
  }

  return (
    <form
      className='grid gap-6 p-6'
      onSubmit={event => {
        event.preventDefault();
        void handleContinue();
      }}
    >
      <div>
        <h2 className='text-xl font-semibold text-gray-900'>{campaign.title}</h2>
        {campaign.description ? <p className='mt-2 text-sm text-gray-600'>{campaign.description}</p> : null}
        {questions.length > 1 ? (
          <p className='mt-3 text-xs font-medium uppercase tracking-[0.06em] text-muted-foreground'>
            {t('campaigns:overlay.step', { current: stepIndex + 1, total: questions.length })}
          </p>
        ) : null}
      </div>
      <fieldset className='space-y-2'>
        <Label>
          {currentQuestion.prompt}
          {currentQuestion.required ? ' *' : ''}
        </Label>
        <div className='grid gap-2'>
          {CLASS_LEVELS.map(level => (
            <button
              key={level}
              type='button'
              className={cn(
                'rounded-lg border px-4 py-2 text-left text-sm',
                selectedLevel === level ? 'border-primary bg-primary/10' : 'border-gray-200',
              )}
              onClick={() => {
                setError(null);
                setValues(current => ({ ...current, [currentQuestion.id]: level }));
              }}
            >
              {t(classLevelLabelKey(level) ?? level)}
            </button>
          ))}
        </div>
      </fieldset>
      {isLastStep ? <p className='text-sm text-gray-600'>{defaultHint}</p> : null}
      {error ? <p className='text-sm text-destructive'>{error}</p> : null}
      <div className='grid grid-cols-2 gap-2'>
        {onDismiss ? (
          <Button type='button' variant='outline' disabled={isSubmitting} onClick={onDismiss}>
            {t('common:close')}
          </Button>
        ) : (
          <span />
        )}
        <Button type='submit' disabled={isSubmitting}>
          {isSubmitting
            ? t('campaigns:overlay.submitting')
            : isLastStep
              ? t('common:save')
              : t('campaigns:overlay.continue')}
        </Button>
      </div>
    </form>
  );
}
