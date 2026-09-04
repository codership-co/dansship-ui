import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { ClassesTab, DoorCodePanel, InstructorPayRatesTab, PlansTab, RoomsTab } from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminInventoryPagePermissions, AdminPermissions, PERMISSION } from '@core/permissions';

const INVENTORY_TABS = ['rooms', 'classes', 'plans', 'payRates', 'doorCode'] as const;
type InventoryTab = (typeof INVENTORY_TABS)[number];

function isInventoryTab(value: string | null): value is InventoryTab {
  return INVENTORY_TABS.includes((value ?? '') as InventoryTab);
}

function AdminInventoryPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const canManageInventory = useOrPermissions(AdminPermissions.inventory);
  const canManagePayRate = useOrPermissions([PERMISSION.INSTRUCTOR_PAY_RATE_MANAGE]);
  const canManageDoorCode = useOrPermissions(AdminPermissions.doorCode);

  const visibleTabs = useMemo(() => {
    const tabs: Array<InventoryTab> = [];

    if (canManageInventory) {
      tabs.push('rooms', 'classes', 'plans');
    }

    if (canManagePayRate) {
      tabs.push('payRates');
    }

    if (canManageDoorCode) {
      tabs.push('doorCode');
    }

    return tabs;
  }, [canManageDoorCode, canManageInventory, canManagePayRate]);

  const requestedTab = searchParams.get('tab');
  const defaultTab = visibleTabs[0] ?? 'rooms';
  const activeTab: InventoryTab =
    isInventoryTab(requestedTab) && visibleTabs.includes(requestedTab) ? requestedTab : defaultTab;

  const setActiveTab = (tab: string) => {
    if (!isInventoryTab(tab) || !visibleTabs.includes(tab)) {
      return;
    }

    setSearchParams(
      previous => {
        const next = new URLSearchParams(previous);

        if (tab === defaultTab) {
          next.delete('tab');
        } else {
          next.set('tab', tab);
        }

        return next;
      },
      { replace: true },
    );
  };

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:inventory.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('admin:inventory.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='mb-4 bg-white border border-gray-200 shadow-sm'>
          {canManageInventory ? (
            <>
              <TabsTrigger value='rooms'>{t('admin:inventory.tabs.rooms')}</TabsTrigger>
              <TabsTrigger value='classes'>{t('admin:inventory.tabs.classCatalog')}</TabsTrigger>
              <TabsTrigger value='plans'>{t('admin:inventory.tabs.plans')}</TabsTrigger>
            </>
          ) : null}
          {canManagePayRate ? <TabsTrigger value='payRates'>{t('admin:inventory.tabs.payRates')}</TabsTrigger> : null}
          {canManageDoorCode ? <TabsTrigger value='doorCode'>{t('admin:inventory.tabs.doorCode')}</TabsTrigger> : null}
        </TabsList>

        {canManageInventory ? (
          <>
            <TabsContent value='rooms' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
              <RoomsTab />
            </TabsContent>
            <TabsContent value='classes' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
              <ClassesTab />
            </TabsContent>
            <TabsContent value='plans' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
              <PlansTab />
            </TabsContent>
          </>
        ) : null}

        {canManagePayRate ? (
          <TabsContent value='payRates' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
            <InstructorPayRatesTab />
          </TabsContent>
        ) : null}

        {canManageDoorCode ? (
          <TabsContent value='doorCode' className='bg-white p-6 rounded-lg shadow-sm border border-gray-100'>
            <DoorCodePanel />
          </TabsContent>
        ) : null}
      </Tabs>
    </div>
  );
}

export const SecureAdminInventoryPage = SecurityGuard(AdminInventoryPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminInventoryPagePermissions,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
