import { PhoneField } from 'dansship-ui';
import { useForm } from 'react-hook-form';

export function Default() {
  const { control } = useForm({ defaultValues: { countryCode: '+1', phone: '' } });
  return (
    <PhoneField
      control={control}
      name='phone'
      codeName='countryCode'
      codePlaceholder='+1'
      label='Phone number'
      placeholder='(555) 555-0100'
    />
  );
}
