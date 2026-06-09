import i18next from 'i18next';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation } from 'react-router';
import { toast } from 'sonner';

import { FEATURE_FLAG, useEnabledFeatureFlag } from './feature-flags.context';

import {
  DansshipAPI,
  type ForgotPasswordPayload,
  type LoginPayload,
  type RegisterPayload,
  type ResendVerificationPayload,
  type ResetPasswordPayload,
  type UpdateProfilePayload,
  type User,
  type VerifyEmailPayload,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { type PERMISSION } from '@core/permissions';
import { getPendingPlanCheckoutIntent } from '@helpers';
import { useEventListener } from '@hooks';
import { Error404Page, UnauthorizedPage, UnavailablePage } from '@pages';

interface CommonAuthContextState {
  error: string | null;
  login: typeof DansshipAPI.auth.login;
  signUp: typeof DansshipAPI.auth.register;
  updateProfile: typeof DansshipAPI.auth.updateProfile;
  forgotPassword: typeof DansshipAPI.auth.forgotPassword;
  resetPassword: typeof DansshipAPI.auth.resetPassword;
  verifyEmail: typeof DansshipAPI.auth.verifyEmail;
  resendVerification: typeof DansshipAPI.auth.resendVerification;
  getProfile: () => Promise<User | null>;
  logout: () => Promise<void>;
  requireOnboarding: boolean;
}

interface AuthenticatedAuthContextState extends CommonAuthContextState {
  user: User;
  isAuthenticated: true;
}

interface UnAuthenticatedAuthContextState extends CommonAuthContextState {
  user: null;
  isAuthenticated: false;
}

type AuthContextState = AuthenticatedAuthContextState | UnAuthenticatedAuthContextState;

const AuthContext = createContext<AuthContextState | null>(null);

const AUTH_SESSION_KEY = 'auth_session';
const AUTH_TOKEN_KEY = 'auth_token';

const clearSessionArtifacts = () => {
  localStorage.removeItem(AUTH_SESSION_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.clear();

  if (typeof document !== 'undefined' && document.cookie) {
    document.cookie.split(';').forEach(cookie => {
      const cookieName = cookie.split('=')[0]?.trim();

      if (!cookieName) {
        return;
      }

      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  }
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const { t } = useTranslation();
  const [localError, setLocalError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  useEventListener('auth:session-expired' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    setLocalError('Session expired. Please sign in again.');
  });

  useEventListener('auth:logout' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    setLocalError(null);
  });

  useEffect(() => {
    if (localStorage.getItem(AUTH_SESSION_KEY) === '1') {
      void getProfile();

      toast.success('Session detected!');
    }
  }, []);

  async function getProfile() {
    const { data } = await DansshipAPI.auth.getProfile();
    setUser(data);

    return data;
  }

  async function login(payload: LoginPayload) {
    const response = await DansshipAPI.auth.login(payload);

    if (response.data) {
      setLocalError(null);
      localStorage.setItem(AUTH_SESSION_KEY, '1');
      setUser(response.data);
      toast.success(t('auth:loginSuccess'));
    } else {
      setLocalError(t('auth:loginFailed'));
      toast.error(t('auth:loginFailed'));
    }

    return response;
  }

  async function signUp(payload: RegisterPayload) {
    const lang = payload.preferred_language || navigator.language.split('-')[0];

    const response = await DansshipAPI.auth.register({ ...payload, preferred_language: lang });

    if (response.status === 201) {
      setLocalError(null);
      clearSessionArtifacts();
      setUser(null);
      toast.success(t('auth:registerSuccess'));
    } else {
      setLocalError(t('auth:registerFailed'));
      toast.error(t('auth:registerFailed'));
    }

    return response;
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    const response = await DansshipAPI.auth.updateProfile(payload);

    if (response.data) {
      setLocalError(null);
      setUser(response.data);
      toast.success(t('auth:profileUpdateSuccess'));
    } else {
      setLocalError(t('auth:profileUpdateFailed'));
      toast.error(t('auth:profileUpdateFailed'));
    }

    return response;
  }

  async function logout() {
    try {
      await DansshipAPI.auth.logout();
    } finally {
      window.dispatchEvent(new CustomEvent('auth:logout'));
      toast.success(t('auth:logoutSuccess'));
    }
  }

  async function forgotPassword(payload: ForgotPasswordPayload) {
    const response = await DansshipAPI.auth.forgotPassword(payload);

    if (response.status === 200) {
      setLocalError(null);
      toast.success(t('auth:forgotPasswordSuccess'));
    } else {
      setLocalError(t('auth:forgotPasswordFailed'));
      toast.error(t('auth:forgotPasswordFailed'));
    }

    return response;
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    const response = await DansshipAPI.auth.resetPassword(payload);

    if (response.status === 200) {
      setLocalError(null);
      toast.success(t('auth:resetPasswordSuccess'));
    } else {
      setLocalError(t('auth:resetPasswordFailed'));
      toast.error(t('auth:resetPasswordFailed'));
    }

    return response;
  }

  async function verifyEmail(payload: VerifyEmailPayload) {
    const response = await DansshipAPI.auth.verifyEmail(payload);

    if (response.data?.verified) {
      setLocalError(null);
      toast.success(response.data.message);
    } else {
      setLocalError(t('auth:verifyEmail.failed'));
      toast.error(t('auth:verifyEmail.failed'));
    }

    return response;
  }

  async function resendVerification(payload: ResendVerificationPayload) {
    const response = await DansshipAPI.auth.resendVerification(payload);

    if (response.data?.verification_sent) {
      setLocalError(null);
      toast.success(response.data.message);
    } else {
      setLocalError(t('auth.verifyEmail.resendFailed'));
      toast.error(t('auth.verifyEmail.resendFailed'));
    }

    return response;
  }

  useEffect(() => {
    if (!user?.preferredLanguage) {
      return;
    }

    if (i18next.language !== user.preferredLanguage) {
      void i18next.changeLanguage(user.preferredLanguage);
    }

    localStorage.setItem('preferredLanguage', user.preferredLanguage);
  }, [user?.preferredLanguage]);

  return (
    <AuthContext.Provider
      value={{
        ...(user ? { isAuthenticated: true, user } : { isAuthenticated: false, user: null }),
        error: localError,
        login,
        getProfile,
        signUp,
        updateProfile,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        requireOnboarding:
          (user?.requiresOnboarding && user?.onboardingRequired && !user?.onboardingCompleted) ?? false,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextState => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const useAndPermissions = (permissions: Array<PERMISSION>): boolean => {
  const { user, isAuthenticated } = useAuth();

  if (permissions.length === 0) return true;

  if (!isAuthenticated) return false;

  return permissions.every(p => user.permissions.includes(p));
};

export const useOrPermissions = (permissions: Array<PERMISSION>): boolean => {
  const { user, isAuthenticated } = useAuth();

  if (permissions.length === 0) return true;

  if (!isAuthenticated) return false;

  return permissions.some(p => user.permissions.includes(p));
};

interface UsePermissionsParams {
  orPermissions?: Array<PERMISSION>;
  andPermissions?: Array<PERMISSION>;
}

export const usePermissions = ({ orPermissions = [], andPermissions = [] }: UsePermissionsParams) => {
  const validOrPermissions = useOrPermissions(orPermissions);
  const validAndPermissions = useAndPermissions(andPermissions);

  return validOrPermissions && validAndPermissions;
};

interface SecurityGuardOptions {
  orPermissions?: Array<PERMISSION>;
  andPermissions?: Array<PERMISSION>;
  featureFlags?: Array<FEATURE_FLAG>;
  redirect?: string;
  requiresAuth?: boolean;
}

export function SecurityGuard(
  Component: React.ComponentType,
  { orPermissions, andPermissions, featureFlags = [], redirect, requiresAuth }: SecurityGuardOptions = {},
): React.ComponentType {
  function Guard() {
    const { isAuthenticated, requireOnboarding } = useAuth();
    const { pathname } = useLocation();
    const validPermissions = usePermissions({ orPermissions, andPermissions });
    const validFeatureFlags = useEnabledFeatureFlag(featureFlags);

    return useMemo(() => {
      if (requiresAuth && !isAuthenticated) {
        return redirect ? <Navigate to={redirect} /> : <Error404Page />;
      }

      if (!validFeatureFlags) {
        return <UnavailablePage />;
      }

      if (isAuthenticated && !validPermissions) {
        return <UnauthorizedPage />;
      }

      if (isAuthenticated && requireOnboarding && pathname !== PageURLS.onboarding) {
        return <Navigate to={PageURLS.onboarding} replace />;
      }

      if (isAuthenticated && getPendingPlanCheckoutIntent() && pathname !== PageURLS.home) {
        return <Navigate to={PageURLS.home} replace />;
      }

      return <Component />;
    }, [isAuthenticated, pathname, requireOnboarding, validFeatureFlags, validPermissions]);
  }

  return Guard as React.ComponentType;
}
