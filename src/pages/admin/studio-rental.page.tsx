import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { AvailabilityBlocksPanel, InternalReservedUsePanel, RentalPricingPanel } from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

const TAB_VALUES = ['reserved-use', 'blocks', 'pricing'] as const;
type StudioRentalTab = (typeof TAB_VALUES)[number];

function isStudioRentalTab(value: string | null): value is StudioRentalTab {
  return TAB_VALUES.includes((value ?? '') as StudioRentalTab);
}

function AdminStudioRentalPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const activeTab: StudioRentalTab =
    tabParam === 'rules' || tabParam === 'approval'
      ? tabParam === 'rules'
        ? 'blocks'
        : 'pricing'
      : isStudioRentalTab(tabParam)
        ? tabParam
        : 'pricing';

  useEffect(() => {
    if (tabParam === 'rules') {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'blocks');
      setSearchParams(next, { replace: true });

      return;
    }

    if (tabParam === 'approval' || !isStudioRentalTab(tabParam)) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', 'pricing');
      setSearchParams(next, { replace: true });
    }
  }, [searchParams, setSearchParams, tabParam]);

  const setActiveTab = (tab: string) => {
    if (!isStudioRentalTab(tab)) {
      return;
    }

    const next = new URLSearchParams(searchParams);
    next.set('tab', tab);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className='mx-auto max-w-7xl space-y-6 px-4 py-8 pt-20'>
      <div>
        <h1 className='text-primary'>{t('studioRental:admin.title')}</h1>
        <p className='mt-2 text-muted-foreground'>{t('studioRental:admin.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className='w-full'>
        <TabsList className='mb-4 bg-[hsl(var(--surface-container-low))]'>
          <TabsTrigger value='pricing'>{t('studioRental:admin.tabs.pricing')}</TabsTrigger>
          <TabsTrigger value='blocks'>{t('studioRental:admin.tabs.blocks')}</TabsTrigger>
          <TabsTrigger value='reserved-use'>{t('studioRental:admin.tabs.reservedUse')}</TabsTrigger>
        </TabsList>

        <TabsContent
          value='reserved-use'
          className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-6'
        >
          <InternalReservedUsePanel />
        </TabsContent>

        <TabsContent
          value='blocks'
          className='space-y-4 rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-6'
        >
          <AvailabilityBlocksPanel />
        </TabsContent>

        <TabsContent
          value='pricing'
          className='space-y-4 rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-6'
        >
          <RentalPricingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureAdminStudioRentalPage = SecurityGuard(AdminStudioRentalPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.studioRental,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
