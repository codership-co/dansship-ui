import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { PersonPicker } from './person-picker';

import {
  SIMPLE_PERSON_DEFAULTS,
  SimplePersonFields,
  type SimplePersonValues,
  simplePersonSchema,
} from '@components/forms/simple-person-fields';
import { useOrPermissions } from '@contexts';
import { PERMISSION } from '@core/permissions';

import type { CompanionInput, PersonSearchResult } from '@core/api';

interface CompanionChooserProps {
  onChange: (companion: CompanionInput | null) => void;
  /** The booker, who cannot be their own companion. */
  excludeUserId?: string;
}

/** Picks an existing account or registers a new person (simple registration). */
export function CompanionChooser({ onChange, excludeUserId }: CompanionChooserProps) {
  const { t } = useTranslation('assisted');
  const canRegister = useOrPermissions([PERMISSION.SIMPLE_ACCOUNT_REGISTER]);
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [person, setPerson] = useState<PersonSearchResult | null>(null);
  const { control, watch } = useForm<SimplePersonValues>({
    resolver: zodResolver(simplePersonSchema),
    mode: 'onChange',
    defaultValues: SIMPLE_PERSON_DEFAULTS,
  });

  useEffect(() => {
    if (mode === 'existing') {
      onChange(person && person.id !== excludeUserId ? { user_id: person.id } : null);
    }
  }, [mode, person, excludeUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (mode !== 'new') {
      return;
    }

    const subscription = watch(values => {
      const parsed = simplePersonSchema.safeParse(values);

      onChange(
        parsed.success
          ? {
              new_person: {
                ...parsed.data,
                phone_country_code: '+57',
                terms_accepted: true,
              },
            }
          : null,
      );
    });

    onChange(null);

    return () => subscription.unsubscribe();
  }, [mode, watch]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className='grid gap-3 rounded-xl border border-border p-3'>
      {canRegister ? (
        <div className='flex gap-2'>
          <Button
            color='primary'
            size='small'
            variant={mode === 'existing' ? 'solid' : 'outlined'}
            type='button'
            onClick={() => setMode('existing')}
          >
            {t('companion.existing')}
          </Button>
          <Button
            color='primary'
            size='small'
            variant={mode === 'new' ? 'solid' : 'outlined'}
            type='button'
            onClick={() => setMode('new')}
          >
            {t('companion.new')}
          </Button>
        </div>
      ) : null}
      {mode === 'existing' ? (
        <PersonPicker person={person} onSelect={setPerson} label={t('companion.search')} />
      ) : (
        <div className='grid gap-3'>
          <p className='text-sm text-muted-foreground'>{t('companion.simpleHelp')}</p>
          <SimplePersonFields control={control} idPrefix='companion' termsLabel={t('companion.terms')} />
        </div>
      )}
    </div>
  );
}
