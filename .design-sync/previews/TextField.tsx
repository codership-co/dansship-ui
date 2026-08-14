import { TextField } from 'dansship-ui';
import { useForm } from 'react-hook-form';

export function Default() {
  const { control } = useForm({ defaultValues: { fullName: '' } });
  return <TextField control={control} name='fullName' label='Full name' placeholder='Jane Doe' />;
}

export function WithHelperText() {
  const { control } = useForm({ defaultValues: { studioName: '' } });
  return (
    <TextField
      control={control}
      name='studioName'
      label='Studio name'
      placeholder='Dansship Studio'
      helperText='This is shown publicly on your profile.'
    />
  );
}

export function WithError() {
  const { control } = useForm({ defaultValues: { username: '' } });
  return (
    <TextField control={control} name='username' label='Username' errorMessage='This username is taken.' />
  );
}

export function Disabled() {
  const { control } = useForm({ defaultValues: { id: 'STU-2048' } });
  return <TextField control={control} name='id' label='Studio ID' disabled />;
}
