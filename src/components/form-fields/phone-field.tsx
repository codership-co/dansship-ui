import type { ReactNode } from 'react';

import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { LuCircleAlert } from 'react-icons/lu';

import { SelectField } from '@components/form-fields/select-field';
import { Input, Label } from '@components/ui';
import { COUNTRY_CODE_OPTIONS } from '@core/constants';
import { cn } from '@helpers';

interface PhoneFieldProps<T extends FieldValues = Record<string, unknown>> {
  control: Control<T>;
  codeName: Path<T>;
  codePlaceholder: string;
  name: Path<T>;
  label: string;
  id?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  icon?: ReactNode;
  rightElement?: ReactNode;
  inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
  pattern?: string;
  maxLength?: number;
  disabled?: boolean;
  helperText?: string;
  inputClassName?: string;
  errorMessage?: string;
  hideLabel?: boolean;
}

export function PhoneField<T extends FieldValues = Record<string, unknown>>({
  control,
  codeName,
  codePlaceholder,
  name,
  label,
  id,
  type = 'text',
  placeholder,
  autoComplete,
  icon,
  rightElement,
  inputMode,
  pattern,
  maxLength,
  disabled,
  helperText,
  inputClassName,
  errorMessage,
  hideLabel = false,
}: PhoneFieldProps<T>) {
  const hasLeftIcon = Boolean(icon);
  const hasRightElement = Boolean(rightElement);
  const fieldId = id || `field-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className='grid gap-2'>
          {!hideLabel ? <Label htmlFor={fieldId}>{label}</Label> : null}
          <section className='grid grid-cols-[auto_1fr] items-end'>
            <SelectField
              control={control}
              name={codeName}
              label=''
              hideLabel
              options={COUNTRY_CODE_OPTIONS}
              placeholder={codePlaceholder}
              className='rounded-tr-none rounded-br-none h-13 px-2'
            />
            <div className='relative'>
              {hasLeftIcon && <div className='absolute top-0 left-0 h-full pl-3 flex items-center'>{icon}</div>}
              <Input
                id={fieldId}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                inputMode={inputMode}
                pattern={pattern}
                maxLength={maxLength}
                disabled={disabled}
                className={cn(
                  'pr-8 rounded-tl-none rounded-bl-none',
                  hasLeftIcon && 'pl-10',
                  hasRightElement && !error && !errorMessage && 'pr-10',
                  hasRightElement && (error || errorMessage) && 'pr-16',
                  (error || errorMessage) && 'outline-alert-600 focus-visible:ring-alert-600',
                  inputClassName,
                )}
                {...field}
              />
              {(hasRightElement || error || errorMessage) && (
                <div className='absolute top-0 right-0 h-full z-10 pr-3 flex items-center gap-2'>
                  {(error || errorMessage) && <LuCircleAlert className='h-4 w-4 text-alert-600' />}
                  {rightElement}
                </div>
              )}
            </div>
          </section>
          {(error || errorMessage) && (
            <label htmlFor={fieldId} className='m-0 text-small text-alert-600'>
              {error ? error.message : errorMessage}
            </label>
          )}
          {helperText && (
            <label htmlFor={fieldId} className='m-0 text-small'>
              {helperText}
            </label>
          )}
        </div>
      )}
    />
  );
}
