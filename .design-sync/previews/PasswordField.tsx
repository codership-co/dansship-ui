import { PasswordField } from 'dansship-ui';
import { useForm } from 'react-hook-form';

export function Default() {
  const { control } = useForm({ defaultValues: { password: '' } });
  return <PasswordField control={control} name='password' label='Password' />;
}

export function WithStrength() {
  const { control } = useForm({ defaultValues: { password: 'Sup3rSecret!' } });
  return <PasswordField control={control} name='password' label='New password' showStrength />;
}
