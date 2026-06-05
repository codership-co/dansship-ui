import { type ReactNode } from 'react';
import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';
import { LuCircleAlert } from 'react-icons/lu';

import { Input, Label } from '@components/ui';
import { cn } from '@helpers';

interface TextFieldProps<T extends FieldValues = Record<string, unknown>> {
  control: Control<T>;
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
}

export function TextField<T extends FieldValues = Record<string, unknown>>({
  control,
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
}: TextFieldProps<T>) {
  const hasLeftIcon = Boolean(icon);
  const hasRightElement = Boolean(rightElement);
  const fieldId = id || `field-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className='space-y-1'>
          <Label htmlFor={fieldId}>{label}</Label>
          <div className='relative'>
            {hasLeftIcon && <div className='absolute inset-y-0 left-0 pl-3 flex items-center'>{icon}</div>}
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
                hasLeftIcon && 'pl-10',
                hasRightElement && 'pr-10',
                error && 'border-alert-600 focus-visible:ring-alert-600',
              )}
              {...field}
            />
            {hasRightElement && (
              <div className='absolute inset-y-0 right-0 z-10 pr-3 flex items-center'>{rightElement}</div>
            )}
            {error && (
              <div className='absolute inset-y-0 right-0 pr-3 flex items-center text-alert-600'>
                <LuCircleAlert className='h-5 w-5' />
              </div>
            )}
          </div>
          {error && <p className='text-sm text-alert-600'>{error.message}</p>}
        </div>
      )}
    />
  );
}
