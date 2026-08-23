import { useTranslation } from 'react-i18next';

import { RoomsTab, ClassesTab, PlansTab, InstructorPayRatesTab } from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions, PERMISSION } from '@core/permissions';

function AdminInventoryPage() {
  const { t } = useTranslation();
  const canManagePayRate = useOrPermissions([PERMISSION.INSTRUCTOR_PAY_RATE_MANAGE]);

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:inventory.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('admin:inventory.subtitle')}</p>
      </div>

      <Tabs defaultValue='rooms' className='w-full'>
        <TabsList className='mb-4 bg-white border border-gray-200 shadow-sm'>
          <TabsTrigger value='rooms'>{t('admin:inventory.tabs.rooms')}</TabsTrigger>
          <TabsTrigger value='classes'>{t('admin:inventory.tabs.classCatalog')}</TabsTrigger>
          <TabsTrigger value='plans'>{t('admin:inventory.tabs.plans')}</TabsTrigger>
          {canManagePayRate ? <TabsTrigger value='payRates'>{t('admin:inventory.tabs.payRates')}</TabsTrigger> : null}
        </TabsList>

        <TabsContent value='rooms' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
          <RoomsTab />
        </TabsContent>

        <TabsContent value='classes' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
          <ClassesTab />
        </TabsContent>

        <TabsContent value='plans' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
          <PlansTab />
        </TabsContent>

        {canManagePayRate ? (
          <TabsContent value='payRates' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
            <InstructorPayRatesTab />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

export const SecureAdminInventoryPage = SecurityGuard(AdminInventoryPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.inventory,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
