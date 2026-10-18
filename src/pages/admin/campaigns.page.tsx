import { useTranslation } from 'react-i18next';

import { SectionHeading } from '@components/containers';
import { CampaignsPanel } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminCampaignsPage() {
  const { t } = useTranslation();

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 pt-20'>
      <SectionHeading title={t('campaigns:admin.title')} subtitle={t('campaigns:admin.subtitle')} />
      <div className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
        <CampaignsPanel />
      </div>
    </div>
  );
}

export const SecureAdminCampaignsPage = SecurityGuard(AdminCampaignsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.campaigns,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
