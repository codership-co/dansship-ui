import { useTranslation } from 'react-i18next';

import { AdminPaymentList } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminPaymentsPage() {
  const { t } = useTranslation();

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('payments:admin.pageTitle')}</h1>
        <p className='mt-2 text-gray-500'>
          {t('payments:admin.pageSubtitle', {
            defaultValue: 'Review and resolve payment intents across all purchase types.',
          })}
        </p>
      </div>

      <AdminPaymentList />
    </div>
  );
}

export const SecureAdminPaymentsPage = SecurityGuard(AdminPaymentsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.payments,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
