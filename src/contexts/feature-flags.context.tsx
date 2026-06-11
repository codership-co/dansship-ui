import { createContext, useContext } from 'react';

export enum FEATURE_FLAG {
  // AUTH
  areAuthPagesEnabled = 'areAuthPagesEnabled',
  isLoginPageEnabled = 'isLoginPageEnabled',
  isSignupPageEnabled = 'isSignupPageEnabled',
  isForgotPasswordPageEnabled = 'isForgotPasswordPageEnabled',
  isResetPasswordPageEnabled = 'isResetPasswordPageEnabled',
  isVerifyEmailPageEnabled = 'isVerifyEmailPageEnabled',
  isOnboardingPageEnabled = 'isOnboardingPageEnabled',

  // COMMON
  isClassesPageEnabled = 'isClassesPageEnabled',
  isFigureCompletedPageEnabled = 'isFigureCompletedPageEnabled',
  isFigureDetailsPageEnabled = 'isFigureDetailsPageEnabled',
  isFigureSavedPageEnabled = 'isFigureSavedPageEnabled',
  isFiguresPageEnabled = 'isFiguresPageEnabled',
  isFiguresDetailsPageEnabled = 'isFiguresDetailsPageEnabled',
  isInstructorDashboardPageEnabled = 'isInstructorDashboardPageEnabled',
  isMyAccountBookingsPageEnabled = 'isMyAccountBookingsPageEnabled',
  isMyAccountSubscriptionPageEnabled = 'isMyAccountSubscriptionPageEnabled',
  isProfilePageEnabled = 'isProfilePageEnabled',
  isProfileEditPageEnabled = 'isProfileEditPageEnabled',
  isStudioRentalBrowsePageEnabled = 'isStudioRentalBrowsePageEnabled',
  isStudioRentalRequestsPageEnabled = 'isStudioRentalRequestsPageEnabled',

  // ADMIN
  areAdminPagesEnabled = 'areAdminPagesEnabled',
  isAdminAccessPageEnabled = 'isAdminAccessPageEnabled',
  isAdminPageEnabled = 'isAdminPageEnabled',
  isAdminAgendaPageEnabled = 'isAdminAgendaPageEnabled',
  isAdminAgendaConflictsPageEnabled = 'isAdminAgendaConflictsPageEnabled',
  isAdminBookingsPageEnabled = 'isAdminBookingsPageEnabled',
  isAdminFiguresPageEnabled = 'isAdminFiguresPageEnabled',
  isAdminInventoryPageEnabled = 'isAdminInventoryPageEnabled',
  isAdminMerchPageEnabled = 'isAdminMerchPageEnabled',
  isAdminMerchPosPageEnabled = 'isAdminMerchPosPageEnabled',
  isAdminPaymentsPageEnabled = 'isAdminPaymentsPageEnabled',
  isAdminReportsPageEnabled = 'isAdminReportsPageEnabled',
  isAdminScheduleBuilderPageEnabled = 'isAdminScheduleBuilderPageEnabled',
  isAdminStudioRentalPageEnabled = 'isAdminStudioRentalPageEnabled',
}

interface FeatureFlagsContextState extends Record<FEATURE_FLAG, boolean> {}

const FeatureFlagsContext = createContext<FeatureFlagsContextState | null>(null);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

const envs = import.meta.env;

export const FeatureFlagsProvider = ({ children }: FeatureFlagsProviderProps) => {
  const isAuthOn = envs.VITE_ARE_AUTH_PAGES_ENABLED === 'true';
  const isAdminOn = envs.VITE_ARE_ADMIN_PAGES_ENABLED === 'true';

  return (
    <FeatureFlagsContext.Provider
      value={{
        // AUTH
        areAuthPagesEnabled: isAuthOn,
        isLoginPageEnabled: isAuthOn && envs.VITE_IS_LOGIN_PAGE_ENABLED === 'true',
        isSignupPageEnabled: isAuthOn && envs.VITE_IS_SIGNUP_PAGE_ENABLED === 'true',
        isForgotPasswordPageEnabled: isAuthOn && envs.VITE_IS_FORGOT_PASSWORD_PAGE_ENABLED === 'true',
        isResetPasswordPageEnabled: isAuthOn && envs.VITE_IS_RESET_PASSWORD_PAGE_ENABLED === 'true',
        isVerifyEmailPageEnabled: isAuthOn && envs.VITE_IS_VERIFY_EMAIL_PAGE_ENABLED === 'true',
        isOnboardingPageEnabled: isAuthOn && envs.VITE_IS_ONBOARDING_PAGE_ENABLED === 'true',

        // COMMON
        isClassesPageEnabled: envs.VITE_IS_CLASSES_PAGE_ENABLED === 'true',
        isFigureCompletedPageEnabled: envs.VITE_IS_FIGURE_COMPLETED_PAGE_ENABLED === 'true',
        isFigureDetailsPageEnabled: envs.VITE_IS_FIGURE_DETAILS_PAGE_ENABLED === 'true',
        isFigureSavedPageEnabled: envs.VITE_IS_FIGURE_SAVED_PAGE_ENABLED === 'true',
        isFiguresPageEnabled: envs.VITE_IS_FIGURES_PAGE_ENABLED === 'true',
        isFiguresDetailsPageEnabled: envs.VITE_IS_FIGURES_DETAILS_PAGE_ENABLED === 'true',
        isInstructorDashboardPageEnabled: envs.VITE_IS_INSTRUCTOR_DASHBOARD_PAGE_ENABLED === 'true',
        isMyAccountBookingsPageEnabled: envs.VITE_IS_MY_ACCOUNT_BOOKINGS_PAGE_ENABLED === 'true',
        isMyAccountSubscriptionPageEnabled: envs.VITE_IS_MY_ACCOUNT_SUBSCRIPTION_PAGE_ENABLED === 'true',
        isProfilePageEnabled: envs.VITE_IS_PROFILE_PAGE_ENABLED === 'true',
        isProfileEditPageEnabled: envs.VITE_IS_PROFILE_EDIT_PAGE_ENABLED === 'true',
        isStudioRentalBrowsePageEnabled: envs.VITE_IS_STUDIO_RENTAL_BROWSE_PAGE_ENABLED === 'true',
        isStudioRentalRequestsPageEnabled: envs.VITE_IS_STUDIO_RENTAL_REQUESTS_PAGE_ENABLED === 'true',

        // ADMIN
        areAdminPagesEnabled: isAdminOn,
        isAdminAccessPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_ACCESS_PAGE_ENABLED === 'true',
        isAdminPageEnabled: isAdminOn && envs.VITE_IS_ADMIN__PAGE_ENABLED === 'true',
        isAdminAgendaPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_AGENDA_PAGE_ENABLED === 'true',
        isAdminAgendaConflictsPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_AGENDA_CONFLICTS_PAGE_ENABLED === 'true',
        isAdminBookingsPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_BOOKINGS_PAGE_ENABLED === 'true',
        isAdminFiguresPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_FIGURES_PAGE_ENABLED === 'true',
        isAdminInventoryPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_INVENTORY_PAGE_ENABLED === 'true',
        isAdminMerchPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_MERCH_PAGE_ENABLED === 'true',
        isAdminMerchPosPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_MERCH_POS_PAGE_ENABLED === 'true',
        isAdminPaymentsPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_PAYMENTS_PAGE_ENABLED === 'true',
        isAdminReportsPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_REPORTS_PAGE_ENABLED === 'true',
        isAdminScheduleBuilderPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_SCHEDULE_BUILDER_PAGE_ENABLED === 'true',
        isAdminStudioRentalPageEnabled: isAdminOn && envs.VITE_IS_ADMIN_STUDIO_RENTAL_PAGE_ENABLED === 'true',
      }}
    >
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextState => {
  const context = useContext(FeatureFlagsContext);

  if (!context) {
    throw new Error('useFeatureFlags must be used within FeatureFlagsProvider');
  }

  return context;
};

export const useEnabledFeatureFlag = (featureFlag: FEATURE_FLAG | Array<FEATURE_FLAG>) => {
  const featureFlagsToValidate = Array.isArray(featureFlag) ? featureFlag : [featureFlag];
  const featureFlags = useFeatureFlags();

  if (featureFlagsToValidate.length === 0) return true;

  return featureFlagsToValidate.every(f => featureFlags[f]);
};
