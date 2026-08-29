import { cn } from 'polpo/helpers';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { parseClassCsatDeliveryContext } from '../../../helpers/class-feedback';

import { Button, Label, Textarea } from '@components/ui';
import { type CampaignAnswerValue, type PendingCampaign } from '@core/api';

interface ClassCsatFieldsProps {
  className?: string;
  instructorName?: string | null;
  classEndTime?: string | null;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: { class_rating: number; instructor_rating: number; comment?: string }) => Promise<void>;
  onDismiss?: () => void;
}

function StarRating({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: number | null;
  onChange: (next: number) => void;
  disabled?: boolean;
}) {
  const { t } = useTranslation();

  return (
    <div className='flex gap-1' role='radiogroup' aria-labelledby={id}>
      {[1, 2, 3, 4, 5].map(star => {
        const selected = value !== null && star <= value;

        return (
          <button
            key={star}
            type='button'
            role='radio'
            aria-checked={value === star}
            disabled={disabled}
            className={cn(
              'h-10 w-10 rounded-full text-xl transition-colors',
              selected ? 'text-primary' : 'text-gray-300 hover:text-primary/70',
            )}
            onClick={() => onChange(star)}
            aria-label={t('campaigns:classCsat.starLabel', { count: star })}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}

export function ClassCsatFields({
  className,
  instructorName,
  classEndTime,
  isSubmitting,
  submitLabel,
  onSubmit,
  onDismiss,
}: ClassCsatFieldsProps) {
  const { t, i18n } = useTranslation();
  const [classRating, setClassRating] = useState<number | null>(null);
  const [instructorRating, setInstructorRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const formattedEnd = classEndTime
    ? new Date(classEndTime).toLocaleString(i18n.language, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  const handleSubmit = async () => {
    if (classRating === null || instructorRating === null) {
      setError(t('campaigns:classCsat.ratingsRequired'));

      return;
    }

    setError(null);
    await onSubmit({
      class_rating: classRating,
      instructor_rating: instructorRating,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <div className={cn('grid gap-6', className)}>
      {formattedEnd ? <p className='text-sm text-gray-500'>{formattedEnd}</p> : null}

      <div className='space-y-2'>
        <Label id='class-csat-class-rating'>{t('campaigns:classCsat.classRating')}</Label>
        <StarRating
          id='class-csat-class-rating'
          value={classRating}
          onChange={setClassRating}
          disabled={isSubmitting}
        />
      </div>

      <div className='space-y-2'>
        <Label id='class-csat-instructor-rating'>
          {instructorName
            ? t('campaigns:classCsat.instructorRatingNamed', { name: instructorName })
            : t('campaigns:classCsat.instructorRating')}
        </Label>
        <StarRating
          id='class-csat-instructor-rating'
          value={instructorRating}
          onChange={setInstructorRating}
          disabled={isSubmitting}
        />
      </div>

      <div className='space-y-2'>
        <Label htmlFor='class-csat-comment'>{t('campaigns:classCsat.comment')}</Label>
        <Textarea
          id='class-csat-comment'
          value={comment}
          disabled={isSubmitting}
          onChange={event => setComment(event.target.value)}
          placeholder={t('campaigns:classCsat.commentPlaceholder')}
        />
      </div>

      {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

      <div className='flex flex-col gap-2'>
        <Button type='button' disabled={isSubmitting} onClick={() => void handleSubmit()}>
          {isSubmitting ? t('campaigns:overlay.submitting') : (submitLabel ?? t('campaigns:overlay.submit'))}
        </Button>
        {onDismiss ? (
          <Button type='button' variant='outline' disabled={isSubmitting} onClick={onDismiss}>
            {t('campaigns:overlay.skip')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

interface ClassCsatFormProps {
  campaign: PendingCampaign;
  isSubmitting?: boolean;
  onSubmit: (answers: Record<string, CampaignAnswerValue>) => Promise<void>;
  onDismiss?: () => void;
}

export function ClassCsatForm({ campaign, isSubmitting, onSubmit, onDismiss }: ClassCsatFormProps) {
  const { t } = useTranslation();
  const context = parseClassCsatDeliveryContext(campaign.delivery_context);

  if (!context) {
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
    <div className='grid gap-4 p-6'>
      <div>
        <h2 className='text-xl font-semibold text-gray-900'>{campaign.title}</h2>
        <p className='text-sm text-gray-600 mt-1'>{context.class_name || t('campaigns:classCsat.classFallback')}</p>
      </div>
      <ClassCsatFields
        instructorName={context.instructor_name}
        classEndTime={context.class_end_time}
        isSubmitting={isSubmitting}
        onDismiss={onDismiss}
        onSubmit={async values => {
          await onSubmit({
            scheduled_class_id: context.scheduled_class_id,
            class_rating: values.class_rating,
            instructor_rating: values.instructor_rating,
            ...(values.comment ? { comment: values.comment } : {}),
          });
        }}
      />
    </div>
  );
}
