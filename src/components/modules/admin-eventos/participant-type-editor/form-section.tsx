import { useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { InfoTooltip } from '../editor-field';
import { ADMIN_CARD } from '../event-admin-styles';

import { REGISTRATION_OPTION_EDITORS } from './registries';
import { type TypeEditorSectionProps } from './section-props';

import { FormBuilder, FormBuilderRow } from '@components/modules/dynamic-form';
import { Badge, Card, CardContent, CardHeader, CardTitle } from '@components/ui';

import type { ParticipantField } from '@core/api';

/** The team edits the copy and picks the Inscritos columns of an event form. */
const EVENT_FORM_FEATURES = { listColumn: true, adminCopy: true };

/** Formulario: the type's questions grouped in sections (the shared `FormBuilder`); ticket options add fixed rows. */
export function FormSection({ form }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const [fields, options] = useWatch({ control: form.control, name: ['fields', 'registration_options'] });
  const asksTickets = options.some(option => REGISTRATION_OPTION_EDITORS[option.kind].asksTicketPeople);
  const always = (
    <Badge variant='outline' size='small' className='text-muted-foreground'>
      {t('eventos:participation.editor.always')}
    </Badge>
  );

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader className='flex flex-row items-center gap-1'>
        <CardTitle>{t('eventos:participation.editor.form')}</CardTitle>
        <InfoTooltip content={t('forms:builder.sectionsHint')} />
      </CardHeader>
      <CardContent>
        <FormBuilder<ParticipantField>
          items={fields}
          features={EVENT_FORM_FEATURES}
          onChange={next => form.setValue('fields', next, { shouldDirty: true })}
          leading={
            // Name and email are always asked: from each ticket, or from the person who signs up.
            <>
              <FormBuilderRow
                label={t(
                  asksTickets ? 'eventos:participation.editor.ticketName' : 'eventos:participation.editor.fixedName',
                )}
                hint={t('forms:kinds.short_text')}
              >
                {always}
              </FormBuilderRow>
              <FormBuilderRow
                label={t(
                  asksTickets ? 'eventos:participation.editor.ticketEmail' : 'eventos:participation.editor.fixedEmail',
                )}
                hint={
                  asksTickets
                    ? t('eventos:participation.editor.ticketEmailHint')
                    : t('eventos:participation.editor.fixedEmailKind')
                }
              >
                {always}
              </FormBuilderRow>
            </>
          }
        />
      </CardContent>
    </Card>
  );
}
