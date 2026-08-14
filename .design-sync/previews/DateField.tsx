import { DateField } from 'dansship-ui';
import { useForm } from 'react-hook-form';

export function Default() {
  const { control } = useForm({ defaultValues: { birthDate: undefined } });
  return <DateField control={control} name='birthDate' label='Date of birth' placeholder='Select a date' />;
}
