import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { POSCart, POSCheckout, POSProductSelector } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { useMerchPos } from '@hooks';

function AdminMerchPosPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const {
    cart,
    cartTotal,
    selectedCustomer,
    selectedPaymentMethod,
    addToCart,
    removeFromCart,
    updateQuantity,
    setCustomer,
    setPaymentMethod,
    submitOrder,
    isSubmitting,
  } = useMerchPos();

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8 pt-20'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>{t('merch:posTitle')}</h1>
        <p className='mt-2 text-gray-500'>{t('merch:completeSale')}</p>
      </div>

      <div className='grid grid-cols-1 gap-6 lg:grid-cols-3'>
        <section className='lg:col-span-2'>
          <POSProductSelector onAddToCart={addToCart} />
        </section>

        <aside className='space-y-4'>
          <POSCart cart={cart} cartTotal={cartTotal} onRemove={removeFromCart} onUpdateQuantity={updateQuantity} />
          <POSCheckout
            selectedCustomer={selectedCustomer}
            onSelectCustomer={setCustomer}
            selectedPaymentMethod={selectedPaymentMethod}
            onSelectPaymentMethod={setPaymentMethod}
            cartTotal={cartTotal}
            canSubmit={cart.length > 0 && Boolean(selectedCustomer)}
            onSubmit={async (proofFile, proofUploadMode) => {
              const success = await submitOrder(proofFile, proofUploadMode);

              if (success) {
                navigate(`${PageURLS.admin.merch}?tab=orders`);
              }
            }}
            isSubmitting={isSubmitting}
          />
        </aside>
      </div>
    </div>
  );
}

export const SecureAdminMerchPosPage = SecurityGuard(AdminMerchPosPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminMerchPosPageEnabled],
  orPermissions: AdminPermissions.merchPos,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
