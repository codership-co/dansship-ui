import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import {
  ClassFeedbackTable,
  FinancialReports,
  InstructorPerformanceTable,
  NotificationSettings,
  OperationalDashboard,
  StudentReports,
  StudioRentalReports,
} from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions, PERMISSION } from '@core/permissions';

function AdminReportsPage() {
  const { t } = useTranslation();
  const canOperations = useOrPermissions(AdminPermissions.reports);
  const canFinance = useOrPermissions(AdminPermissions.financialReports);
  const canStudents = useOrPermissions(AdminPermissions.studentReports);
  const canInstructors = useOrPermissions(AdminPermissions.instructorReports);
  const canRentals = useOrPermissions(AdminPermissions.studioRentalReports);
  const canClassFeedback = useOrPermissions(AdminPermissions.classFeedback);
  const canNotifications = useOrPermissions(AdminPermissions.notifications);

  const tabs = useMemo(
    () =>
      [
        canOperations ? { value: 'operations', label: t('admin:reports.tabs.operations') } : null,
        canFinance ? { value: 'finance', label: t('admin:reports.tabs.finance') } : null,
        canStudents ? { value: 'students', label: t('admin:reports.tabs.students') } : null,
        canInstructors ? { value: 'instructors', label: t('admin:reports.tabs.instructors') } : null,
        canClassFeedback ? { value: 'class-feedback', label: t('admin:reports.tabs.classFeedback') } : null,
        canRentals ? { value: 'rentals', label: t('admin:reports.tabs.rentals') } : null,
        canNotifications ? { value: 'notifications', label: t('admin:reports.tabs.notifications') } : null,
      ].filter((tab): tab is { value: string; label: string } => tab !== null),
    [canClassFeedback, canFinance, canInstructors, canNotifications, canOperations, canRentals, canStudents, t],
  );
  const defaultTab = tabs[0]?.value ?? 'operations';
  const [tab, setTab] = useState(defaultTab);
  const activeTab = tabs.some(item => item.value === tab) ? tab : defaultTab;

  return (
    <div className='max-w-7xl mx-auto py-8 px-4 pt-20'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('admin:reports.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('admin:reports.subtitle')}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setTab} className='w-full'>
        <TabsList className='mb-4 bg-white border border-gray-200 shadow-sm flex-wrap h-auto gap-1 p-1'>
          {tabs.map(item => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {canOperations && (
          <TabsContent value='operations' className='outline-none'>
            <OperationalDashboard />
          </TabsContent>
        )}
        {canFinance && (
          <TabsContent value='finance' className='outline-none'>
            <FinancialReports />
          </TabsContent>
        )}
        {canStudents && (
          <TabsContent value='students' className='outline-none'>
            <StudentReports />
          </TabsContent>
        )}
        {canInstructors && (
          <TabsContent value='instructors' className='outline-none'>
            <InstructorPerformanceTable />
          </TabsContent>
        )}
        {canClassFeedback && (
          <TabsContent value='class-feedback' className='outline-none'>
            <ClassFeedbackTable />
          </TabsContent>
        )}
        {canRentals && (
          <TabsContent value='rentals' className='outline-none'>
            <StudioRentalReports />
          </TabsContent>
        )}
        {canNotifications && (
          <TabsContent value='notifications' className='outline-none'>
            <NotificationSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

export const SecureAdminReportsPage = SecurityGuard(AdminReportsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: [
    PERMISSION.REPORT_READ,
    PERMISSION.FINANCIAL_REPORT_READ,
    PERMISSION.STUDENT_REPORT_READ,
    PERMISSION.INSTRUCTOR_REPORT_READ,
    PERMISSION.CLASS_FEEDBACK_READ,
    PERMISSION.STUDIO_RENTAL_REPORT_READ,
    PERMISSION.NOTIFICATION_MANAGE,
  ],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
