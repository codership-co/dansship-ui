import { type Control, Controller, type FieldValues, type Path } from 'react-hook-form';

import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps<T extends FieldValues = Record<string, unknown>> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: Array<SelectOption>;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
}

export function SelectField<T extends FieldValues = Record<string, unknown>>({
  control,
  name,
  label,
  options,
  placeholder,
  disabled,
  id,
}: SelectFieldProps<T>) {
  const fieldId = id || `field-${name}`;

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState: { error } }) => (
        <div className='space-y-1'>
          <Label htmlFor={fieldId}>{label}</Label>
          <Select value={field.value || ''} onValueChange={field.onChange} disabled={disabled}>
            <SelectTrigger id={fieldId} className={error ? 'border-alert-600 focus-visible:ring-alert-600' : ''}>
              <SelectValue placeholder={placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className='text-sm text-alert-600'>{error.message}</p>}
        </div>
      )}
    />
  );
}
