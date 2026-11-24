import { Controller, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { EditorField, EditorSelect, InfoTooltip, SwitchRow } from '../editor-field';
import { ADMIN_CARD } from '../event-admin-styles';

import { REGISTRATION_OPTION_EDITORS, REGISTRATION_OPTION_KINDS, type OptionSetting } from './registries';
import { type TypeEditorSectionProps } from './section-props';

import { Card, CardContent, CardHeader, CardTitle, Checkbox, Input, Label, Switch } from '@components/ui';

import type { RegistrationOption, RegistrationOptionKind } from '@core/api';

interface OptionSettingInputProps {
  index: number;
  setting: OptionSetting;
  option: RegistrationOption;
  onChange: (option: RegistrationOption) => void;
}

function OptionSettingInput({ index, setting, option, onChange }: OptionSettingInputProps) {
  const { t } = useTranslation();
  const id = `option-${option.kind}-${setting.key}-${index}`;

  if (setting.kind === 'switch') {
    return (
      <SwitchRow label={t(setting.labelKey)}>
        <Switch
          aria-label={t(setting.labelKey)}
          checked={option[setting.key] !== false}
          onCheckedChange={value => onChange({ ...option, [setting.key]: value })}
        />
      </SwitchRow>
    );
  }

  return (
    <EditorField label={t(setting.labelKey)} htmlFor={id} required={!setting.optional} optional={setting.optional}>
      <Input
        id={id}
        type='number'
        min={setting.min}
        max={setting.max}
        placeholder={setting.optional ? t('eventos:participation.optionSettings.noLimit') : undefined}
        value={(option[setting.key] as number | null | undefined) ?? ''}
        onChange={change =>
          onChange({ ...option, [setting.key]: change.target.value === '' ? null : Number(change.target.value) })
        }
      />
    </EditorField>
  );
}

/** General: name, "¿Quién se inscribe?" (one checkbox per registry entry), account and approval. */
export function GeneralSection({ form, type, isPrivate }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const { control, register, formState } = form;
  const options = useWatch({ control, name: 'registration_options' });
  const inUse = new Set(
    type.signup_count > 0 || type.people_count > 0 ? type.registration_options.map(item => item.kind) : [],
  );
  const optionsError = formState.errors.registration_options?.message;

  const toggle = (kind: RegistrationOptionKind, checked: boolean) => {
    const current = form.getValues('registration_options');
    const next = checked
      ? [...current, { kind, ...REGISTRATION_OPTION_EDITORS[kind].defaults }]
      : current.filter(item => item.kind !== kind);

    form.setValue('registration_options', next, { shouldDirty: true, shouldValidate: formState.isSubmitted });

    // Some options are only priced by packages (API invariant): keep the pricing model in line.
    if (checked && REGISTRATION_OPTION_EDITORS[kind].needsPackages) {
      form.setValue('pricing_model', 'package', { shouldDirty: true });
    }
  };

  const update = (option: RegistrationOption) =>
    form.setValue(
      'registration_options',
      form.getValues('registration_options').map(item => (item.kind === option.kind ? option : item)),
      { shouldDirty: true },
    );

  return (
    <Card className={ADMIN_CARD}>
      <CardHeader>
        <CardTitle>{t('eventos:participation.editor.general')}</CardTitle>
      </CardHeader>
      <CardContent className='grid gap-5'>
        {isPrivate ? (
          <p className='m-0 rounded-xl bg-secondary px-3.5 py-3 text-sm font-medium'>
            {t('eventos:participation.editor.privateNotice')}
          </p>
        ) : null}
        <div className='grid gap-5 md:grid-cols-2'>
          <EditorField
            label={t('eventos:participation.editor.name')}
            htmlFor='type-name'
            required
            tooltip={t('eventos:participation.editor.nameTooltip')}
            error={formState.errors.name?.message}
          >
            <Input
              id='type-name'
              maxLength={80}
              placeholder={t('eventos:participation.editor.namePlaceholder')}
              {...register('name')}
            />
          </EditorField>

          <fieldset className='m-0 grid min-w-0 gap-3 border-0 p-0'>
            <EditorField
              label={t('eventos:participation.editor.whoSignsUp')}
              required
              tooltip={t('eventos:participation.editor.whoSignsUpTooltip')}
              error={optionsError}
            >
              <div className='grid gap-3'>
                {REGISTRATION_OPTION_KINDS.map(kind => {
                  const editor = REGISTRATION_OPTION_EDITORS[kind];
                  const index = options.findIndex(item => item.kind === kind);
                  const option = index >= 0 ? options[index] : null;
                  const locked = inUse.has(kind);

                  return (
                    <div key={kind} className='grid gap-3'>
                      <div className='flex min-h-6 items-center gap-2'>
                        <Checkbox
                          id={`option-${kind}`}
                          checked={Boolean(option)}
                          disabled={locked && Boolean(option)}
                          onCheckedChange={value => toggle(kind, value === true)}
                        />
                        <Label htmlFor={`option-${kind}`} className='font-normal'>
                          {t(editor.labelKey)}
                        </Label>
                        <InfoTooltip content={t(editor.tooltipKey)} />
                      </div>
                      {locked ? (
                        <small className='-mt-2 pl-6 text-xs text-muted-foreground'>
                          {t('eventos:participation.editor.optionInUse')}
                        </small>
                      ) : null}
                      {option && (options.length > 1 || editor.settings.length > 0) ? (
                        <div className='grid gap-3 pl-6'>
                          {options.length > 1 ? (
                            <EditorField
                              label={t('eventos:participation.editor.optionLabel')}
                              htmlFor={`option-${kind}-label`}
                              optional
                            >
                              <Input
                                id={`option-${kind}-label`}
                                maxLength={40}
                                placeholder={t(editor.labelKey)}
                                value={option.label ?? ''}
                                onChange={change => update({ ...option, label: change.target.value })}
                              />
                            </EditorField>
                          ) : null}
                          {editor.settings.map(setting => (
                            <OptionSettingInput
                              key={setting.key}
                              index={index}
                              setting={setting}
                              option={option}
                              onChange={update}
                            />
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </EditorField>
            {options.length > 1 ? (
              <small className='text-xs text-muted-foreground'>
                {t('eventos:participation.editor.multipleOptionsHint')}
              </small>
            ) : null}
          </fieldset>
        </div>

        <div className='grid gap-5 md:grid-cols-2 md:items-end'>
          <EditorSelect
            control={control}
            name='account_mode'
            label={t('eventos:participation.editor.account')}
            required
            tooltip={t('eventos:participation.editor.accountTooltip')}
            options={[
              { value: 'full', label: t('eventos:participation.editor.accountFull') },
              { value: 'simple', label: t('eventos:participation.editor.accountSimple') },
            ]}
          />

          <Controller
            control={control}
            name='requires_approval'
            render={({ field }) => (
              <div className='md:grid md:min-h-11 md:content-center'>
                <SwitchRow
                  label={t('eventos:participation.editor.requiresApproval')}
                  tooltip={t('eventos:participation.editor.requiresApprovalTooltip')}
                >
                  <Switch
                    aria-label={t('eventos:participation.editor.requiresApproval')}
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </SwitchRow>
              </div>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
}
