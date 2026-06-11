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

export const FeatureFlagsProvider = ({ children }: FeatureFlagsProviderProps) => {
  return (
    <FeatureFlagsContext.Provider
      value={{
        // AUTH
        areAuthPagesEnabled: import.meta.env.VITE_ARE_AUTH_PAGES_ENABLED === 'true',
        isLoginPageEnabled: import.meta.env.VITE_IS_LOGIN_PAGE_ENABLED === 'true',
        isSignupPageEnabled: import.meta.env.VITE_IS_SIGNUP_PAGE_ENABLED === 'true',
        isForgotPasswordPageEnabled: import.meta.env.VITE_IS_FORGOT_PASSWORD_PAGE_ENABLED === 'true',
        isResetPasswordPageEnabled: import.meta.env.VITE_IS_RESET_PASSWORD_PAGE_ENABLED === 'true',
        isVerifyEmailPageEnabled: import.meta.env.VITE_IS_VERIFY_EMAIL_PAGE_ENABLED === 'true',
        isOnboardingPageEnabled: import.meta.env.VITE_IS_ONBOARDING_PAGE_ENABLED === 'true',

        // COMMON
        isClassesPageEnabled: import.meta.env.VITE_IS_CLASSES_PAGE_ENABLED === 'true',
        isFigureCompletedPageEnabled: import.meta.env.VITE_IS_FIGURE_COMPLETED_PAGE_ENABLED === 'true',
        isFigureDetailsPageEnabled: import.meta.env.VITE_IS_FIGURE_DETAILS_PAGE_ENABLED === 'true',
        isFigureSavedPageEnabled: import.meta.env.VITE_IS_FIGURE_SAVED_PAGE_ENABLED === 'true',
        isFiguresPageEnabled: import.meta.env.VITE_IS_FIGURES_PAGE_ENABLED === 'true',
        isFiguresDetailsPageEnabled: import.meta.env.VITE_IS_FIGURES_DETAILS_PAGE_ENABLED === 'true',
        isInstructorDashboardPageEnabled: import.meta.env.VITE_IS_INSTRUCTOR_DASHBOARD_PAGE_ENABLED === 'true',
        isMyAccountBookingsPageEnabled: import.meta.env.VITE_IS_MY_ACCOUNT_BOOKINGS_PAGE_ENABLED === 'true',
        isMyAccountSubscriptionPageEnabled: import.meta.env.VITE_IS_MY_ACCOUNT_SUBSCRIPTION_PAGE_ENABLED === 'true',
        isProfilePageEnabled: import.meta.env.VITE_IS_PROFILE_PAGE_ENABLED === 'true',
        isProfileEditPageEnabled: import.meta.env.VITE_IS_PROFILE_EDIT_PAGE_ENABLED === 'true',
        isStudioRentalBrowsePageEnabled: import.meta.env.VITE_IS_STUDIO_RENTAL_BROWSE_PAGE_ENABLED === 'true',
        isStudioRentalRequestsPageEnabled: import.meta.env.VITE_IS_STUDIO_RENTAL_REQUESTS_PAGE_ENABLED === 'true',

        // ADMIN
        areAdminPagesEnabled: import.meta.env.VITE_ARE_ADMIN_PAGES_ENABLED === 'true',
        isAdminAccessPageEnabled: import.meta.env.VITE_IS_ADMIN_ACCESS_PAGE_ENABLED === 'true',
        isAdminPageEnabled: import.meta.env.VITE_IS_ADMIN__PAGE_ENABLED === 'true',
        isAdminAgendaPageEnabled: import.meta.env.VITE_IS_ADMIN_AGENDA_PAGE_ENABLED === 'true',
        isAdminAgendaConflictsPageEnabled: import.meta.env.VITE_IS_ADMIN_AGENDA_CONFLICTS_PAGE_ENABLED === 'true',
        isAdminBookingsPageEnabled: import.meta.env.VITE_IS_ADMIN_BOOKINGS_PAGE_ENABLED === 'true',
        isAdminFiguresPageEnabled: import.meta.env.VITE_IS_ADMIN_FIGURES_PAGE_ENABLED === 'true',
        isAdminInventoryPageEnabled: import.meta.env.VITE_IS_ADMIN_INVENTORY_PAGE_ENABLED === 'true',
        isAdminMerchPageEnabled: import.meta.env.VITE_IS_ADMIN_MERCH_PAGE_ENABLED === 'true',
        isAdminMerchPosPageEnabled: import.meta.env.VITE_IS_ADMIN_MERCH_POS_PAGE_ENABLED === 'true',
        isAdminPaymentsPageEnabled: import.meta.env.VITE_IS_ADMIN_PAYMENTS_PAGE_ENABLED === 'true',
        isAdminReportsPageEnabled: import.meta.env.VITE_IS_ADMIN_REPORTS_PAGE_ENABLED === 'true',
        isAdminScheduleBuilderPageEnabled: import.meta.env.VITE_IS_ADMIN_SCHEDULE_BUILDER_PAGE_ENABLED === 'true',
        isAdminStudioRentalPageEnabled: import.meta.env.VITE_IS_ADMIN_STUDIO_RENTAL_PAGE_ENABLED === 'true',
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
