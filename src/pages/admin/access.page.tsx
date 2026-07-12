import { useTranslation } from 'react-i18next';

import { RolesTab, PoliciesTab, UserRolesTab } from '@components/modules';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminAccessPage() {
  const { t } = useTranslation();

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:rbac.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('admin:rbac.subtitle')}</p>
      </div>

      <Tabs defaultValue='roles' className='w-full'>
        <TabsList className='mb-4 bg-white border border-gray-200 shadow-sm'>
          <TabsTrigger value='roles'>{t('admin:rbac.tabs.roles')}</TabsTrigger>
          <TabsTrigger value='policies'>{t('admin:rbac.tabs.policies')}</TabsTrigger>
          <TabsTrigger value='user-roles'>{t('admin:rbac.tabs.userAssignments')}</TabsTrigger>
        </TabsList>

        <TabsContent value='roles' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
          <RolesTab />
        </TabsContent>

        <TabsContent value='policies' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
          <PoliciesTab />
        </TabsContent>

        <TabsContent value='user-roles' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
          <UserRolesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureAdminAccessPage = SecurityGuard(AdminAccessPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminAccessPageEnabled],
  orPermissions: AdminPermissions.access,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
