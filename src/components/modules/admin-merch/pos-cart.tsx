import { useTranslation } from 'react-i18next';
import { LuTrash2 } from 'react-icons/lu';

import { Button, Input } from '@components/ui';
import { type CartItem } from '@core/api';
import { formatMerchPrice } from '@helpers';

interface POSCartProps {
  cart: Array<CartItem>;
  cartTotal: number;
  onRemove: (productId: string) => void;
  onUpdateQuantity: (productId: string, quantity: number) => void;
}

export function POSCart({ cart, cartTotal, onRemove, onUpdateQuantity }: POSCartProps) {
  const { t } = useTranslation();

  return (
    <div className='space-y-3 rounded-lg border bg-white p-4 shadow-sm'>
      <h3 className='text-lg font-semibold'>{t('merch:cart')}</h3>

      {cart.length === 0 ? (
        <div className='rounded-md border border-dashed p-4 text-sm text-gray-500'>{t('merch:emptyCart')}</div>
      ) : (
        <div className='space-y-3'>
          {cart.map(item => (
            <div key={item.product.id} className='rounded-md border p-3'>
              <div className='flex items-start justify-between gap-3'>
                <div>
                  <p className='font-medium text-gray-900'>{item.product.name}</p>
                  <p className='text-xs text-gray-500'>{formatMerchPrice(item.product.price)}</p>
                </div>

                <Button variant='ghost' size='sm' className='h-8 w-8 p-0' onClick={() => onRemove(item.product.id)}>
                  <LuTrash2 className='h-4 w-4' />
                </Button>
              </div>

              <div className='mt-2 flex items-center justify-between gap-3'>
                <Input
                  type='number'
                  min={1}
                  max={item.product.stock}
                  value={item.quantity}
                  onChange={event => {
                    const next = Number(event.target.value);

                    if (Number.isFinite(next)) {
                      onUpdateQuantity(item.product.id, next);
                    }
                  }}
                  className='w-24'
                />
                <p className='text-sm font-semibold text-gray-700'>
                  {formatMerchPrice(item.product.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className='flex items-center justify-between border-t pt-3'>
        <p className='font-semibold text-gray-800'>{t('merch:cartTotal')}</p>
        <p className='text-lg font-bold text-gray-900'>{formatMerchPrice(cartTotal)}</p>
      </div>
    </div>
  );
}
