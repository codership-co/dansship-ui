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

  // USER
  areUserPagesEnabled = 'areUserPagesEnabled',
  isClassesPageEnabled = 'isClassesPageEnabled',
  isFigureCompletedPageEnabled = 'isFigureCompletedPageEnabled',
  isPaymentsResultsPageEnabled = 'isPaymentsResultsPageEnabled',
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

interface UserPages {
  isClassesPageEnabled: boolean | string;
  isFigureCompletedPageEnabled: boolean | string;
  isPaymentsResultsPageEnabled: boolean | string;
  isFigureSavedPageEnabled: boolean | string;
  isFiguresPageEnabled: boolean | string;
  isFiguresDetailsPageEnabled: boolean | string;
  isInstructorDashboardPageEnabled: boolean | string;
  isMyAccountBookingsPageEnabled: boolean | string;
  isMyAccountSubscriptionPageEnabled: boolean | string;
  isProfilePageEnabled: boolean | string;
  isProfileEditPageEnabled: boolean | string;
  isStudioRentalBrowsePageEnabled: boolean | string;
  isStudioRentalRequestsPageEnabled: boolean | string;
}

interface AdminPages {
  isAdminAccessPageEnabled: boolean | string;
  isAdminPageEnabled: boolean | string;
  isAdminAgendaPageEnabled: boolean | string;
  isAdminAgendaConflictsPageEnabled: boolean | string;
  isAdminBookingsPageEnabled: boolean | string;
  isAdminFiguresPageEnabled: boolean | string;
  isAdminInventoryPageEnabled: boolean | string;
  isAdminMerchPageEnabled: boolean | string;
  isAdminMerchPosPageEnabled: boolean | string;
  isAdminPaymentsPageEnabled: boolean | string;
  isAdminReportsPageEnabled: boolean | string;
  isAdminScheduleBuilderPageEnabled: boolean | string;
  isAdminStudioRentalPageEnabled: boolean | string;
}

interface AuthPages {
  isLoginPageEnabled: boolean | string;
  isSignupPageEnabled: boolean | string;
  isForgotPasswordPageEnabled: boolean | string;
  isResetPasswordPageEnabled: boolean | string;
  isVerifyEmailPageEnabled: boolean | string;
  isOnboardingPageEnabled: boolean | string;
}

interface FeatureFlagsContextState extends UserPages, AdminPages, AuthPages {
  areUserPagesEnabled: boolean;
  areAuthPagesEnabled: boolean;
  areAdminPagesEnabled: boolean;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextState | null>(null);

interface FeatureFlagsProviderProps {
  children: React.ReactNode;
}

const envs = import.meta.env;

export const FeatureFlagsProvider = ({ children }: FeatureFlagsProviderProps) => {
  const isAuthOn = envs.VITE_ARE_AUTH_PAGES_ENABLED === 'true';
  const authPages = JSON.parse(envs.VITE_AUTH_PAGES) as AuthPages;

  const isAdminOn = envs.VITE_ARE_ADMIN_PAGES_ENABLED === 'true';
  const adminPages = JSON.parse(envs.VITE_ADMIN_PAGES) as AdminPages;

  const isUserOn = envs.VITE_ARE_USER_PAGES_ENABLED === 'true';
  const userPages = JSON.parse(envs.VITE_USER_PAGES) as UserPages;

  return (
    <FeatureFlagsContext.Provider
      value={{
        // AUTH
        areAuthPagesEnabled: isAuthOn,
        isLoginPageEnabled: isAuthOn && authPages.isLoginPageEnabled === true,
        isSignupPageEnabled: isAuthOn && authPages.isSignupPageEnabled === true,
        isForgotPasswordPageEnabled: isAuthOn && authPages.isForgotPasswordPageEnabled === true,
        isResetPasswordPageEnabled: isAuthOn && authPages.isResetPasswordPageEnabled === true,
        isVerifyEmailPageEnabled: isAuthOn && authPages.isVerifyEmailPageEnabled === true,
        isOnboardingPageEnabled: isAuthOn && authPages.isOnboardingPageEnabled === true,

        // USER
        areUserPagesEnabled: isUserOn,
        isClassesPageEnabled: isUserOn && userPages.isClassesPageEnabled === true,
        isFigureCompletedPageEnabled: isUserOn && userPages.isFigureCompletedPageEnabled === true,
        isPaymentsResultsPageEnabled: isUserOn && userPages.isPaymentsResultsPageEnabled === true,
        isFigureSavedPageEnabled: isUserOn && userPages.isFigureSavedPageEnabled === true,
        isFiguresPageEnabled: isUserOn && userPages.isFiguresPageEnabled === true,
        isFiguresDetailsPageEnabled: isUserOn && userPages.isFiguresDetailsPageEnabled === true,
        isInstructorDashboardPageEnabled: isUserOn && userPages.isInstructorDashboardPageEnabled === true,
        isMyAccountBookingsPageEnabled: isUserOn && userPages.isMyAccountBookingsPageEnabled === true,
        isMyAccountSubscriptionPageEnabled: isUserOn && userPages.isMyAccountSubscriptionPageEnabled === true,
        isProfilePageEnabled: isUserOn && userPages.isProfilePageEnabled === true,
        isProfileEditPageEnabled: isUserOn && userPages.isProfileEditPageEnabled === true,
        isStudioRentalBrowsePageEnabled: isUserOn && userPages.isStudioRentalBrowsePageEnabled === true,
        isStudioRentalRequestsPageEnabled: isUserOn && userPages.isStudioRentalRequestsPageEnabled === true,

        // ADMIN
        areAdminPagesEnabled: isAdminOn,
        isAdminAccessPageEnabled: isAdminOn && adminPages.isAdminAccessPageEnabled === true,
        isAdminPageEnabled: isAdminOn && adminPages.isAdminPageEnabled === true,
        isAdminAgendaPageEnabled: isAdminOn && adminPages.isAdminAgendaPageEnabled === true,
        isAdminAgendaConflictsPageEnabled: isAdminOn && adminPages.isAdminAgendaConflictsPageEnabled === true,
        isAdminBookingsPageEnabled: isAdminOn && adminPages.isAdminBookingsPageEnabled === true,
        isAdminFiguresPageEnabled: isAdminOn && adminPages.isAdminFiguresPageEnabled === true,
        isAdminInventoryPageEnabled: isAdminOn && adminPages.isAdminInventoryPageEnabled === true,
        isAdminMerchPageEnabled: isAdminOn && adminPages.isAdminMerchPageEnabled === true,
        isAdminMerchPosPageEnabled: isAdminOn && adminPages.isAdminMerchPosPageEnabled === true,
        isAdminPaymentsPageEnabled: isAdminOn && adminPages.isAdminPaymentsPageEnabled === true,
        isAdminReportsPageEnabled: isAdminOn && adminPages.isAdminReportsPageEnabled === true,
        isAdminScheduleBuilderPageEnabled: isAdminOn && adminPages.isAdminScheduleBuilderPageEnabled === true,
        isAdminStudioRentalPageEnabled: isAdminOn && adminPages.isAdminStudioRentalPageEnabled === true,
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
