import { type Control, type FieldValues, type Path } from 'react-hook-form';
import { LuMail } from 'react-icons/lu';

import { TextField } from './text-field';

import { Spinner } from '@components/loaders';

interface EmailFieldProps<T extends FieldValues = Record<string, unknown>> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  id?: string;
  placeholder?: string;
  disabled?: boolean;
  isLoading?: boolean;
  errorMessage?: string;
  icon?: React.ReactNode;
}

export function EmailField<T extends FieldValues = Record<string, unknown>>({
  control,
  name,
  label,
  id,
  placeholder,
  disabled,
  isLoading = false,
  errorMessage,
  icon = <LuMail className='h-5 w-5 text-gray-400' />,
}: EmailFieldProps<T>) {
  return (
    <TextField
      control={control}
      name={name}
      label={label}
      id={id}
      type='email'
      autoComplete='email'
      placeholder={placeholder}
      icon={isLoading ? <Spinner size='sm' /> : icon}
      disabled={disabled}
      errorMessage={errorMessage}
    />
  );
}
