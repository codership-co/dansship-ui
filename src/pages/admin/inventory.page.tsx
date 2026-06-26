import { useTranslation } from 'react-i18next';

import { RoomsTab, ClassesTab, PlansTab, DiscountsTab } from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminInventoryPage() {
  const { t } = useTranslation();

  return (
    <div className='max-w-7xl mx-auto py-8 px-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:inventory.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('admin:inventory.subtitle')}</p>
      </div>

      <Tabs defaultValue='rooms' className='w-full'>
        <TabsList className='mb-4 bg-white border border-gray-200 shadow-sm'>
          <TabsTrigger value='rooms'>{t('admin:inventory.tabs.rooms')}</TabsTrigger>
          <TabsTrigger value='classes'>{t('admin:inventory.tabs.classCatalog')}</TabsTrigger>
          <TabsTrigger value='plans'>{t('admin:inventory.tabs.plans')}</TabsTrigger>
          <TabsTrigger value='discounts'>{t('admin:inventory.tabs.discounts')}</TabsTrigger>
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

        <TabsContent value='discounts' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
          <DiscountsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureAdminInventoryPage = SecurityGuard(AdminInventoryPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled, FEATURE_FLAG.isAdminInventoryPageEnabled],
  orPermissions: AdminPermissions.inventory,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
