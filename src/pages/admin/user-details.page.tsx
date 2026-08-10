import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router';

import { AdminPageLayout } from '@components/layouts';
import {
  AdminPaymentList,
  UserBenefitsTab,
  UserBookingsTab,
  UserDetails,
  UserDetailsActions,
  UserDetailsHeader,
  UserInstructorClassesTab,
  UserRolesManager,
  UserSubscriptionsTab,
  UserWalletTab,
} from '@components/modules';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions, PERMISSION } from '@core/permissions';
import { usePromise } from '@hooks';

const PROFILE_TAB = 'profile';
const SUBSCRIPTIONS_TAB = 'subscriptions';
const PAYMENTS_TAB = 'payments';
const BOOKINGS_TAB = 'bookings';
const BENEFITS_TAB = 'benefits';
const WALLET_TAB = 'wallet';
const INSTRUCTOR_CLASSES_TAB = 'instructor-classes';

function UserDetailsPage() {
  const { t } = useTranslation();
  const { userId = '' } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { response, isLoading, error, reFetch } = usePromise(() => DansshipAPI.usersAdmin.getById(userId), !!userId);
  const user = response?.data;
  const hasError = Boolean(error) || Boolean(response && !response.ok);

  const canManageSubscriptions = useOrPermissions(AdminPermissions.subscriptions);
  const canManagePayments = useOrPermissions(AdminPermissions.payments);
  const canManageBookings = useOrPermissions(AdminPermissions.bookings);
  const canReadBenefits = useOrPermissions(AdminPermissions.benefits);
  const canManageWallet = useOrPermissions(AdminPermissions.wallet);
  const canManageSchedule = useOrPermissions([PERMISSION.SCHEDULE_MANAGE]);
  const showInstructorClasses = Boolean(user?.has_instructor_profile) && canManageSchedule;

  const requestedTab = searchParams.get('tab') ?? PROFILE_TAB;
  const availableTabs = [
    PROFILE_TAB,
    ...(canManageSubscriptions ? [SUBSCRIPTIONS_TAB] : []),
    ...(canManagePayments ? [PAYMENTS_TAB] : []),
    ...(canManageBookings ? [BOOKINGS_TAB] : []),
    ...(canReadBenefits ? [BENEFITS_TAB] : []),
    ...(canManageWallet ? [WALLET_TAB] : []),
    ...(showInstructorClasses ? [INSTRUCTOR_CLASSES_TAB] : []),
  ];
  const activeTab = availableTabs.includes(requestedTab) ? requestedTab : PROFILE_TAB;

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
      <section className='grid gap-6'>
        <UserDetailsHeader userId={userId} email={user?.email} isLoading={isLoading && !user} />

        {hasError && !user ? (
          <UserDetails user={user} isLoading={false} hasError />
        ) : (
          <Tabs
            value={activeTab}
            onValueChange={value => {
              setSearchParams(value === PROFILE_TAB ? {} : { tab: value }, { replace: true });
            }}
          >
            <TabsList className='mb-4 h-auto flex-wrap gap-1 border border-gray-200 bg-white p-1 shadow-sm'>
              <TabsTrigger value={PROFILE_TAB}>{t('admin:users.details.tabs.profile')}</TabsTrigger>
              {canManageSubscriptions ? (
                <TabsTrigger value={SUBSCRIPTIONS_TAB}>{t('admin:users.details.tabs.subscriptions')}</TabsTrigger>
              ) : null}
              {canManagePayments ? (
                <TabsTrigger value={PAYMENTS_TAB}>{t('admin:users.details.tabs.payments')}</TabsTrigger>
              ) : null}
              {canManageBookings ? (
                <TabsTrigger value={BOOKINGS_TAB}>{t('admin:users.details.tabs.bookings')}</TabsTrigger>
              ) : null}
              {canReadBenefits ? (
                <TabsTrigger value={BENEFITS_TAB}>{t('admin:users.details.tabs.benefits')}</TabsTrigger>
              ) : null}
              {canManageWallet ? (
                <TabsTrigger value={WALLET_TAB}>{t('admin:users.details.tabs.wallet')}</TabsTrigger>
              ) : null}
              {showInstructorClasses ? (
                <TabsTrigger value={INSTRUCTOR_CLASSES_TAB}>
                  {t('admin:users.details.tabs.instructorClasses')}
                </TabsTrigger>
              ) : null}
            </TabsList>

            <TabsContent value={PROFILE_TAB}>
              {activeTab === PROFILE_TAB ? (
                <div className='grid gap-6'>
                  <UserDetails user={user} isLoading={isLoading} hasError={hasError} />
                  {userId ? <UserRolesManager userId={userId} onChanged={() => void reFetch()} /> : null}
                </div>
              ) : null}
            </TabsContent>

            {canManageSubscriptions ? (
              <TabsContent value={SUBSCRIPTIONS_TAB}>
                {activeTab === SUBSCRIPTIONS_TAB && userId ? <UserSubscriptionsTab userId={userId} /> : null}
              </TabsContent>
            ) : null}

            {canManagePayments ? (
              <TabsContent value={PAYMENTS_TAB}>
                {activeTab === PAYMENTS_TAB && userId ? <AdminPaymentList userId={userId} readOnly /> : null}
              </TabsContent>
            ) : null}

            {canManageBookings ? (
              <TabsContent value={BOOKINGS_TAB}>
                {activeTab === BOOKINGS_TAB && userId ? <UserBookingsTab userId={userId} /> : null}
              </TabsContent>
            ) : null}

            {canReadBenefits ? (
              <TabsContent value={BENEFITS_TAB}>
                {activeTab === BENEFITS_TAB && userId ? <UserBenefitsTab userId={userId} /> : null}
              </TabsContent>
            ) : null}

            {canManageWallet ? (
              <TabsContent value={WALLET_TAB}>
                {activeTab === WALLET_TAB && userId ? <UserWalletTab userId={userId} /> : null}
              </TabsContent>
            ) : null}

            {showInstructorClasses ? (
              <TabsContent value={INSTRUCTOR_CLASSES_TAB}>
                {activeTab === INSTRUCTOR_CLASSES_TAB && userId ? <UserInstructorClassesTab userId={userId} /> : null}
              </TabsContent>
            ) : null}
          </Tabs>
        )}
      </section>
    </AdminPageLayout>
  );
}

export const SecureAdminUserDetailsPage = SecurityGuard(UserDetailsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.users,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
