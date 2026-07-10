import { useTranslation } from 'react-i18next';
import { LuCreditCard, LuLandmark } from 'react-icons/lu';

import { PaymentMethod } from '@core/api';
import { cn } from '@helpers';

interface PaymentMethodSelectorProps {
  value: PaymentMethod | null;
  onChange: (method: PaymentMethod) => void;
}

const PaymentMethods = {
  [PaymentMethod.CARD]: {
    Icon: LuCreditCard,
    title: 'payments:method.card',
    description: 'payments:methodDesc.card',
    helperText: 'payments:methodHelper.card',
  },
  [PaymentMethod.TRANSFER]: {
    Icon: LuLandmark,
    title: 'payments:method.transfer',
    description: 'payments:methodDesc.transfer',
    helperText: 'payments:methodHelper.transfer',
  },
};

export function PaymentMethodSelector({ value, onChange }: PaymentMethodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className='space-y-2'>
      {Object.entries(PaymentMethods).map(([method, { Icon, title, description, helperText }]) => {
        const isSelected = value === method;

        return (
          <button
            key={method}
            type='button'
            className={cn(
              'w-full cursor-pointer rounded-lg border px-8 py-4 text-left transition-colors',
              isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => onChange(method as PaymentMethod)}
          >
            <div className='flex items-center gap-6'>
              <Icon className='size-8 text-primary shrink-0' />
              <div>
                <p className='m-0 mb-2'>{t(title)}</p>
                <label className='block my-1'>{t(description)}</label>
                <small className='block m-0'>{t(helperText)}</small>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
