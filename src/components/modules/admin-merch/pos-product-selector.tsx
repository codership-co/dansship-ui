import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch } from 'react-icons/lu';

import { SpinnerLoader } from '@components/loaders';
import { Button, Input } from '@components/ui';
import { DansshipAPI, Product } from '@core/api';
import { formatMerchPrice } from '@helpers';
import { usePromise } from '@hooks';

interface POSProductSelectorProps {
  onAddToCart: (product: Product, quantity?: number) => void;
}

export function POSProductSelector({ onAddToCart }: POSProductSelectorProps) {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { response: products, isLoading } = usePromise(() =>
    DansshipAPI.merchAdmin.getProducts({
      is_active: true,
    }),
  );

  const categories = useMemo(() => {
    const source = products?.data?.map(item => item.category).filter((value): value is string => Boolean(value));

    return [...new Set(source)].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    return (products?.data ?? [])
      .filter(item => item.stock > 0)
      .filter(item => {
        if (categoryFilter === 'all') return true;

        return (item.category ?? '').toLowerCase() === categoryFilter.toLowerCase();
      })
      .filter(item => {
        if (!query) return true;

        return item.name.toLowerCase().includes(query) || (item.category ?? '').toLowerCase().includes(query);
      });
  }, [products, searchValue, categoryFilter]);

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <h2 className='text-xl font-semibold'>{t('merch:posTitle')}</h2>

        <div className='relative'>
          <Input
            value={searchValue}
            onChange={event => setSearchValue(event.target.value)}
            placeholder={t('merch:searchProducts')}
            className='pr-10'
          />
          <LuSearch className='absolute right-3 top-2.5 h-4 w-4 text-gray-400' />
        </div>

        <div className='flex flex-wrap gap-2'>
          <Button
            size='sm'
            variant={categoryFilter === 'all' ? 'default' : 'outline'}
            onClick={() => setCategoryFilter('all')}
          >
            {t('common:all', { defaultValue: 'All' })}
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              size='sm'
              variant={categoryFilter === category ? 'default' : 'outline'}
              onClick={() => setCategoryFilter(category)}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className='rounded-md border border-dashed bg-white p-6 text-center text-sm text-gray-500'>
          {t('common:noData')}
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-3 lg:grid-cols-2'>
          {filteredProducts.map(product => (
            <article key={product.id} className='rounded-lg border bg-white p-4 shadow-sm'>
              {product.image_url ? (
                <div className='mb-3 overflow-hidden rounded-md border bg-gray-50'>
                  <img src={product.image_url} alt={product.name} className='h-36 w-full object-cover' loading='lazy' />
                </div>
              ) : (
                <div className='mb-3 flex h-36 items-center justify-center rounded-md border border-dashed bg-gray-50 text-xs text-gray-400'>
                  {t('merch:noImage', { defaultValue: 'No image' })}
                </div>
              )}

              <div className='flex items-start justify-between gap-2'>
                <div>
                  <h3 className='font-semibold text-gray-900'>{product.name}</h3>
                  <p className='text-sm text-gray-500'>{product.category ?? '-'}</p>
                </div>
                <p className='text-sm font-medium text-gray-700'>{formatMerchPrice(product.price)}</p>
              </div>

              <p className='mt-2 text-xs text-gray-500'>
                {t('merch:productStock')}: {product.stock}
              </p>

              <div className='mt-3'>
                <Button className='w-full' onClick={() => onAddToCart(product, 1)}>
                  {t('merch:addToCart')}
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
