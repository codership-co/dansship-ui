import { SelectField } from 'dansship-ui';
import { useForm } from 'react-hook-form';

const DANCE_STYLES = [
  { value: 'hip-hop', label: 'Hip-Hop' },
  { value: 'contemporary', label: 'Contemporary' },
  { value: 'ballet', label: 'Ballet' },
  { value: 'salsa', label: 'Salsa' },
];

export function Default() {
  const { control } = useForm({ defaultValues: { style: 'hip-hop' } });
  return (
    <SelectField
      control={control}
      name='style'
      label='Dance style'
      options={DANCE_STYLES}
      placeholder='Select a style'
    />
  );
}

export function Disabled() {
  const { control } = useForm({ defaultValues: { style: 'hip-hop' } });
  return <SelectField control={control} name='style' label='Dance style' options={DANCE_STYLES} disabled />;
}
