import { useMemo, useState } from 'react';
import { type Control, type FieldValues, type Path, useController } from 'react-hook-form';
import { LuEye, LuEyeOff, LuLock } from 'react-icons/lu';

import { TextField } from './text-field';

interface PasswordStrengthLabels {
  weak: string;
  good: string;
  strong: string;
}

interface PasswordFieldProps<T extends FieldValues = Record<string, unknown>> {
  id?: string;
  control: Control<T>;
  name: Path<T>;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  showStrength?: boolean;
  strengthLabel?: string;
  strengthLabels?: PasswordStrengthLabels;
  disabled?: boolean;
}

interface StrengthInfo {
  text: string;
  color: string;
}

const defaultStrengthLabels: PasswordStrengthLabels = {
  weak: 'Weak',
  good: 'Good',
  strong: 'Strong',
};

export function PasswordField<T extends FieldValues = Record<string, unknown>>({
  id,
  control,
  name,
  label,
  placeholder,
  autoComplete,
  showStrength,
  strengthLabel = 'Password strength',
  strengthLabels = defaultStrengthLabels,
  disabled,
}: PasswordFieldProps<T>) {
  const [isVisible, setIsVisible] = useState(false);
  const { field } = useController({ control, name });
  const value = (field.value as string) || '';

  const strengthInfo = useMemo<StrengthInfo>(() => {
    if (!value) {
      return { text: '', color: '' };
    }

    const hasLength = value.length >= 8;
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasNumber = /\d/.test(value);
    const score = [hasLength, hasLower, hasUpper, hasNumber].filter(Boolean).length;

    if (score >= 4) {
      return { text: strengthLabels.strong, color: 'text-active-600' };
    }

    if (score >= 3) {
      return { text: strengthLabels.good, color: 'text-warning-600' };
    }

    return { text: strengthLabels.weak, color: 'text-alert-600' };
  }, [value, strengthLabels]);

  return (
    <div>
      <TextField
        id={id}
        control={control}
        name={name}
        label={label}
        type={isVisible ? 'text' : 'password'}
        autoComplete={autoComplete}
        placeholder={placeholder}
        icon={<LuLock className='h-5 w-5 text-gray-400' />}
        disabled={disabled}
        rightElement={
          <button
            type='button'
            onClick={() => setIsVisible(prev => !prev)}
            className='text-gray-400 hover:text-gray-600 cursor-pointer'
            aria-label={isVisible ? 'Hide password' : 'Show password'}
          >
            {isVisible ? <LuEyeOff className='h-5 w-5' /> : <LuEye className='h-5 w-5' />}
          </button>
        }
      />
      {showStrength && value && (
        <div className='mt-1 text-sm'>
          {strengthLabel}: <span className={strengthInfo.color}>{strengthInfo.text}</span>
        </div>
      )}
    </div>
  );
}
