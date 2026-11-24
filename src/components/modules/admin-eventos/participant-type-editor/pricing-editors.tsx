import { Button } from 'polpo/components';
import { type ComponentType } from 'react';
import { Controller, useFieldArray, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuPlus, LuX } from 'react-icons/lu';

import { EditorField } from '../editor-field';

import { type TypeEditorSectionProps } from './section-props';

import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';

import type { ParticipantTypeFormValues, PriceConditionCatalogItem, PricingModelKind } from '@core/api';

/** Radix Select needs a non-empty value: "Todos" is stored as `null`. */
const EVERYONE = 'everyone';

type ConditionPath = `fees.${number}.condition_type` | `condition_discounts.${number}.condition_type`;

interface ConditionSelectProps {
  control: Control<ParticipantTypeFormValues>;
  name: ConditionPath;
  label: string;
  conditions: Array<PriceConditionCatalogItem>;
  /** Discounts always need a condition; fees may be for everyone. */
  allowEveryone: boolean;
}

function ConditionSelect({ control, name, label, conditions, allowEveryone }: ConditionSelectProps) {
  const { t } = useTranslation();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <EditorField label={label} required htmlFor={name}>
          <Select
            value={field.value ?? (allowEveryone ? EVERYONE : '')}
            onValueChange={value => field.onChange(value === EVERYONE ? null : value)}
          >
            <SelectTrigger id={name} aria-label={label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {allowEveryone ? (
                <SelectItem value={EVERYONE}>{t('eventos:participation.editor.feeEveryone')}</SelectItem>
              ) : null}
              {conditions.map(condition => (
                <SelectItem key={condition.condition_type} value={condition.condition_type}>
                  {condition.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </EditorField>
      )}
    />
  );
}

/** "Tarifas": the lowest applicable fee wins; the person never sees why. */
export function FeesEditor({ form, conditions }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const { control, register, formState } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'fees', keyName: 'rowKey' });

  return (
    <EditorField
      label={t('eventos:participation.editor.fees')}
      required
      tooltip={t('eventos:participation.editor.feesTooltip')}
      error={formState.errors.fees?.message ?? formState.errors.fees?.root?.message}
    >
      <div className='grid gap-3'>
        {fields.map((fee, index) => (
          <div
            key={fee.rowKey}
            className='grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_1fr_9rem_auto] md:items-end md:border-0 md:p-0'
          >
            <EditorField label={t('eventos:participation.editor.feeName')} required htmlFor={`fee-${index}-label`}>
              <Input id={`fee-${index}-label`} maxLength={80} {...register(`fees.${index}.label`)} />
            </EditorField>
            <ConditionSelect
              control={control}
              name={`fees.${index}.condition_type`}
              label={t('eventos:participation.editor.feeWho')}
              conditions={conditions}
              allowEveryone
            />
            <EditorField label={t('eventos:participation.editor.feePrice')} required htmlFor={`fee-${index}-price`}>
              <Input id={`fee-${index}-price`} type='number' min={0} {...register(`fees.${index}.price`)} />
            </EditorField>
            <Button
              type='button'
              variant='flat'
              color='secondary'
              aria-label={t('eventos:participation.editor.removeFee')}
              onClick={() => remove(index)}
            >
              <LuX className='size-4' aria-hidden />
            </Button>
          </div>
        ))}
        <div>
          <Button
            type='button'
            variant='outlined'
            color='primary'
            size='small'
            onClick={() => append({ label: '', condition_type: null, condition_params: {}, price: 0 })}
          >
            <LuPlus className='size-4' aria-hidden />
            {t('eventos:participation.editor.addFee')}
          </Button>
        </div>
      </div>
    </EditorField>
  );
}

/** "Paquetes" and their condition discounts (package pricing). */
export function PackagesEditor({ form, conditions }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const { control, register, formState } = form;
  const packages = useFieldArray({ control, name: 'packages', keyName: 'rowKey' });
  const discounts = useFieldArray({ control, name: 'condition_discounts', keyName: 'rowKey' });

  return (
    <div className='grid gap-5'>
      <EditorField
        label={t('eventos:participation.editor.packages')}
        required
        tooltip={t('eventos:participation.editor.packagesTooltip')}
        error={formState.errors.packages?.message ?? formState.errors.packages?.root?.message}
      >
        <div className='grid gap-3'>
          {packages.fields.map((item, index) => (
            <div
              key={item.rowKey}
              className='grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_9rem_8rem_9rem_auto] md:items-end md:border-0 md:p-0'
            >
              <EditorField
                label={t('eventos:participation.editor.packageName')}
                required
                htmlFor={`package-${index}-name`}
              >
                <Input id={`package-${index}-name`} maxLength={80} {...register(`packages.${index}.name`)} />
              </EditorField>
              <EditorField
                label={t('eventos:participation.editor.packageBase')}
                required
                htmlFor={`package-${index}-base`}
              >
                <Input
                  id={`package-${index}-base`}
                  type='number'
                  min={0}
                  {...register(`packages.${index}.base_price`)}
                />
              </EditorField>
              <EditorField
                label={t('eventos:participation.editor.packageIncluded')}
                required
                htmlFor={`package-${index}-included`}
              >
                <Input
                  id={`package-${index}-included`}
                  type='number'
                  min={1}
                  max={200}
                  {...register(`packages.${index}.included_people`, { valueAsNumber: true })}
                />
              </EditorField>
              <EditorField
                label={t('eventos:participation.editor.packageExtra')}
                required
                htmlFor={`package-${index}-extra`}
              >
                <Input
                  id={`package-${index}-extra`}
                  type='number'
                  min={0}
                  {...register(`packages.${index}.additional_person_price`)}
                />
              </EditorField>
              <Button
                type='button'
                variant='flat'
                color='secondary'
                aria-label={t('eventos:participation.editor.removePackage')}
                onClick={() => packages.remove(index)}
              >
                <LuX className='size-4' aria-hidden />
              </Button>
            </div>
          ))}
          <div>
            <Button
              type='button'
              variant='outlined'
              color='primary'
              size='small'
              onClick={() =>
                packages.append({ name: '', base_price: 0, included_people: 1, additional_person_price: 0 })
              }
            >
              <LuPlus className='size-4' aria-hidden />
              {t('eventos:participation.editor.addPackage')}
            </Button>
          </div>
        </div>
      </EditorField>

      <EditorField
        label={t('eventos:participation.editor.discounts')}
        optional
        tooltip={t('eventos:participation.editor.discountsTooltip')}
      >
        <div className='grid gap-3'>
          {discounts.fields.map((item, index) => (
            <div
              key={item.rowKey}
              className='grid gap-3 rounded-md border border-border p-3 md:grid-cols-[1fr_1fr_8rem_auto] md:items-end md:border-0 md:p-0'
            >
              <EditorField
                label={t('eventos:participation.editor.discountLabel')}
                required
                htmlFor={`discount-${index}-label`}
              >
                <Input
                  id={`discount-${index}-label`}
                  maxLength={80}
                  {...register(`condition_discounts.${index}.label`)}
                />
              </EditorField>
              <ConditionSelect
                control={control}
                name={`condition_discounts.${index}.condition_type`}
                label={t('eventos:participation.editor.discountWho')}
                conditions={conditions}
                allowEveryone={false}
              />
              <EditorField
                label={t('eventos:participation.editor.discountPercent')}
                required
                htmlFor={`discount-${index}-percent`}
              >
                <Input
                  id={`discount-${index}-percent`}
                  type='number'
                  min={1}
                  max={99}
                  {...register(`condition_discounts.${index}.percent`)}
                />
              </EditorField>
              <Button
                type='button'
                variant='flat'
                color='secondary'
                aria-label={t('eventos:participation.editor.removeDiscount')}
                onClick={() => discounts.remove(index)}
              >
                <LuX className='size-4' aria-hidden />
              </Button>
            </div>
          ))}
          <div>
            <Button
              type='button'
              variant='outlined'
              color='primary'
              size='small'
              disabled={conditions.length === 0}
              onClick={() =>
                discounts.append({
                  label: '',
                  condition_type: conditions[0]?.condition_type ?? '',
                  condition_params: {},
                  percent: 5,
                })
              }
            >
              <LuPlus className='size-4' aria-hidden />
              {t('eventos:participation.editor.addDiscount')}
            </Button>
          </div>
        </div>
      </EditorField>
    </div>
  );
}

/** Pricing model → its editor. A new backend pricing model is one entry here plus one in `PRICING_MODEL_EDITORS`. */
export const PRICING_MODEL_COMPONENTS: Record<PricingModelKind, ComponentType<TypeEditorSectionProps>> = {
  per_person: FeesEditor,
  package: PackagesEditor,
};
