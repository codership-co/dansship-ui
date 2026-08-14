import { EmailField } from 'dansship-ui';
import { useForm } from 'react-hook-form';

export function Default() {
  const { control } = useForm({ defaultValues: { email: '' } });
  return <EmailField control={control} name='email' label='Email' placeholder='you@example.com' />;
}

export function WithError() {
  const { control } = useForm({ defaultValues: { email: 'not-an-email' } });
  return <EmailField control={control} name='email' label='Email' errorMessage='Enter a valid email address.' />;
}

export function Loading() {
  const { control } = useForm({ defaultValues: { email: 'jane@example.com' } });
  return <EmailField control={control} name='email' label='Email' isLoading />;
}
