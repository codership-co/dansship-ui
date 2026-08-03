import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { AdminPageLayout } from '@components/layouts';
import { UserDetails, UserDetailsActions } from '@components/modules';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function UserDetailsPage() {
  const { t } = useTranslation();
  const { userId = '' } = useParams<{ userId: string }>();
  const { response, isLoading, error, reFetch } = usePromise(() => DansshipAPI.usersAdmin.getById(userId), !!userId);
  const user = response?.data;

  return (
    <AdminPageLayout
      title={t('admin:users.details.title')}
      dataComponent='UserDetailsPage'
      actions={
        user ? (
          <UserDetailsActions
            userId={userId}
            userEmail={user.email}
            roleNames={user.roles}
            isActive={user.is_active}
            hasInstructorProfile={user.has_instructor_profile}
            instructorOnboardingCompleted={user.instructor_onboarding_completed ?? false}
            instructorBusinessStatus={
              user.instructor_business_status ?? user.instructor_profile?.business_status ?? null
            }
            onChanged={() => void reFetch()}
          />
        ) : null
      }
    >
      <UserDetails user={user} isLoading={isLoading} hasError={Boolean(error) || Boolean(response && !response.ok)} />
    </AdminPageLayout>
  );
}

export const SecureAdminUserDetailsPage = SecurityGuard(UserDetailsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.users,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
