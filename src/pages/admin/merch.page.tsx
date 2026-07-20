import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { OrderList, ProductList } from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminMerchPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = useMemo(() => {
    const requestedTab = searchParams.get('tab');

    return requestedTab === 'orders' ? 'orders' : 'products';
  }, [searchParams]);
  const subtitle =
    activeTab === 'orders'
      ? t('merch:management.ordersSubtitle', {
          defaultValue: 'Track sales orders and open payment reviews when needed.',
        })
      : t('merch:management.productsSubtitle', {
          defaultValue: 'Manage catalog, prices, and stock availability.',
        });

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('merch:productsTitle')}</h1>
        <p className='mt-2 text-gray-500'>{subtitle}</p>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={value => {
          setSearchParams(previous => {
            const next = new URLSearchParams(previous);

            if (value === 'orders') {
              next.set('tab', 'orders');
            } else {
              next.delete('tab');
            }

            return next;
          });
        }}
        className='w-full'
      >
        <TabsList className='mb-4 border border-gray-200 bg-white shadow-sm'>
          <TabsTrigger value='products'>{t('merch:productsTitle')}</TabsTrigger>
          <TabsTrigger value='orders'>{t('merch:ordersTitle')}</TabsTrigger>
        </TabsList>

        <TabsContent value='products' className='rounded-lg border border-gray-100 bg-white p-6 shadow-sm'>
          <ProductList />
        </TabsContent>

        <TabsContent value='orders' className='rounded-lg border border-gray-100 bg-white p-6 shadow-sm'>
          <OrderList />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureAdminMerchPage = SecurityGuard(AdminMerchPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.merch,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
