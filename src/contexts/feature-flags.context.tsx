import { createContext, useContext } from 'react';

export enum FEATURE_FLAG {
  isFiguresPageEnabled = 'isFiguresPageEnabled',
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
        isFiguresPageEnabled: import.meta.env.VITE_IS_FIGURES_PAGE_ENABLED === 'true',
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
