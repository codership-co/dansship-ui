import { type Control, type FieldValues, type Path } from 'react-hook-form';

import { type FormItem } from './form-items';

export function FieldError({ message }: { message?: string }) {
  return message ? <small className='text-alert-600'>{message}</small> : null;
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  return children ? <small className='text-xs text-muted-foreground'>{children}</small> : null;
}

export interface AnswerInputProps<T extends FieldValues = FieldValues> {
  control: Control<T>;
  /** The form path of this item's answer, e.g. `answers.music`. */
  name: Path<T>;
  item: FormItem;
}
