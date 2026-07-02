import type { ComponentType } from 'react';

import { useTranslation } from 'react-i18next';
import { LuBuilding2, LuCircleDollarSign, LuCreditCard, LuLandmark, LuSmartphone } from 'react-icons/lu';

import { cn } from '@helpers';

import type { PaymentMethodType } from '@core/api';

interface PaymentMethodSelectorProps {
  value: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
  availableMethods: Array<PaymentMethodType>;
}

const METHOD_ICON: Record<PaymentMethodType, ComponentType<{ className?: string }>> = {
  transfer: LuLandmark,
  cash: LuCircleDollarSign,
  nequi: LuSmartphone,
  daviplata: LuBuilding2,
  card: LuCreditCard,
};

export function PaymentMethodSelector({ value, onChange, availableMethods }: PaymentMethodSelectorProps) {
  const { t } = useTranslation();

  return (
    <div className='space-y-2'>
      {availableMethods.map(method => {
        const Icon = METHOD_ICON[method];
        const isSelected = value === method;

        return (
          <button
            key={method}
            type='button'
            className={cn(
              'w-full rounded-lg border px-8 py-4 text-left transition-colors',
              isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => onChange(method)}
          >
            <div className='flex items-center gap-6'>
              <Icon className='h-4 w-4 text-primary shrink-0' />
              <div>
                <p className='m-0'>{t(`payments:method.${method}`)}</p>
                <label className='text-gray-500'>{t(`payments:methodDesc.${method}`)}</label>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
