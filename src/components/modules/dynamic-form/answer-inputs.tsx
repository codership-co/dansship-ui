import { type ComponentType } from 'react';
import { Controller, useWatch, type FieldValues, type Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { FieldError, FieldHint, type AnswerInputProps } from './answer-parts';
import { FileOrLinkInput } from './file-answer-input';
import { FORM_ITEM_KINDS, LONG_TEXT_DEFAULT_MAX, type FormItem, type FormItemKind } from './form-items';
import { choiceRowClass } from './form-styles';

import { TextareaField, TextField } from '@components/form-fields';
import { Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { cn } from '@helpers';

export { FieldError, FieldHint, type AnswerInputProps } from './answer-parts';

/** A checkbox row of a list (multiple choice, donations): the whole row toggles, primary when on. */
export function CheckRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  hint?: string | null;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex min-h-11 cursor-pointer items-center gap-3 rounded-[10px] border px-3.5 py-2.5',
        choiceRowClass(checked),
      )}
    >
      <Checkbox id={id} checked={checked} onCheckedChange={value => onChange(value === true)} />
      <span className='grid gap-0.5'>
        <span className='text-sm'>{label}</span>
        {hint ? <span className='text-xs text-muted-foreground'>{hint}</span> : null}
      </span>
    </label>
  );
}

function ShortTextInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  return (
    <div className='grid gap-1'>
      <TextField control={control} name={name} id={`answer-${item.key}`} label={item.label} maxLength={200} />
      <FieldHint>{item.help_text}</FieldHint>
    </div>
  );
}

function LongTextInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  const { t } = useTranslation();
  const value = useWatch({ control, name });
  const max = item.options.max_length ?? LONG_TEXT_DEFAULT_MAX;
  const length = typeof value === 'string' ? value.length : 0;
  const maxLabel = max.toLocaleString('es-CO');

  return (
    <div className='grid gap-1'>
      <TextareaField
        control={control}
        name={name}
        id={`answer-${item.key}`}
        label={item.label}
        rows={4}
        maxLength={max}
      />
      <div className='flex justify-between gap-3 text-xs text-muted-foreground'>
        <small>{[item.help_text, t('forms:answer.maxLengthHint', { max: maxLabel })].filter(Boolean).join(' ')}</small>
        <small className='shrink-0'>
          {t('forms:answer.counter', { count: length.toLocaleString('es-CO'), max: maxLabel })}
        </small>
      </div>
    </div>
  );
}

/** «Enlace»: the URL with its help on the left, the optional note on the right. */
function LinkInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  const { t } = useTranslation();

  return (
    <div className='grid gap-4 md:grid-cols-2'>
      <div className='grid gap-1'>
        <TextField
          control={control}
          name={`${name}.url` as Path<T>}
          id={`answer-${item.key}`}
          type='url'
          label={item.label}
          placeholder='https://'
          maxLength={500}
        />
        <FieldHint>{item.help_text}</FieldHint>
      </div>
      {item.options.with_note ? (
        <TextField
          control={control}
          name={`${name}.note` as Path<T>}
          id={`answer-${item.key}-note`}
          label={t('forms:answer.linkNote')}
          maxLength={300}
        />
      ) : null}
    </div>
  );
}

/** «Lista»: one answer from a dropdown. */
function ChoiceInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  const { t } = useTranslation();
  const id = `answer-${item.key}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: input, fieldState }) => (
        <div className='grid gap-2'>
          <Label htmlFor={id}>{item.label}</Label>
          <Select value={typeof input.value === 'string' ? input.value : ''} onValueChange={input.onChange}>
            <SelectTrigger id={id} className='w-full' aria-invalid={Boolean(fieldState.error)}>
              <SelectValue placeholder={t('forms:answer.choicePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {(item.options.choices ?? []).map(choice => (
                <SelectItem key={choice} value={choice}>
                  {choice}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHint>{item.help_text}</FieldHint>
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  );
}

/** «Selección múltiple»: one checkbox row per choice. */
function MultiChoiceInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: input, fieldState }) => {
        const selected: Array<string> = Array.isArray(input.value) ? input.value : [];

        return (
          <fieldset className='m-0 grid gap-2 border-0 p-0'>
            <legend className='mb-2 text-sm font-medium'>{item.label}</legend>
            <FieldHint>{item.help_text}</FieldHint>
            {(item.options.choices ?? []).map((choice, index) => (
              <CheckRow
                key={choice}
                id={`answer-${item.key}-${index}`}
                label={choice}
                checked={selected.includes(choice)}
                onChange={on => input.onChange(on ? [...selected, choice] : selected.filter(value => value !== choice))}
              />
            ))}
            <FieldError message={fieldState.error?.message} />
          </fieldset>
        );
      }}
    />
  );
}

/** «Casilla»: one tick row; the help sits inside it. */
function CheckboxInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: input, fieldState }) => (
        <div className='grid gap-1'>
          <CheckRow
            id={`answer-${item.key}`}
            label={item.label}
            hint={item.help_text}
            checked={input.value === true}
            onChange={input.onChange}
          />
          <FieldError message={fieldState.error?.message} />
        </div>
      )}
    />
  );
}

/** One input per kind; layout and external kinds have none. A new kind is one entry here. */
export const ANSWER_INPUTS: Partial<Record<FormItemKind, ComponentType<AnswerInputProps>>> = {
  short_text: ShortTextInput,
  long_text: LongTextInput,
  link: LinkInput,
  choice: ChoiceInput,
  multi_choice: MultiChoiceInput,
  checkbox: CheckboxInput,
  file: FileOrLinkInput,
};

/** The input of one question, by its kind. */
export function AnswerInput<T extends FieldValues>({ control, name, item }: AnswerInputProps<T>) {
  const Input = ANSWER_INPUTS[item.kind] as ComponentType<AnswerInputProps<T>> | undefined;

  return Input ? <Input control={control} name={name} item={item} /> : null;
}

export function isFullWidthItem(item: Pick<FormItem, 'kind'>): boolean {
  return Boolean(FORM_ITEM_KINDS[item.kind]?.fullWidth);
}
