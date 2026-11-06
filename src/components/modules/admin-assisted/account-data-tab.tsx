import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { apiErrorCode, duplicateUserId } from './assisted-errors';
import { PersonGate } from './person-gate';

import { TextField } from '@components/form-fields';
import { Label, Textarea } from '@components/ui';
import { DansshipAPI, type PersonSearchResult } from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise, usePromise } from '@hooks';

const schema = z.object({
  full_name: z.string().trim().min(1),
  email: z.string().trim().email(),
  phone_country_code: z.string().trim().max(10),
  phone_number: z.string().trim().min(7),
});

type FormValues = z.infer<typeof schema>;

function DataForm({ person }: { person: PersonSearchResult }) {
  const { t } = useTranslation('assisted');
  const { response, isLoading } = usePromise(() => DansshipAPI.usersAdmin.getById(person.id), true, [person.id]);
  const user = response?.data;
  const [reason, setReason] = useState('');
  const [duplicate, setDuplicate] = useState<{
    field: string;
    userId: string;
  } | null>(null);
  const { control, handleSubmit, reset, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: '',
      email: '',
      phone_country_code: '+57',
      phone_number: '',
    },
  });
  const { call: correct, isLoading: isSaving } = useCallablePromise(
    (payload: Parameters<typeof DansshipAPI.assistedAdmin.correctContact>[1]) =>
      DansshipAPI.assistedAdmin.correctContact(person.id, payload),
  );

  useEffect(() => {
    if (user) {
      reset({
        full_name: user.full_name ?? '',
        email: user.email,
        phone_country_code: user.phone_country_code ?? '+57',
        phone_number: user.phone_number ?? '',
      });
    }
  }, [user, reset]);

  const emailChanged = Boolean(user) && watch('email').trim().toLowerCase() !== user?.email.toLowerCase();

  const onSubmit = handleSubmit(async values => {
    if (!user) {
      return;
    }

    setDuplicate(null);

    const payload = {
      ...(values.full_name !== (user.full_name ?? '') ? { full_name: values.full_name } : {}),
      ...(values.email.toLowerCase() !== user.email.toLowerCase()
        ? { email: values.email, reason: reason.trim() }
        : {}),
      ...(values.phone_number !== (user.phone_number ?? '') ||
      values.phone_country_code !== (user.phone_country_code ?? '+57')
        ? {
            phone_number: values.phone_number,
            phone_country_code: values.phone_country_code,
          }
        : {}),
    };
    const { ok, data, error } = await correct(payload);

    if (ok && data) {
      toast.success(data.pending_email ? t('data.savedPending', { email: data.pending_email }) : t('data.saved'));
      setReason('');

      return;
    }

    const code = apiErrorCode(error);
    const other = duplicateUserId(error);

    if (other && (code === 'ACCOUNT_DATA_DUPLICATE_EMAIL' || code === 'ACCOUNT_DATA_DUPLICATE_PHONE')) {
      setDuplicate({
        field: code === 'ACCOUNT_DATA_DUPLICATE_EMAIL' ? 'email' : 'phone',
        userId: other,
      });

      return;
    }

    toast.error(t(`errors.${code}`, { defaultValue: t('errors.generic') }));
  });

  if (isLoading || !user) {
    return <p className='text-sm text-muted-foreground'>{t('common.loading')}</p>;
  }

  return (
    <form onSubmit={onSubmit} className='grid max-w-xl gap-4'>
      <p className='text-sm text-muted-foreground'>{t('data.help')}</p>
      <TextField control={control} name='full_name' label={t('data.fullName')} />
      <TextField control={control} name='email' type='email' label={t('data.email')} />
      <div className='grid grid-cols-[6rem_1fr] gap-3'>
        <TextField control={control} name='phone_country_code' label={t('data.countryCode')} />
        <TextField control={control} name='phone_number' type='tel' label={t('data.phone')} />
      </div>
      {emailChanged ? (
        <div className='grid gap-2'>
          <Label htmlFor='data-reason'>{t('data.reason')}</Label>
          <Textarea id='data-reason' value={reason} onChange={event => setReason(event.target.value)} />
          <p className='text-xs text-muted-foreground'>{t('data.emailPendingNote')}</p>
        </div>
      ) : null}
      {duplicate ? (
        <div role='alert' className='grid gap-2 rounded-md border border-alert-600 p-3 text-sm'>
          <p>{t(duplicate.field === 'email' ? 'data.duplicateEmail' : 'data.duplicatePhone')}</p>
          <Link
            to={`${PageURLS.admin.assisted}?tab=account&sub=merge&user=${person.id}&duplicate=${duplicate.userId}`}
            className='font-medium text-primary underline'
          >
            {t('data.goToMerge')}
          </Link>
        </div>
      ) : null}
      <div>
        <Button type='submit' color='primary' variant='solid' disabled={isSaving || (emailChanged && !reason.trim())}>
          {t('data.save')}
        </Button>
      </div>
    </form>
  );
}

export function AccountDataTab() {
  return <PersonGate>{person => <DataForm key={person.id} person={person} />}</PersonGate>;
}
