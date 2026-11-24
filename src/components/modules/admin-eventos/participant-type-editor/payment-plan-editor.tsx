import { Button } from 'polpo/components';
import { useState } from 'react';
import { Controller, useFieldArray, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuPlus, LuX } from 'react-icons/lu';

import { EditorField, EditorSelect } from '../editor-field';

import { DUE_ANCHOR_EDITORS, DUE_ANCHOR_KINDS, PAY_LATER_ANCHORS, PRICING_MODEL_EDITORS } from './registries';
import { type TypeEditorSectionProps } from './section-props';

import { Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';

import type { DueAnchorKind } from '@core/api';

/** "Forma de pago": single payment or installments (by percent, or by amount per fee), with reminders. */
export function PaymentPlanEditor({ form }: TypeEditorSectionProps) {
  const { t } = useTranslation();
  const { control, formState } = form;
  const [mode, unit, pricingModel, fees, reminders] = useWatch({
    control,
    name: ['payment_mode', 'plan_unit', 'pricing_model', 'fees', 'installment_reminder_days'],
  });
  const lines = useFieldArray({ control, name: 'payment_plan', keyName: 'rowKey' });
  const [reminderDraft, setReminderDraft] = useState('');
  const allowsAmounts = PRICING_MODEL_EDITORS[pricingModel].allowsAmountPlan;
  const byAmount = allowsAmounts && unit === 'amount';
  const savedFees = fees.filter(fee => fee.id);

  const addReminder = () => {
    const days = Number(reminderDraft);

    if (reminderDraft === '' || !Number.isInteger(days) || days < 0 || reminders.includes(days)) return;

    form.setValue(
      'installment_reminder_days',
      [...reminders, days].sort((a, b) => b - a),
      { shouldDirty: true },
    );
    setReminderDraft('');
  };

  return (
    <div className='grid gap-5'>
      <EditorSelect
        control={control}
        name='payment_mode'
        label={t('eventos:participation.editor.paymentMode')}
        required
        tooltip={t('eventos:participation.editor.paymentModeTooltip')}
        options={(['single', 'installments'] as const).map(value => ({
          value,
          label: t(`eventos:participation.paymentModes.${value}`),
        }))}
      />

      {mode === 'installments' ? (
        <>
          {allowsAmounts ? (
            <EditorSelect
              control={control}
              name='plan_unit'
              label={t('eventos:participation.editor.planUnit')}
              required
              options={(['amount', 'percent'] as const).map(value => ({
                value,
                label: t(`eventos:participation.planUnits.${value}`),
              }))}
            />
          ) : (
            <small className='text-xs text-muted-foreground'>
              {t('eventos:participation.editor.planUnitPackageHint')}
            </small>
          )}

          <EditorField
            label={t('eventos:participation.editor.installments')}
            required
            error={formState.errors.payment_plan?.message ?? formState.errors.payment_plan?.root?.message}
          >
            <div className='grid gap-3'>
              {byAmount && savedFees.length < fees.length ? (
                <small className='text-xs text-muted-foreground'>
                  {t('eventos:participation.editor.saveFeesFirst')}
                </small>
              ) : null}
              {lines.fields.map((line, index) => (
                <InstallmentRow
                  key={line.rowKey}
                  form={form}
                  index={index}
                  byAmount={byAmount}
                  onRemove={() => lines.remove(index)}
                />
              ))}
              <div>
                <Button
                  type='button'
                  variant='outlined'
                  color='primary'
                  size='small'
                  onClick={() => lines.append({ percent: null, amounts: {}, due: { anchor: 'at_signup' } })}
                >
                  <LuPlus className='size-4' aria-hidden />
                  {t('eventos:participation.editor.addInstallment')}
                </Button>
              </div>
            </div>
          </EditorField>

          <EditorField
            label={t('eventos:participation.editor.reminders')}
            optional
            htmlFor='reminder-days'
            tooltip={t('eventos:participation.editor.remindersTooltip')}
          >
            <div className='flex flex-wrap gap-2'>
              {reminders.map(days => (
                <Badge key={days} variant='outline' className='gap-1'>
                  {t('eventos:participation.editor.reminderDays', { days })}
                  <button
                    type='button'
                    className='grid size-5 place-items-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary'
                    aria-label={t('eventos:participation.editor.removeReminder', { days })}
                    onClick={() =>
                      form.setValue(
                        'installment_reminder_days',
                        reminders.filter(item => item !== days),
                        { shouldDirty: true },
                      )
                    }
                  >
                    <LuX className='size-3' aria-hidden />
                  </button>
                </Badge>
              ))}
            </div>
            <div className='flex gap-2'>
              <Input
                id='reminder-days'
                type='number'
                min={0}
                max={60}
                placeholder={t('eventos:participation.editor.reminderPlaceholder')}
                value={reminderDraft}
                onChange={change => setReminderDraft(change.target.value)}
                onKeyDown={keyEvent => {
                  if (keyEvent.key === 'Enter') {
                    keyEvent.preventDefault();
                    addReminder();
                  }
                }}
              />
              <Button type='button' variant='outlined' color='primary' onClick={addReminder}>
                {t('eventos:participation.editor.addReminder')}
              </Button>
            </div>
          </EditorField>
        </>
      ) : null}

      <PayLaterDeadlineField form={form} />
    </div>
  );
}

interface InstallmentRowProps {
  form: TypeEditorSectionProps['form'];
  index: number;
  byAmount: boolean;
  onRemove: () => void;
}

function InstallmentRow({ form, index, byAmount, onRemove }: InstallmentRowProps) {
  const { t } = useTranslation();
  const { control, register } = form;
  const [anchor, fees] = useWatch({ control, name: [`payment_plan.${index}.due.anchor`, 'fees'] });
  const param = DUE_ANCHOR_EDITORS[anchor as DueAnchorKind]?.param;
  const dueLabel = t('eventos:participation.editor.due');

  return (
    <div className='grid gap-3 rounded-md border border-border p-3'>
      <div className='flex items-center justify-between gap-2'>
        <p className='m-0 text-sm font-semibold'>{t('eventos:participation.editor.installmentN', { n: index + 1 })}</p>
        <Button
          type='button'
          variant='flat'
          color='secondary'
          size='small'
          aria-label={t('eventos:participation.editor.removeInstallment')}
          onClick={onRemove}
        >
          <LuX className='size-4' aria-hidden />
        </Button>
      </div>
      <div className='grid gap-3 md:grid-cols-2'>
        <Controller
          control={control}
          name={`payment_plan.${index}.due.anchor`}
          render={({ field }) => (
            <EditorField label={dueLabel} required htmlFor={`line-${index}-anchor`}>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id={`line-${index}-anchor`} aria-label={`${dueLabel} ${index + 1}`}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DUE_ANCHOR_KINDS.map(kind => (
                    <SelectItem key={kind} value={kind}>
                      {t(DUE_ANCHOR_EDITORS[kind].labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </EditorField>
          )}
        />
        {param === 'date' ? (
          <EditorField label={t('eventos:participation.editor.dueDate')} required htmlFor={`line-${index}-date`}>
            <Input id={`line-${index}-date`} type='date' {...register(`payment_plan.${index}.due.date`)} />
          </EditorField>
        ) : null}
        {param === 'days' ? (
          <EditorField label={t('eventos:participation.editor.daysBefore')} required htmlFor={`line-${index}-days`}>
            <Input
              id={`line-${index}-days`}
              type='number'
              min={0}
              max={365}
              {...register(`payment_plan.${index}.due.days`, { valueAsNumber: true })}
            />
          </EditorField>
        ) : null}
      </div>
      {byAmount ? (
        <div className='grid gap-3 md:grid-cols-2'>
          {fees
            .filter(fee => fee.id)
            .map(fee => (
              <EditorField
                key={fee.id}
                label={t('eventos:participation.editor.amountFor', { fee: fee.label })}
                required
                htmlFor={`line-${index}-fee-${fee.id}`}
              >
                <Input
                  id={`line-${index}-fee-${fee.id}`}
                  type='number'
                  min={0}
                  {...register(`payment_plan.${index}.amounts.${fee.id as string}`)}
                />
              </EditorField>
            ))}
        </div>
      ) : (
        <EditorField label={t('eventos:participation.editor.percent')} required htmlFor={`line-${index}-percent`}>
          <Input
            id={`line-${index}-percent`}
            type='number'
            min={1}
            max={100}
            {...register(`payment_plan.${index}.percent`)}
          />
        </EditorField>
      )}
    </div>
  );
}

/** "Plazo para «paga después»": how long an admin enrollment holds the place unpaid. */
function PayLaterDeadlineField({ form }: Pick<TypeEditorSectionProps, 'form'>) {
  const { t } = useTranslation();
  const { control, register, formState } = form;
  const anchor = useWatch({ control, name: 'pay_later_anchor' });

  return (
    <div className='grid gap-3 md:grid-cols-[1fr_8rem] md:items-end'>
      <EditorSelect
        control={control}
        name='pay_later_anchor'
        label={t('eventos:participation.editor.payLater')}
        optional
        tooltip={t('eventos:participation.editor.payLaterTooltip')}
        options={PAY_LATER_ANCHORS.map(value => ({
          value,
          label: t(`eventos:participation.payLaterAnchors.${value}`),
        }))}
      />
      {anchor !== 'none' ? (
        <EditorField
          label={t('eventos:participation.editor.payLaterDays')}
          required
          htmlFor='pay-later-days'
          error={formState.errors.pay_later_days?.message}
        >
          <Input id='pay-later-days' type='number' min={0} max={365} {...register('pay_later_days')} />
        </EditorField>
      ) : null}
    </div>
  );
}
