import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { SectionHeading } from '@components/containers';
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
      <SectionHeading title={t('merch:posTitle')} subtitle={t('merch:completeSale')} />

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
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.merchPos,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
