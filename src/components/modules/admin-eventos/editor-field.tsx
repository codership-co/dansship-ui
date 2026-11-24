import { Tooltip } from 'polpo/components';
import { type ReactNode } from 'react';
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuInfo } from 'react-icons/lu';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { cn } from '@helpers';

interface InfoTooltipProps {
  content: ReactNode;
}

/** The "Más información" bubble of the prototype: long explanations live here, not under the field. */
export function InfoTooltip({ content }: InfoTooltipProps) {
  const { t } = useTranslation();

  return (
    <Tooltip content={<span className='block max-w-72 text-xs'>{content}</span>}>
      <button
        type='button'
        className='inline-grid size-5 place-items-center rounded-full text-muted-foreground focus-visible:outline-2 focus-visible:outline-primary'
        aria-label={t('eventos:participation.editor.moreInfo')}
      >
        <LuInfo className='size-4' aria-hidden />
      </button>
    </Tooltip>
  );
}

interface EditorFieldProps {
  label: string;
  htmlFor?: string;
  /** `*` after the label. */
  required?: boolean;
  /** "(opcional)" after the label. */
  optional?: boolean;
  tooltip?: ReactNode;
  error?: string | null;
  className?: string;
  children: ReactNode;
}

/** The app form standard for the event editors: label above, `*` or "(opcional)", tooltip, error below. */
export function EditorField({
  label,
  htmlFor,
  required,
  optional,
  tooltip,
  error,
  className,
  children,
}: EditorFieldProps) {
  const { t } = useTranslation();

  return (
    <div className={cn('grid min-w-0 content-start gap-2', className)}>
      <div className='flex items-center gap-1'>
        <Label htmlFor={htmlFor}>
          {label}
          {required ? <span className='text-destructive'> *</span> : null}
          {optional ? (
            <span className='font-normal text-muted-foreground'> {t('eventos:participation.editor.optional')}</span>
          ) : null}
        </Label>
        {tooltip ? <InfoTooltip content={tooltip} /> : null}
      </div>
      {children}
      {error ? (
        <p role='alert' className='m-0 text-small text-alert-600'>
          {error}
        </p>
      ) : null}
    </div>
  );
}

interface SwitchRowProps {
  label: string;
  tooltip?: ReactNode;
  children: ReactNode;
}

/** A switch with its label on one line (no separator lines between rows). */
export function SwitchRow({ label, tooltip, children }: SwitchRowProps) {
  return (
    <div className='flex min-w-0 items-center justify-between gap-3'>
      <div className='flex min-w-0 items-center gap-1'>
        <span className='text-sm font-medium'>{label}</span>
        {tooltip ? <InfoTooltip content={tooltip} /> : null}
      </div>
      {children}
    </div>
  );
}

interface EditorSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: Array<{ value: string; label: string }>;
  required?: boolean;
  optional?: boolean;
  tooltip?: ReactNode;
  disabled?: boolean;
  /** Shown while nothing is chosen. */
  placeholder?: string;
  className?: string;
}

/** The theme `Select` bound to the form, laid out like every other editor field. */
export function EditorSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  required,
  optional,
  tooltip,
  disabled,
  placeholder,
  className,
}: EditorSelectProps<T>) {
  const id = `field-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <EditorField
          label={label}
          htmlFor={id}
          required={required}
          optional={optional}
          tooltip={tooltip}
          error={error?.message}
          className={className}
        >
          <Select value={String(field.value ?? '')} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger id={id} aria-label={label} className={error ? 'border-alert-600' : undefined}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </EditorField>
      )}
    />
  );
}
