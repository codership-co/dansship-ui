import { createContext, useContext } from 'react';

export enum FEATURE_FLAG {
  // AUTH
  areAuthPagesEnabled = 'areAuthPagesEnabled',

  // ADMIN
  areAdminPagesEnabled = 'areAdminPagesEnabled',

  // USER
  areUserPagesEnabled = 'areUserPagesEnabled',
  isClassesPageEnabled = 'isClassesPageEnabled',
  isFigureCompletedPageEnabled = 'isFigureCompletedPageEnabled',
  isPaymentsResultsPageEnabled = 'isPaymentsResultsPageEnabled',
  isFigureSavedPageEnabled = 'isFigureSavedPageEnabled',
  isFiguresPageEnabled = 'isFiguresPageEnabled',
  isFiguresDetailsPageEnabled = 'isFiguresDetailsPageEnabled',
  isMyAccountBookingsPageEnabled = 'isMyAccountBookingsPageEnabled',
  isMyAccountSubscriptionPageEnabled = 'isMyAccountSubscriptionPageEnabled',
  isProfilePageEnabled = 'isProfilePageEnabled',
  isProfileEditPageEnabled = 'isProfileEditPageEnabled',
  isStudioRentalBrowsePageEnabled = 'isStudioRentalBrowsePageEnabled',
  isStudioRentalRequestsPageEnabled = 'isStudioRentalRequestsPageEnabled',
}

interface UserPages {
  isClassesPageEnabled: boolean | string;
  isFigureCompletedPageEnabled: boolean | string;
  isPaymentsResultsPageEnabled: boolean | string;
  isFigureSavedPageEnabled: boolean | string;
  isFiguresPageEnabled: boolean | string;
  isFiguresDetailsPageEnabled: boolean | string;
  isMyAccountBookingsPageEnabled: boolean | string;
  isMyAccountSubscriptionPageEnabled: boolean | string;
  isProfilePageEnabled: boolean | string;
  isProfileEditPageEnabled: boolean | string;
  isStudioRentalBrowsePageEnabled: boolean | string;
  isStudioRentalRequestsPageEnabled: boolean | string;
}

interface FeatureFlagsContextState extends UserPages {
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
  const isAdminOn = envs.VITE_ARE_ADMIN_PAGES_ENABLED === 'true';
  const isUserOn = envs.VITE_ARE_USER_PAGES_ENABLED === 'true';
  const userPages = JSON.parse(envs.VITE_USER_PAGES) as UserPages;

  return (
    <FeatureFlagsContext.Provider
      value={{
        // AUTH
        areAuthPagesEnabled: isAuthOn,

        // ADMIN
        areAdminPagesEnabled: isAdminOn,

        // USER
        areUserPagesEnabled: isUserOn,
        isClassesPageEnabled: isUserOn && userPages.isClassesPageEnabled === true,
        isFigureCompletedPageEnabled: isUserOn && userPages.isFigureCompletedPageEnabled === true,
        isPaymentsResultsPageEnabled: isUserOn && userPages.isPaymentsResultsPageEnabled === true,
        isFigureSavedPageEnabled: isUserOn && userPages.isFigureSavedPageEnabled === true,
        isFiguresPageEnabled: isUserOn && userPages.isFiguresPageEnabled === true,
        isFiguresDetailsPageEnabled: isUserOn && userPages.isFiguresDetailsPageEnabled === true,
        isMyAccountBookingsPageEnabled: isUserOn && userPages.isMyAccountBookingsPageEnabled === true,
        isMyAccountSubscriptionPageEnabled: isUserOn && userPages.isMyAccountSubscriptionPageEnabled === true,
        isProfilePageEnabled: isUserOn && userPages.isProfilePageEnabled === true,
        isProfileEditPageEnabled: isUserOn && userPages.isProfileEditPageEnabled === true,
        isStudioRentalBrowsePageEnabled: isUserOn && userPages.isStudioRentalBrowsePageEnabled === true,
        isStudioRentalRequestsPageEnabled: isUserOn && userPages.isStudioRentalRequestsPageEnabled === true,
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
