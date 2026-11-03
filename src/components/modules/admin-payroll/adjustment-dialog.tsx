import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { z } from 'zod';

import { buildMonthKeys, formatMonthLabel, parseMonthKey, toMonthKey } from './adjustment-months';

import { DateField, SelectField, TextareaField, TextField } from '@components/form-fields';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@components/ui';
import { DansshipAPI, type PayrollAdjustment, type PayrollAdjustmentType } from '@core/api';
import { toColombiaDateKey } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

import type { TFunction } from 'i18next';

type PersonOption = { id: string; full_name: string; email: string };

interface FormValues {
  month: string;
  concept: string;
  amount: string;
  event_id: string;
  payment_date: Date | undefined;
  note: string;
}

const NO_EVENT = 'none';

const createSchema = (t: TFunction, kind: PayrollAdjustmentType) =>
  z
    .object({
      month: z.string(),
      concept: z.string(),
      amount: z.string(),
      event_id: z.string(),
      payment_date: z.date().optional(),
      note: z.string(),
    })
    .superRefine((values, ctx) => {
      const amount = Number(values.amount);

      if (!Number.isInteger(amount) || amount <= 0) {
        ctx.addIssue({ code: 'custom', path: ['amount'], message: t('admin:payroll.adjustments.validation.amount') });
      }

      if (kind === 'extra' && !values.month) {
        ctx.addIssue({ code: 'custom', path: ['month'], message: t('admin:payroll.adjustments.validation.month') });
      }

      if (kind === 'extra' && !values.concept.trim()) {
        ctx.addIssue({ code: 'custom', path: ['concept'], message: t('admin:payroll.adjustments.validation.concept') });
      }

      if (kind === 'advance' && !values.payment_date) {
        ctx.addIssue({
          code: 'custom',
          path: ['payment_date'],
          message: t('admin:payroll.adjustments.validation.paymentDate'),
        });
      }
    });

function todayInBogota() {
  return parseISO(toColombiaDateKey(new Date()));
}

function defaultValues(kind: PayrollAdjustmentType, editing: PayrollAdjustment | null, monthKeys: Array<string>) {
  if (editing) {
    return {
      month: editing.period_year && editing.period_month ? toMonthKey(editing.period_year, editing.period_month) : '',
      concept: editing.concept ?? '',
      amount: String(editing.amount),
      event_id: editing.event_id ?? NO_EVENT,
      payment_date: editing.payment_date ? parseISO(editing.payment_date) : undefined,
      note: editing.note ?? '',
    } satisfies FormValues;
  }

  const current = toColombiaDateKey(new Date()).slice(0, 7);

  return {
    month: kind === 'extra' && monthKeys.includes(current) ? current : '',
    concept: '',
    amount: '',
    event_id: NO_EVENT,
    payment_date: kind === 'advance' ? todayInBogota() : undefined,
    note: '',
  } satisfies FormValues;
}

interface AdjustmentDialogProps {
  kind: PayrollAdjustmentType;
  editing: PayrollAdjustment | null;
  onClose: () => void;
  onSaved: () => void;
  onOpenAssignments: () => void;
}

/** Mounted only while open, so every opening starts from fresh defaults. */
export function AdjustmentDialog({ kind, editing, onClose, onSaved, onOpenAssignments }: AdjustmentDialogProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [person, setPerson] = useState<PersonOption | null>(
    editing ? { id: editing.user_id, full_name: editing.full_name, email: editing.email ?? '' } : null,
  );
  const [query, setQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const monthKeys = useMemo(() => {
    const keys = buildMonthKeys();

    return editing?.period_year && editing.period_month
      ? [...new Set([...keys, toMonthKey(editing.period_year, editing.period_month)])]
      : keys;
  }, [editing]);
  const { control, handleSubmit, watch, formState } = useForm<FormValues, unknown, FormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(createSchema(t, kind)),
    mode: 'onChange',
    defaultValues: defaultValues(kind, editing, monthKeys),
  });
  const month = watch('month');
  const paymentDate = watch('payment_date');

  const target = useMemo(() => {
    if (kind === 'extra') return month ? parseMonthKey(month) : null;

    return paymentDate ? { year: paymentDate.getFullYear(), month: paymentDate.getMonth() + 1 } : null;
  }, [kind, month, paymentDate]);

  const searchEnabled = !editing && !person && query.trim().length >= 3;
  const { response: searchResponse, isLoading: isSearching } = usePromise(
    () => DansshipAPI.usersAdmin.search({ search: query.trim(), limit: 8 }),
    searchEnabled,
    [query],
  );
  const { response: eligibilityResponse } = usePromise(
    () => DansshipAPI.instructorPaymentsAdmin.getAdjustmentEligibility(person!.id, target!.year, target!.month),
    Boolean(person && target),
    [person?.id, target?.year, target?.month],
  );
  const { response: eventsResponse } = usePromise(
    () => DansshipAPI.instructorPaymentsAdmin.listAdjustmentEventOptions(),
    kind === 'extra',
  );

  const eligibility = person && target ? eligibilityResponse?.data : undefined;
  const noAssignment = eligibility ? !eligibility.has_active_assignment : false;
  const monthHasDocument = kind === 'extra' && eligibility ? eligibility.month_has_document : false;
  const searchResults = searchResponse?.data?.items ?? [];
  const monthOptions = monthKeys.map(key => {
    const parsed = parseMonthKey(key);

    return { value: key, label: formatMonthLabel(parsed.year, parsed.month, locale) };
  });
  const eventOptions = [
    { value: NO_EVENT, label: t('admin:payroll.adjustments.dialog.noEvent') },
    ...(eventsResponse?.data ?? []).map(event => ({ value: event.id, label: event.name })),
  ];
  const canSave = Boolean(person) && formState.isValid && !noAssignment && !isSaving;
  const warningMonth = target ? formatMonthLabel(target.year, target.month, locale) : '';
  const firstName = person?.full_name.split(' ')[0] ?? '';

  const save = handleSubmit(async values => {
    if (!person) return;

    setIsSaving(true);

    try {
      const amount = Number(values.amount);
      const result =
        kind === 'extra'
          ? await (() => {
              const { year, month: monthNumber } = parseMonthKey(values.month);
              const payload = {
                period_year: year,
                period_month: monthNumber,
                concept: values.concept.trim(),
                amount,
                event_id: values.event_id === NO_EVENT ? null : values.event_id,
              };

              return editing
                ? DansshipAPI.instructorPaymentsAdmin.updateExtra(editing.id, payload)
                : DansshipAPI.instructorPaymentsAdmin.createExtra({ ...payload, user_id: person.id });
            })()
          : await (() => {
              const payload = {
                amount,
                payment_date: format(values.payment_date as Date, 'yyyy-MM-dd'),
                note: values.note.trim() || null,
              };

              return editing
                ? DansshipAPI.instructorPaymentsAdmin.updateAdvance(editing.id, payload)
                : DansshipAPI.instructorPaymentsAdmin.createAdvance({ ...payload, user_id: person.id });
            })();

      if (!result.ok) {
        toast.error(t('admin:payroll.adjustments.dialog.saveFailed'));

        return;
      }

      toast.success(t('admin:payroll.adjustments.dialog.saveSuccess'));
      onSaved();
    } finally {
      setIsSaving(false);
    }
  });

  const title = editing
    ? t(`admin:payroll.adjustments.dialog.${kind}EditTitle`)
    : t(`admin:payroll.adjustments.dialog.${kind}Title`);

  return (
    <Dialog open onOpenChange={open => (open ? undefined : onClose())}>
      <DialogContent className='max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{t(`admin:payroll.adjustments.dialog.${kind}Description`)}</DialogDescription>
        </DialogHeader>

        <form className='grid gap-4' onSubmit={event => void save(event)}>
          <div className='grid gap-2'>
            <Label htmlFor='adjustment-person'>{t('admin:payroll.adjustments.dialog.person')}</Label>
            {person ? (
              <div className='flex items-center justify-between gap-3 rounded-2xl bg-gray-200/50 px-6 py-4'>
                <span>
                  <span className='block text-sm font-medium'>{person.full_name}</span>
                  <span className='block text-xs text-muted-foreground'>{person.email}</span>
                </span>
                {editing ? null : (
                  <Button color='primary' variant='text' type='button' onClick={() => setPerson(null)}>
                    {t('admin:payroll.adjustments.dialog.changePerson')}
                  </Button>
                )}
              </div>
            ) : (
              <>
                <Input
                  id='adjustment-person'
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder={t('admin:payroll.adjustments.dialog.personPlaceholder')}
                />
                {searchEnabled ? (
                  <div className='grid rounded-md border'>
                    {isSearching ? (
                      <p className='m-0 px-3 py-2 text-sm text-muted-foreground'>
                        {t('admin:payroll.adjustments.dialog.searching')}
                      </p>
                    ) : null}
                    {!isSearching && !searchResults.length ? (
                      <p className='m-0 px-3 py-2 text-sm text-muted-foreground'>
                        {t('admin:payroll.adjustments.dialog.noPeople')}
                      </p>
                    ) : null}
                    {searchResults.map(result => (
                      <button
                        key={result.id}
                        type='button'
                        className='px-3 py-2 text-left text-sm hover:bg-muted'
                        onClick={() => setPerson({ id: result.id, full_name: result.full_name, email: result.email })}
                      >
                        <span className='block font-medium'>{result.full_name}</span>
                        <span className='block text-xs text-muted-foreground'>{result.email}</span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </>
            )}
          </div>

          {kind === 'extra' ? (
            <>
              <SelectField
                control={control}
                name='month'
                label={t('admin:payroll.adjustments.dialog.month')}
                options={monthOptions}
              />
              <TextField
                control={control}
                name='concept'
                label={t('admin:payroll.adjustments.dialog.concept')}
                maxLength={255}
              />
            </>
          ) : (
            <DateField
              control={control}
              name='payment_date'
              label={t('admin:payroll.adjustments.dialog.paymentDate')}
              placeholder={t('admin:payroll.adjustments.validation.paymentDate')}
            />
          )}

          <TextField
            control={control}
            name='amount'
            type='number'
            inputMode='numeric'
            label={t('admin:payroll.adjustments.dialog.amount')}
          />

          {kind === 'extra' ? (
            <SelectField
              control={control}
              name='event_id'
              label={t('admin:payroll.adjustments.dialog.event')}
              options={eventOptions}
            />
          ) : (
            <TextareaField control={control} name='note' label={t('admin:payroll.adjustments.dialog.note')} />
          )}

          {kind === 'advance' ? (
            <p className='m-0 text-sm text-muted-foreground'>{t('admin:payroll.adjustments.dialog.advanceHelp')}</p>
          ) : null}

          {noAssignment ? (
            <div role='alert' className='grid gap-1 rounded-md border border-warning bg-warning/10 p-3 text-sm'>
              <span>
                {t('admin:payroll.adjustments.warnings.noAssignment', { name: firstName, month: warningMonth })}
              </span>
              <Button
                color='primary'
                variant='text'
                type='button'
                className='justify-self-start'
                onClick={onOpenAssignments}
              >
                {t('admin:payroll.adjustments.warnings.openAssignments')}
              </Button>
            </div>
          ) : null}
          {monthHasDocument && !noAssignment ? (
            <div role='status' className='rounded-md border border-warning bg-warning/10 p-3 text-sm'>
              {t('admin:payroll.adjustments.warnings.monthHasDocument')}
            </div>
          ) : null}

          <DialogFooter>
            <Button color='primary' variant='outlined' type='button' onClick={onClose}>
              {t('admin:payroll.adjustments.dialog.cancel')}
            </Button>
            <Button color='primary' variant='solid' type='submit' disabled={!canSave}>
              {editing ? t('admin:payroll.adjustments.dialog.saveChanges') : t('admin:payroll.adjustments.dialog.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
