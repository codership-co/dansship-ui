import { useTranslation } from 'react-i18next';

import {
  ClassCancellationsTable,
  InstructorPerformanceTable,
  NotificationSettings,
  OperationalDashboard,
} from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminReportsPage() {
  const { t } = useTranslation();

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:reports.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('admin:reports.subtitle')}</p>
      </div>

      <Tabs defaultValue='dashboard' className='w-full'>
        <TabsList className='mb-4 bg-white border border-gray-200 shadow-sm flex-wrap h-auto gap-1 p-1'>
          <TabsTrigger value='dashboard'>{t('admin:reports.tabs.dashboard')}</TabsTrigger>
          <TabsTrigger value='instructor-performance'>
            {t('admin:reports.tabs.instructorPerformance', 'Instructor Performance')}
          </TabsTrigger>
          <TabsTrigger value='class-cancellations'>{t('admin:reports.tabs.classCancellations')}</TabsTrigger>
          <TabsTrigger value='notifications'>{t('admin:reports.tabs.notifications')}</TabsTrigger>
        </TabsList>

        <TabsContent value='dashboard' className='outline-none'>
          <OperationalDashboard />
        </TabsContent>

        <TabsContent value='instructor-performance' className='outline-none'>
          <InstructorPerformanceTable />
        </TabsContent>

        <TabsContent value='class-cancellations' className='outline-none'>
          <ClassCancellationsTable />
        </TabsContent>

        <TabsContent value='notifications' className='outline-none'>
          <NotificationSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureAdminReportsPage = SecurityGuard(AdminReportsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.reports,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
