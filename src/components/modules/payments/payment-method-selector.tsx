import { useTranslation } from 'react-i18next';
import { LuCreditCard, LuLandmark } from 'react-icons/lu';

import { PaymentMethod } from '@core/api';
import { cn } from '@helpers';

interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}

const PaymentMethods = {
  [PaymentMethod.TRANSFER]: {
    Icon: LuLandmark,
    title: 'payments:method.breb',
    description: 'payments:methodDesc.breb',
    helperText: 'payments:methodHelper.transfer',
    recommended: true,
  },
  [PaymentMethod.CARD]: {
    Icon: LuCreditCard,
    title: 'payments:method.card',
    description: 'payments:methodDesc.card',
    helperText: 'payments:methodHelper.card',
    recommended: false,
  },
};

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className='space-y-4 pt-3'>
      {Object.entries(PaymentMethods).map(([method, { Icon, title, description, helperText, recommended }]) => {
        const isSelected = value === method;

        return (
          <button
            key={method}
            type='button'
            className={cn(
              'relative w-full min-w-0 cursor-pointer rounded-lg px-6 py-4 text-left transition-all sm:px-8',
              recommended
                ? cn(
                    'border-0 bg-gradient-plan-recommended text-primary-foreground shadow-[0_1rem_1.5rem_-0.75rem_var(--color-primary)]',
                    isSelected && 'ring-2 ring-highlight ring-offset-2',
                  )
                : isSelected
                  ? 'border border-primary bg-primary/5'
                  : 'border border-gray-200 hover:border-gray-300',
            )}
            onClick={() => onChange(method as PaymentMethod)}
          >
            {recommended && (
              <div className='pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight px-4 py-1 text-xs font-semibold uppercase text-highlight-100'>
                {t('subscriptions:bestValue')}
              </div>
            )}

            <div className='flex min-w-0 items-center gap-4 sm:gap-6'>
              <Icon className={cn('size-8 shrink-0', recommended ? 'text-primary-foreground' : 'text-primary')} />
              <div className='min-w-0'>
                <p className='m-0 mb-2 font-semibold'>{t(title)}</p>
                <label className={cn('my-1 block', recommended && 'text-primary-foreground/90')}>
                  {t(description)}
                </label>
                <small className={cn('m-0 block', recommended && 'text-primary-foreground/75')}>{t(helperText)}</small>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
