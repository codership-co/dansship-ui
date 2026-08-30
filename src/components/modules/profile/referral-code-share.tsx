import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuCopy } from 'react-icons/lu';
import { toast } from 'sonner';

interface ReferralCodeShareProps {
  code: string;
  className?: string;
}

export function ReferralCodeShare({ code, className }: ReferralCodeShareProps) {
  const { t } = useTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(t('profile:referral.copied'));
    } catch {
      toast.error(t('profile:referral.copyFailed'));
    }
  };

  return (
    <div className={className}>
      <small className='m-0 text-muted-foreground'>{t('profile:referral.title')}</small>
      <div className='mt-1 flex flex-wrap items-center gap-2'>
        <code className='rounded-md bg-secondary-200/60 px-3 py-1 text-sm font-semibold tracking-wide text-primary'>
          {code}
        </code>
        <Button type='button' variant='outlined' color='primary' size='small' onClick={() => void handleCopy()}>
          <LuCopy className='size-4' />
          {t('profile:referral.copy')}
        </Button>
      </div>
      <small className='m-0 text-muted-foreground'>{t('profile:referral.help')}</small>
    </div>
  );
}
