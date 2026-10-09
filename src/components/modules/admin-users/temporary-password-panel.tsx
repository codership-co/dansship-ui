import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Button } from '@components/ui';

interface TemporaryPasswordPanelProps {
  password: string;
  expiresAt: string;
}

export function TemporaryPasswordPanel({ password, expiresAt }: TemporaryPasswordPanelProps) {
  const { t } = useTranslation();

  const copyPassword = async () => {
    try {
      await navigator.clipboard.writeText(password);
      toast.success(t('admin:users.registration.copied'));
    } catch {
      toast.error(t('admin:users.registration.copyFailed'));
    }
  };

  return (
    <div className='grid gap-3 rounded-md border p-4'>
      <div>
        <p className='text-sm font-medium'>{t('admin:users.registration.passwordOnce')}</p>
        <p className='text-sm text-muted-foreground'>{t('admin:users.registration.passwordHint')}</p>
      </div>
      <p className='font-mono text-lg tracking-wide' data-sentry-mask>
        {password}
      </p>
      <p className='text-sm'>
        {t('admin:users.registration.expires', {
          date: new Date(expiresAt).toLocaleString('es-CO'),
        })}
      </p>
      <Button type='button' variant='outline' className='w-fit' onClick={() => void copyPassword()}>
        {t('admin:users.registration.copy')}
      </Button>
    </div>
  );
}
