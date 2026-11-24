import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EditorField, SwitchRow } from '../editor-field';
import { ADMIN_CARD } from '../event-admin-styles';

import { REGISTRATION_OPTION_EDITORS } from './registries';
import { type TypeEditorSectionProps } from './section-props';

import { Card, CardContent, CardHeader, CardTitle, Input, Switch } from '@components/ui';

type SwitchName = 'counts_toward_capacity' | 'issues_entry_qr' | 'is_active';

/** Cupos, fechas y entrada: capacity, the type's own quota, close date (Bogotá), entry QR and active. */
export function CapacitySection({ form, eventCapacity }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const { control, register, formState } = form;
  const options = useWatch({ control, name: 'registration_options' });
  const sells = options.some(option => REGISTRATION_OPTION_EDITORS[option.kind].asksTicketPeople);
  const closeLabel = sells
    ? t('eventos:participation.editor.salesClose')
    : t('eventos:participation.editor.registrationClose');

  const switchRow = (name: SwitchName, label: string, tooltip: string) => (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SwitchRow label={label} tooltip={tooltip}>
          <Switch aria-label={label} checked={field.value} onCheckedChange={field.onChange} />
        </SwitchRow>
      )}
    />
  );

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader>
        <CardTitle>{t('eventos:participation.editor.capacityDates')}</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-5'>
        {switchRow(
          'counts_toward_capacity',
          t('eventos:participation.editor.countsTowardCapacity'),
          t('eventos:participation.editor.countsTowardCapacityTooltip', { capacity: eventCapacity }),
        )}
        <div className='grid gap-5 md:grid-cols-2'>
          <EditorField
            label={t('eventos:participation.editor.quota')}
            optional
            htmlFor='type-quota'
            tooltip={t('eventos:participation.editor.quotaTooltip')}
            error={formState.errors.quota?.message}
          >
            <Input
              id='type-quota'
              type='number'
              min={1}
              placeholder={t('eventos:participation.optionSettings.noLimit')}
              {...register('quota')}
            />
          </EditorField>
          <EditorField
            label={closeLabel}
            optional
            htmlFor='type-closes-at'
            tooltip={t('eventos:participation.editor.closeTooltip')}
            error={formState.errors.closes_at_local?.message}
          >
            <Input id='type-closes-at' type='datetime-local' {...register('closes_at_local')} />
          </EditorField>
        </div>
        {switchRow(
          'issues_entry_qr',
          t('eventos:participation.editor.entryQr'),
          t('eventos:participation.editor.entryQrTooltip'),
        )}
        {switchRow(
          'is_active',
          t('eventos:participation.editor.active'),
          t('eventos:participation.editor.activeTooltip'),
        )}
      </CardContent>
    </Card>
  );
}
