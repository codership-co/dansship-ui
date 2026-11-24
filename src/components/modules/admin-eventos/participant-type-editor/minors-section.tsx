import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EditorField, SwitchRow } from '../editor-field';
import { ADMIN_CARD } from '../event-admin-styles';

import { type TypeEditorSectionProps } from './section-props';

import { Card, CardContent, CardHeader, CardTitle, Input, Switch } from '@components/ui';
import { chargesMoney } from '@core/api';

/**
 * Menores: age, max per adult, price (money types), counts toward capacity.
 * "Solo menores" is not offered: the API has no setting for it (gap G1).
 */
export function MinorsSection({ form }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const { control, register, formState } = form;
  const [allowed, model] = useWatch({ control, name: ['minors_allowed', 'contribution_model'] });

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader>
        <CardTitle>{t('eventos:participation.editor.minors')}</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-5'>
        <Controller
          control={control}
          name='minors_allowed'
          render={({ field }) => (
            <SwitchRow
              label={t('eventos:participation.editor.minorsAllowed')}
              tooltip={t('eventos:participation.editor.minorsAllowedTooltip')}
            >
              <Switch
                aria-label={t('eventos:participation.editor.minorsAllowed')}
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </SwitchRow>
          )}
        />
        {allowed ? (
          <>
            <div className='grid gap-5 md:grid-cols-3'>
              <EditorField
                label={t('eventos:participation.editor.minorMaxAge')}
                required
                htmlFor='minor-max-age'
                error={formState.errors.minor_max_age?.message}
              >
                <Input id='minor-max-age' type='number' min={1} max={25} {...register('minor_max_age')} />
              </EditorField>
              <EditorField label={t('eventos:participation.editor.minorsPerAdult')} optional htmlFor='minor-per-adult'>
                <Input
                  id='minor-per-adult'
                  type='number'
                  min={1}
                  max={20}
                  placeholder={t('eventos:participation.editor.minorsPerAdultPlaceholder')}
                  {...register('minors_per_adult_max')}
                />
              </EditorField>
              {chargesMoney(model) ? (
                <EditorField
                  label={t('eventos:participation.editor.minorPrice')}
                  required
                  htmlFor='minor-price'
                  tooltip={t('eventos:participation.editor.minorPriceTooltip')}
                  error={formState.errors.minor_price?.message}
                >
                  <Input id='minor-price' type='number' min={0} {...register('minor_price')} />
                </EditorField>
              ) : null}
            </div>
            <Controller
              control={control}
              name='minors_count_toward_capacity'
              render={({ field }) => (
                <SwitchRow label={t('eventos:participation.editor.minorsCount')}>
                  <Switch
                    aria-label={t('eventos:participation.editor.minorsCount')}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </SwitchRow>
              )}
            />
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
