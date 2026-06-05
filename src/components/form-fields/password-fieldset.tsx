import { type Control, type FieldValues, type Path } from 'react-hook-form';

import { PasswordField } from './password-field';

interface PasswordFieldsetProps<T extends FieldValues = Record<string, unknown>> {
  control: Control<T>;
  passwordName?: Path<T>;
  confirmPasswordName?: Path<T>;
  passwordLabel: string;
  confirmPasswordLabel: string;
  showStrength?: boolean;
  strengthLabel?: string;
  strengthLabels?: {
    weak: string;
    good: string;
    strong: string;
  };
  disabled?: boolean;
}

export function PasswordFieldset<T extends FieldValues = Record<string, unknown>>({
  control,
  passwordName = 'password' as Path<T>,
  confirmPasswordName = 'confirmPassword' as Path<T>,
  passwordLabel,
  confirmPasswordLabel,
  showStrength,
  strengthLabel,
  strengthLabels,
  disabled,
}: PasswordFieldsetProps<T>) {
  return (
    <div className='space-y-6'>
      <PasswordField
        id='password'
        control={control}
        name={passwordName}
        label={passwordLabel}
        autoComplete='new-password'
        placeholder={passwordLabel}
        showStrength={showStrength}
        strengthLabel={strengthLabel}
        strengthLabels={strengthLabels}
        disabled={disabled}
      />
      <PasswordField
        id='confirmPassword'
        control={control}
        name={confirmPasswordName}
        label={confirmPasswordLabel}
        autoComplete='new-password'
        placeholder={passwordLabel}
        disabled={disabled}
      />
    </div>
  );
}
