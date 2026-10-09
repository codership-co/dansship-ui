import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button, Input, Label } from '@components/ui';
import { DansshipAPIError, type DirectRegistrationPayload } from '@core/api';

interface DirectRegistrationFormProps {
  layout?: 'inline' | 'stacked';
  onSubmit: (payload: DirectRegistrationPayload) => Promise<boolean>;
}

export function DirectRegistrationForm({ layout = 'inline', onSubmit }: DirectRegistrationFormProps) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const stacked = layout === 'stacked';

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);

    try {
      const ok = await onSubmit({
        email: email.trim(),
        full_name: fullName.trim() || null,
        phone_number: phone.trim() || null,
      });

      if (ok) {
        setEmail('');
        setFullName('');
        setPhone('');
        toast.success(t('eventos:managed.registeredPaid'));
      }
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      toast.error(code === 'EVENT_SOLD_OUT' ? t('eventos:managed.soldOut') : t('eventos:managed.registerFailed'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className={stacked ? 'grid gap-4' : 'grid gap-3 md:grid-cols-4'} onSubmit={submit}>
      <div className='grid gap-2'>
        <Label htmlFor='direct-email'>
          {stacked ? t('eventos:managed.emailRequired') : t('eventos:managed.email')}
        </Label>
        <Input
          id='direct-email'
          type='email'
          required
          placeholder={stacked ? t('eventos:managed.emailPlaceholder') : undefined}
          value={email}
          onChange={event => setEmail(event.target.value)}
        />
      </div>
      <div className={stacked ? 'grid gap-4 sm:grid-cols-2' : 'contents'}>
        <div className='grid gap-2'>
          <Label htmlFor='direct-name'>
            {stacked ? t('eventos:managed.nameOptional') : t('eventos:managed.fullName')}
          </Label>
          <Input
            id='direct-name'
            placeholder={stacked ? t('eventos:managed.namePlaceholder') : undefined}
            value={fullName}
            onChange={event => setFullName(event.target.value)}
          />
        </div>
        <div className='grid gap-2'>
          <Label htmlFor='direct-phone'>
            {stacked ? t('eventos:managed.phoneOptional') : t('eventos:managed.phone')}
          </Label>
          <Input
            id='direct-phone'
            placeholder={stacked ? t('eventos:managed.phonePlaceholder') : undefined}
            value={phone}
            onChange={event => setPhone(event.target.value)}
          />
        </div>
      </div>
      <div className={stacked ? 'flex justify-end' : 'flex items-end'}>
        <Button type='submit' disabled={saving || (stacked && !email.trim())}>
          {saving ? t('eventos:admin.saving') : t('eventos:managed.registerPaid')}
        </Button>
      </div>
    </form>
  );
}
