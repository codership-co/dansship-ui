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
              'w-full rounded-lg border p-3 text-left transition-colors',
              isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300',
            )}
            onClick={() => onChange(method)}
          >
            <div className='flex items-center gap-3'>
              <Icon className='h-4 w-4 text-primary' />
              <div>
                <p className='font-medium text-gray-900'>{t(`payments:method.${method}`)}</p>
                <p className='text-xs text-gray-500'>{t(`payments:methodDesc.${method}`)}</p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
