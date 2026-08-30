import { format } from 'date-fns';
import { cn } from 'polpo/helpers';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { parseClassCsatDeliveryContext } from '../../../helpers/class-feedback';

import { Button, Label, Textarea } from '@components/ui';
import { type CampaignAnswerValue, type PendingCampaign } from '@core/api';

interface ClassCsatFieldsProps {
  className?: string;
  instructorName?: string | null;
  isSubmitting?: boolean;
  submitLabel?: string;
  onSubmit: (values: { class_rating: number; instructor_rating: number; comment?: string }) => Promise<void>;
  onDismiss?: () => void;
}

function formatClassHour(value?: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return format(parsed, 'HH:mm');
}

export function formatClassCsatHeadline(sessionName: string, classTime?: string | null) {
  const hour = formatClassHour(classTime);

  return hour ? `${sessionName} - ${hour}` : sessionName;
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
  const [hovered, setHovered] = useState<number | null>(null);
  const preview = hovered ?? value;

  return (
    <div>
      <div className='flex gap-1' role='radiogroup' aria-labelledby={id} onPointerLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map(star => {
          const selected = preview !== null && star <= preview;

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
              onPointerEnter={() => setHovered(star)}
              aria-label={t(`campaigns:classCsat.starScale.${star}`)}
            >
              ★
            </button>
          );
        })}
      </div>
      <p className={cn('mt-1 h-5 text-sm font-medium text-primary', !preview && 'invisible')}>
        {preview ? t(`campaigns:classCsat.starScale.${preview}`) : '\u00a0'}
      </p>
    </div>
  );
}

export function ClassCsatFields({
  className,
  instructorName,
  isSubmitting,
  submitLabel,
  onSubmit,
  onDismiss,
}: ClassCsatFieldsProps) {
  const { t } = useTranslation();
  const [classRating, setClassRating] = useState<number | null>(null);
  const [instructorRating, setInstructorRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);

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
    <div className={cn('grid gap-3', className)}>
      <div className='space-y-1'>
        <Label id='class-csat-class-rating'>{t('campaigns:classCsat.classRating')}</Label>
        <StarRating
          id='class-csat-class-rating'
          value={classRating}
          onChange={setClassRating}
          disabled={isSubmitting}
        />
      </div>

      <div className='space-y-1'>
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

      <div className='space-y-1'>
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
    <div className='grid gap-3 p-6'>
      <h2 className='text-xl font-semibold text-gray-900'>
        {t('campaigns:classCsat.title', {
          headline: formatClassCsatHeadline(
            context.class_name?.trim() || t('campaigns:classCsat.classFallback'),
            context.class_start_time ?? context.class_end_time,
          ),
        })}
      </h2>
      <ClassCsatFields
        instructorName={context.instructor_name}
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
