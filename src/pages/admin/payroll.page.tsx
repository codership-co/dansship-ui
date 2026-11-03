import { Button } from 'polpo/components';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { AdminPageLayout } from '@components/layouts';
import { PaymentAssignmentsPanel, PayrollAdjustmentsPanel, PayrollLedger } from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';

const PAYMENTS_TAB = 'payments';
const ASSIGNMENTS_TAB = 'assignments';
const ADJUSTMENTS_TAB = 'adjustments';
const ACTIVE_TAB = 'data-[state=active]:bg-primary/20 data-[state=active]:text-primary';

function PayrollPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const canReadPayroll = useOrPermissions([PERMISSION.PAYROLL_READ]);
  const canManagePayRate = useOrPermissions([PERMISSION.INSTRUCTOR_PAY_RATE_MANAGE]);
  const canManageAdjustments = useOrPermissions([PERMISSION.PAYROLL_ADJUSTMENTS_MANAGE]);
  const [openCreate, setOpenCreate] = useState<(() => void) | null>(null);
  const registerCreate = useCallback((open: () => void) => {
    setOpenCreate(() => open);
  }, []);

  const availableTabs = [
    ...(canReadPayroll ? [PAYMENTS_TAB] : []),
    ...(canManagePayRate ? [ASSIGNMENTS_TAB] : []),
    ...(canManageAdjustments ? [ADJUSTMENTS_TAB] : []),
  ];
  const tabParam = searchParams.get('tab');
  const requestedTab = tabParam === ASSIGNMENTS_TAB || tabParam === ADJUSTMENTS_TAB ? tabParam : PAYMENTS_TAB;
  const activeTab = availableTabs.includes(requestedTab) ? requestedTab : (availableTabs[0] ?? PAYMENTS_TAB);

  return (
    <AdminPageLayout
      title={t('admin:payroll.title')}
      subtitle={t('admin:payroll.subtitle')}
      dataComponent='PayrollPage'
    >
      <Tabs
        value={activeTab}
        onValueChange={value =>
          setSearchParams(value === PAYMENTS_TAB ? {} : { tab: value }, {
            replace: true,
          })
        }
      >
        <TabsList className='mb-4 h-auto max-w-full flex-nowrap justify-start gap-1 overflow-x-auto border border-gray-200 bg-white p-1 shadow-sm [&_[data-slot=tabs-trigger]]:flex-none'>
          {canReadPayroll ? (
            <TabsTrigger value={PAYMENTS_TAB} className={ACTIVE_TAB}>
              {t('admin:payroll.tabs.payments')}
            </TabsTrigger>
          ) : null}
          {canManagePayRate ? (
            <TabsTrigger value={ASSIGNMENTS_TAB} className={ACTIVE_TAB}>
              {t('admin:payroll.tabs.assignments')}
            </TabsTrigger>
          ) : null}
          {canManageAdjustments ? (
            <TabsTrigger value={ADJUSTMENTS_TAB} className={ACTIVE_TAB}>
              {t('admin:payroll.tabs.adjustments')}
            </TabsTrigger>
          ) : null}
        </TabsList>

        {canReadPayroll ? (
          <TabsContent value={PAYMENTS_TAB}>{activeTab === PAYMENTS_TAB ? <PayrollLedger /> : null}</TabsContent>
        ) : null}

        {canManagePayRate ? (
          <TabsContent value={ASSIGNMENTS_TAB}>
            {activeTab === ASSIGNMENTS_TAB ? (
              <div className='grid gap-4'>
                <div className='flex flex-wrap items-center justify-between gap-3'>
                  <p className='m-0 text-sm text-muted-foreground'>{t('admin:payroll.assignmentsSubtitle')}</p>
                  <Button
                    color='primary'
                    variant='solid'
                    type='button'
                    onClick={() => openCreate?.()}
                    disabled={!openCreate}
                  >
                    {t('admin:paymentAssignments.create')}
                  </Button>
                </div>
                <PaymentAssignmentsPanel onReady={registerCreate} />
              </div>
            ) : null}
          </TabsContent>
        ) : null}

        {canManageAdjustments ? (
          <TabsContent value={ADJUSTMENTS_TAB}>
            {activeTab === ADJUSTMENTS_TAB ? (
              <PayrollAdjustmentsPanel
                onOpenAssignments={() => setSearchParams({ tab: ASSIGNMENTS_TAB }, { replace: true })}
              />
            ) : null}
          </TabsContent>
        ) : null}
      </Tabs>
    </AdminPageLayout>
  );
}

export const SecureAdminPayrollPage = SecurityGuard(PayrollPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: [
    PERMISSION.PAYROLL_READ,
    PERMISSION.INSTRUCTOR_PAY_RATE_MANAGE,
    PERMISSION.PAYROLL_ADJUSTMENTS_MANAGE,
  ],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
