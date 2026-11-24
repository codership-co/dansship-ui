import { useTranslation } from 'react-i18next';

import { EditorField, InfoTooltip } from '../editor-field';
import { ADMIN_CARD } from '../event-admin-styles';

import { CARD_COPY_LIMITS } from './schema';
import { type TypeEditorSectionProps } from './section-props';

import { Card, CardContent, CardHeader, CardTitle, Input } from '@components/ui';

/** Cómo se ve: the card copy on the event page. Empty fields use the default copy. */
export function CardCopySection({ form }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const { register, formState } = form;
  const errors = formState.errors.card_copy;

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader>
        <CardTitle className='flex items-center gap-1.5'>
          {t('eventos:participation.editor.cardCopy')}
          <InfoTooltip content={t('eventos:participation.editor.defaultCopyHint')} />
        </CardTitle>
      </CardHeader>
      <CardContent className='grid gap-5 md:grid-cols-2 md:items-start'>
        <EditorField
          label={t('eventos:participation.editor.buttonText')}
          optional
          htmlFor='card-button'
          error={errors?.button_text?.message}
        >
          <Input
            id='card-button'
            maxLength={CARD_COPY_LIMITS.button_text}
            placeholder={t('eventos:participation.card.defaultCta')}
            {...register('card_copy.button_text')}
          />
        </EditorField>
        <EditorField
          label={t('eventos:participation.editor.closingMessage')}
          optional
          htmlFor='card-closing'
          tooltip={t('eventos:participation.editor.closingMessageTooltip')}
          error={errors?.closing_message?.message}
        >
          <Input
            id='card-closing'
            maxLength={CARD_COPY_LIMITS.closing_message}
            placeholder={t('eventos:participation.card.defaultClosed')}
            {...register('card_copy.closing_message')}
          />
        </EditorField>
        <EditorField
          label={t('eventos:participation.editor.cardTitle')}
          optional
          htmlFor='card-title'
          tooltip={t('eventos:participation.editor.cardTitleTooltip')}
          error={errors?.title?.message}
        >
          <Input id='card-title' maxLength={CARD_COPY_LIMITS.title} {...register('card_copy.title')} />
        </EditorField>
        <EditorField
          label={t('eventos:participation.editor.cardText')}
          optional
          htmlFor='card-text'
          error={errors?.text?.message}
        >
          <Input id='card-text' maxLength={CARD_COPY_LIMITS.text} {...register('card_copy.text')} />
        </EditorField>
      </CardContent>
    </Card>
  );
}
