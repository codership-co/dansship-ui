import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { AdminPageLayout } from '@components/layouts';
import { PaymentAssignmentsPanel } from '@components/modules';
import { Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';

function PaymentAssignmentsPage() {
  const { t } = useTranslation();
  const [openCreate, setOpenCreate] = useState<(() => void) | null>(null);
  const registerCreate = useCallback((open: () => void) => {
    setOpenCreate(() => open);
  }, []);

  return (
    <AdminPageLayout
      title={t('admin:paymentAssignments.title')}
      subtitle={t('admin:paymentAssignments.subtitle')}
      dataComponent='PaymentAssignmentsPage'
      actions={
        <Button type='button' onClick={() => openCreate?.()} disabled={!openCreate}>
          {t('admin:paymentAssignments.create')}
        </Button>
      }
    >
      <PaymentAssignmentsPanel onReady={registerCreate} />
    </AdminPageLayout>
  );
}

export const SecureAdminPaymentAssignmentsPage = SecurityGuard(PaymentAssignmentsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: [PERMISSION.INSTRUCTOR_PAY_RATE_MANAGE],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
