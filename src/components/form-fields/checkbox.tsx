import { LuCircleAlert } from 'react-icons/lu';

import { Label, Checkbox as ShadcnCheckbox } from '@components/ui';

interface CheckboxProps {
  id: string;
  name: string;
  label: string;
  checked: boolean;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  disabled?: boolean;
}

export function Checkbox({ id, name, label, checked, onChange, error, disabled }: CheckboxProps) {
  const handleCheckedChange = (value: boolean) => {
    // Synthesize a change event to keep the same API for consumers
    const syntheticEvent = {
      target: { name, value: '', type: 'checkbox', checked: value },
    } as React.ChangeEvent<HTMLInputElement>;
    onChange(syntheticEvent);
  };

  return (
    <div>
      <div className='flex items-start gap-3'>
        <ShadcnCheckbox
          id={id}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
          className='mt-0.5'
        />
        <Label htmlFor={id} className='text-sm font-normal leading-snug'>
          {label}
        </Label>
      </div>
      {error && (
        <div className='mt-1 flex items-center gap-1 text-sm text-destructive'>
          <LuCircleAlert className='h-4 w-4' />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
