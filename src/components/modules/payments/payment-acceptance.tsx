import { useTranslation } from 'react-i18next';

import { Checkbox } from '@components/ui';
import { cn } from '@helpers';

interface PaymentAcceptanceProps {
  accepted: boolean;
  onAcceptedChange: (accepted: boolean) => void;
}

/** "Before confirming" card: the buyer acknowledges the purchase is final and non-refundable. */
export function PaymentAcceptance({ accepted, onAcceptedChange }: PaymentAcceptanceProps) {
  const { t } = useTranslation();

  return (
    <section className='grid gap-2'>
      <p className='m-0 text-[15px] font-semibold'>{t('eventos:checkout.beforeConfirm')}</p>
      <label
        className={cn(
          'flex cursor-pointer items-start gap-3 rounded-xl border-[1.5px] px-4 py-3.5',
          accepted ? 'border-primary bg-primary/5' : 'border-border bg-white',
        )}
      >
        <Checkbox className='mt-0.5' checked={accepted} onCheckedChange={value => onAcceptedChange(value === true)} />
        <span>{t('eventos:checkout.acceptFinal')}</span>
      </label>
    </section>
  );
}
