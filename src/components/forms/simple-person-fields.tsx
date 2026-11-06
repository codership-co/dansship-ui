import { Controller, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Checkbox, TextField } from '@components/form-fields';

export const simplePersonSchema = z.object({
  full_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone_number: z.string().trim().min(7),
  terms_accepted: z.literal(true),
});

export type SimplePersonValues = z.infer<typeof simplePersonSchema>;

export const SIMPLE_PERSON_DEFAULTS: SimplePersonValues = {
  full_name: '',
  email: '',
  phone_number: '',
  terms_accepted: false as unknown as true,
};

interface SimplePersonFieldsProps {
  control: Control<SimplePersonValues>;
  /** Keeps ids unique when the fields appear twice on a page. */
  idPrefix: string;
  /** Copy of the terms checkbox: the person accepts for themselves or the admin ticks it when helping. */
  termsLabel: string;
  placeholders?: boolean;
}

/** Name, email and phone plus the terms checkbox: the data every simple registration asks for. */
export function SimplePersonFields({ control, idPrefix, termsLabel, placeholders = false }: SimplePersonFieldsProps) {
  const { t } = useTranslation('common');

  return (
    <>
      <TextField
        control={control}
        name='full_name'
        id={`${idPrefix}-name`}
        label={t('simplePerson.fullName')}
        placeholder={placeholders ? t('simplePerson.fullNamePlaceholder') : undefined}
        autoComplete='name'
      />
      <TextField
        control={control}
        name='email'
        id={`${idPrefix}-email`}
        type='email'
        label={t('simplePerson.email')}
        placeholder={placeholders ? t('simplePerson.emailPlaceholder') : undefined}
        autoComplete='email'
      />
      <TextField
        control={control}
        name='phone_number'
        id={`${idPrefix}-phone`}
        type='tel'
        label={t('simplePerson.phone')}
        placeholder={placeholders ? t('simplePerson.phonePlaceholder') : undefined}
        autoComplete='tel'
      />
      <Controller
        control={control}
        name='terms_accepted'
        render={({ field }) => (
          <Checkbox
            id={`${idPrefix}-terms`}
            name='terms_accepted'
            label={termsLabel}
            checked={field.value === true}
            onChange={event => field.onChange(event.target.checked)}
          />
        )}
      />
    </>
  );
}
