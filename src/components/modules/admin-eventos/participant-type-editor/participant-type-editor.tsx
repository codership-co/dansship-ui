import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useMemo } from 'react';
import { useForm, type FieldPath } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { CapacitySection } from './capacity-section';
import { CardCopySection } from './card-copy-section';
import { ContributionSection } from './contribution-section';
import { EmailsSection } from './emails-section';
import { FormSection } from './form-section';
import { GeneralSection } from './general-section';
import { MinorsSection } from './minors-section';
import { createParticipantTypeSchema } from './schema';
import { type TypeEditorSectionProps } from './section-props';

import {
  editorErrorPath,
  participantTypeFormValues,
  participationErrorMessage,
  toParticipantTypeUpsert,
  type ParticipantTypeAdmin,
  type ParticipantTypeFormValues,
  type ParticipantTypeUpsert,
  type PriceConditionCatalogItem,
} from '@core/api';

type SaveResult = { ok: true; data: ParticipantTypeAdmin } | { ok: false; error: unknown };

export interface ParticipantTypeEditorProps {
  type: ParticipantTypeAdmin;
  conditions: Array<PriceConditionCatalogItem>;
  eventCapacity: number;
  isPrivate: boolean;
  /** A preset type not yet reviewed ("Guardar tipo") vs. an existing one ("Guardar cambios"). */
  isNew?: boolean;
  /** A draft's "Cancelar" removes it instead of resetting the form. */
  onDiscard?: () => void;
  /** Shown only while the type can be deleted (draft event, no signups); the parent confirms. */
  onDelete?: () => void;
  onSave: (payload: ParticipantTypeUpsert) => Promise<SaveResult>;
}

const SECTIONS = [
  GeneralSection,
  ContributionSection,
  FormSection,
  MinorsSection,
  CapacitySection,
  CardCopySection,
  EmailsSection,
];

/**
 * The form starts from `type` and never resets itself: the parent mounts a new editor (`key`) when the type
 * changes, because `reset()` inside an effect leaves the `Controller` switches stuck under the React Compiler.
 *
 * The one participant-type editor: every type (General, Artistas, Invitados, a package booking…)
 * is the same sections driven by its data. Save errors land on the field the API names.
 */
export function ParticipantTypeEditor({
  type,
  conditions,
  eventCapacity,
  isPrivate,
  isNew,
  onDiscard,
  onDelete,
  onSave,
}: ParticipantTypeEditorProps) {
  const { t } = useTranslation();
  const schema = useMemo(() => createParticipantTypeSchema(t), [t]);
  const form = useForm<ParticipantTypeFormValues>({
    defaultValues: participantTypeFormValues(type),
    resolver: zodResolver(schema),
  });
  const { reset, handleSubmit, setError, formState } = form;

  const submit = handleSubmit(
    async values => {
      const result = await onSave(toParticipantTypeUpsert(values, type.available_notices ?? []));

      if (result.ok) {
        toast.success(t('eventos:participation.editor.saved'));

        return;
      }

      const message = participationErrorMessage(result.error, t, 'eventos:participation.editor.saveFailed');
      const path = editorErrorPath(result.error);

      if (path) {
        setError(path as FieldPath<ParticipantTypeFormValues>, { type: 'server', message }, { shouldFocus: true });
      }

      toast.error(message);
    },
    () => toast.error(t('eventos:participation.editor.fixErrors')),
  );

  const sectionProps: TypeEditorSectionProps = { form, type, conditions, eventCapacity, isPrivate };

  return (
    <form className='grid min-w-0 gap-4' noValidate onSubmit={event => void submit(event)}>
      {SECTIONS.map((Section, index) => (
        // The sections are a fixed list: their position is their identity.

        <Section key={index} {...sectionProps} />
      ))}
      <div className='flex flex-wrap items-center justify-end gap-3'>
        {onDelete ? (
          <Button
            type='button'
            variant='text'
            color='alert'
            className='mr-auto'
            disabled={formState.isSubmitting}
            onClick={onDelete}
          >
            {t('eventos:participation.editor.deleteType')}
          </Button>
        ) : null}
        <Button
          type='button'
          variant='outlined'
          color='primary'
          disabled={formState.isSubmitting}
          onClick={() => (onDiscard ? onDiscard() : reset(participantTypeFormValues(type)))}
        >
          {t('eventos:participation.cancel')}
        </Button>
        <Button type='submit' variant='solid' color='primary' isLoading={formState.isSubmitting}>
          {isNew ? t('eventos:participation.editor.saveNew') : t('eventos:participation.editor.save')}
        </Button>
      </div>
    </form>
  );
}
