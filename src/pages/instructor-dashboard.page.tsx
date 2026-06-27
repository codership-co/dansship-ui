import { useTranslation } from 'react-i18next';

import { AssignedSchedule, AvailabilityForm, ProfileForm } from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions, InstructorPermissions } from '@core/permissions';

function InstructorDashboardPage() {
  const { t } = useTranslation();

  return (
    <div className='max-w-5xl mx-auto py-8 px-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-gray-900'>{t('instructor:dashboard.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('instructor:dashboard.subtitle')}</p>
      </div>

      <Tabs defaultValue='roster' className='w-full'>
        <TabsList className='mb-4 bg-white border border-gray-200 shadow-sm'>
          <TabsTrigger value='roster'>{t('instructor:dashboard.tabs.roster')}</TabsTrigger>
          <TabsTrigger value='availability'>{t('instructor:dashboard.tabs.availability')}</TabsTrigger>
          <TabsTrigger value='profile'>{t('instructor:dashboard.tabs.profile')}</TabsTrigger>
        </TabsList>

        <TabsContent value='roster' className='outline-none'>
          <AssignedSchedule />
        </TabsContent>

        <TabsContent value='availability' className='outline-none'>
          <AvailabilityForm />
        </TabsContent>

        <TabsContent value='profile' className='outline-none'>
          <ProfileForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const SecureInstructorDashboardPage = SecurityGuard(InstructorDashboardPage, {
  featureFlags: [FEATURE_FLAG.isInstructorDashboardPageEnabled],
  orPermissions: [...InstructorPermissions.dashboard, ...AdminPermissions.scheduleBuilder],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
