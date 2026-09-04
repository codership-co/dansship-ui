import { useTranslation } from 'react-i18next';
import { LuGift, LuUser, LuUsers } from 'react-icons/lu';

import { cn } from '@helpers';

export type CheckoutPurchaseMode = 'self' | 'gift' | 'duo';

interface CheckoutPurchaseModeSelectorProps {
  value: CheckoutPurchaseMode;
  onChange: (mode: CheckoutPurchaseMode) => void;
  showDuo: boolean;
}

export function CheckoutPurchaseModeSelector({ value, onChange, showDuo }: CheckoutPurchaseModeSelectorProps) {
  const { t } = useTranslation();

  const options = [
    {
      mode: 'self' as const,
      Icon: LuUser,
      title: t('gifts:purchaseModeSelfTitle'),
    },
    {
      mode: 'gift' as const,
      Icon: LuGift,
      title: t('gifts:purchaseModeGiftTitle'),
    },
    ...(showDuo
      ? [
          {
            mode: 'duo' as const,
            Icon: LuUsers,
            title: t('subscriptions:duoModeTitle'),
          },
        ]
      : []),
  ];

  return (
    <div className='grid gap-3'>
      <p className='m-0 text-sm font-medium text-gray-900'>
        <span className='md:hidden'>{t('subscriptions:whoIsThisPlanFor')}</span>
        <span className='hidden md:inline'>{t('subscriptions:purchaseTypeLabel')}</span>
      </p>
      <div className={cn('grid gap-2', showDuo ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
        {options.map(({ mode, Icon, title }) => {
          const isSelected = value === mode;

          return (
            <button
              key={mode}
              type='button'
              className={cn(
                'flex w-full min-w-0 cursor-pointer items-center gap-3 rounded-full border px-4 py-3 text-left transition-colors',
                isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white hover:border-gray-300',
              )}
              onClick={() => onChange(mode)}
              aria-pressed={isSelected}
            >
              <span
                className={cn(
                  'grid size-9 shrink-0 place-content-center rounded-full',
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-500',
                )}
              >
                <Icon className='size-4' />
              </span>
              <span className='min-w-0 font-semibold text-gray-900'>{title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
