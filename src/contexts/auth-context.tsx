import i18next from 'i18next';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { FEATURE_FLAG, useEnabledFeatureFlag } from './feature-flags.context';

import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  type ForgotPasswordPayload,
  type LoginPayload,
  type RegisterPayload,
  RegisterResponse,
  type ResendVerificationPayload,
  type ResetPasswordPayload,
  type UpdateProfilePayload,
  type User,
  type VerifyEmailPayload,
  VerifyEmailResponse,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { type PERMISSION } from '@core/permissions';
import { getPendingPlanCheckoutIntent } from '@helpers';
import { useEventListener } from '@hooks';
import { Error404Page, UnauthorizedPage, UnavailablePage } from '@pages';

interface CommonAuthContextState {
  ready: boolean;
  login: (data: LoginPayload) => Promise<void>;
  signUp: (data: RegisterPayload) => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<void>;
  forgotPassword: (data: ForgotPasswordPayload) => Promise<void>;
  resetPassword: (data: ResetPasswordPayload) => Promise<void>;
  verifyEmail: (data: VerifyEmailPayload) => Promise<VerifyEmailResponse | null>;
  resendVerification: (data: ResendVerificationPayload) => Promise<RegisterResponse | null>;
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
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEventListener('auth:session-expired' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    toast.error('Session expired. Please sign in again.');
  });

  useEventListener('auth:logout' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
  });

  useEffect(() => {
    if (localStorage.getItem(AUTH_SESSION_KEY) === '1') {
      getProfile().then(() => {
        setReady(true);
      });
    } else {
      setReady(true);
    }
  }, []);

  async function getProfile() {
    const { data } = await DansshipAPI.auth.getProfile();
    setUser(data);

    return data;
  }

  async function login(payload: LoginPayload) {
    toast.promise(() => DansshipAPI.auth.login(payload), {
      loading: t('common:loading'),
      success: data => {
        setUser(data);
        localStorage.setItem(AUTH_SESSION_KEY, '1');

        return 'auth:loginSuccess';
      },
      error: error => {
        if (error.body.error_code === DANSSHIP_ERROR_CODE.EMAIL_NOT_VERIFIED) {
          navigate(PageURLS.auth.verifyEmail, { replace: true, state: { email: payload.email } });

          return t('auth:emailVerificationNeeded');
        }

        if (error.body.error_code === DANSSHIP_ERROR_CODE.UNAUTHORIZED) {
          return t('auth:unauthorized');
        }

        return t('auth:loginFailed');
      },
    });
  }

  async function signUp(payload: RegisterPayload) {
    const lang = payload.preferred_language || navigator.language.split('-')[0];

    toast.promise(() => DansshipAPI.auth.register({ ...payload, preferred_language: lang }), {
      loading: t('common:loading'),
      success: () => {
        clearSessionArtifacts();
        setUser(null);
        navigate(PageURLS.auth.verifyEmail, {
          state: {
            email: payload.email,
          },
        });

        return t('auth:registerSuccess');
      },
      error: t('auth:registerFailed'),
    });
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    toast.promise(() => DansshipAPI.auth.updateProfile(payload), {
      loading: t('common:loading'),
      success: data => {
        setUser(data);

        return t('auth:profileUpdateSuccess');
      },
      error: t('auth:profileUpdateFailed'),
    });
  }

  async function logout() {
    try {
      await DansshipAPI.auth.logout();
    } finally {
      setUser(null);
      window.dispatchEvent(new CustomEvent('auth:logout'));
      toast.success(t('auth:logoutSuccess'));
    }
  }

  async function forgotPassword(payload: ForgotPasswordPayload) {
    toast.promise(() => DansshipAPI.auth.forgotPassword(payload), {
      loading: t('common:loading'),
      success: t('auth:forgotPasswordSuccess', {
        email: payload.email,
      }),
      error: t('auth:forgotPasswordFailed'),
    });
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    toast.promise(() => DansshipAPI.auth.resetPassword(payload), {
      loading: t('common:loading'),
      success: () => {
        navigate(PageURLS.auth.login);

        return t('auth:resetPasswordSuccess');
      },
      error: t('auth:resetPasswordFailed'),
    });
  }

  async function verifyEmail(payload: VerifyEmailPayload) {
    const data = toast.promise(() => DansshipAPI.auth.verifyEmail(payload), {
      loading: t('common:loading'),
      success: data => data.message,
      error: t('auth:verifyEmail.subtitles.verificationFailed'),
    });

    return data.unwrap();
  }

  async function resendVerification(payload: ResendVerificationPayload) {
    const { data, ok } = await DansshipAPI.auth.resendVerification(payload);

    if (ok && data.verification_sent) {
      toast.success(data.message);
    } else {
      toast.error(
        t('auth:verifyEmail.subtitles.verificationResendFailed', {
          email: payload.email,
        }),
      );
    }

    return data;
  }

  useEffect(() => {
    if (!user?.preferredLanguage) {
      return;
    }

    if (i18next.language !== user.preferredLanguage) {
      void i18next.changeLanguage(user.preferredLanguage);
    }
  }, [user?.preferredLanguage]);

  return (
    <AuthContext.Provider
      value={{
        ...(user ? { isAuthenticated: true, user } : { isAuthenticated: false, user: null }),
        ready,
        login,
        getProfile,
        signUp,
        updateProfile,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
        requireOnboarding: (user?.requiresOnboarding && !user?.onboardingCompleted) ?? false,
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
  requiresNoAuth?: boolean;
}

export function SecurityGuard(
  Component: React.ComponentType,
  {
    orPermissions,
    andPermissions,
    featureFlags = [],
    redirect,
    requiresAuth,
    requiresNoAuth,
  }: SecurityGuardOptions = {},
): React.ComponentType {
  function Guard() {
    const { isAuthenticated, requireOnboarding } = useAuth();
    const location = useLocation();
    const validPermissions = usePermissions({ orPermissions, andPermissions });
    const validFeatureFlags = useEnabledFeatureFlag(featureFlags);

    return useMemo(() => {
      const { pathname } = location;

      if ((requiresAuth && !isAuthenticated) || (requiresNoAuth && isAuthenticated)) {
        return redirect ? <Navigate to={redirect} state={{ from: location }} /> : <Error404Page />;
      }

      if (!validFeatureFlags) {
        return <UnavailablePage />;
      }

      if (isAuthenticated && !validPermissions) {
        return <UnauthorizedPage />;
      }

      if (isAuthenticated && requireOnboarding && pathname !== PageURLS.auth.onboarding) {
        return <Navigate to={PageURLS.auth.onboarding} state={{ from: location }} />;
      }

      if (isAuthenticated && getPendingPlanCheckoutIntent() && pathname !== PageURLS.home) {
        return <Navigate to={PageURLS.home} state={{ from: location }} />;
      }

      return <Component />;
    }, [isAuthenticated, location, requireOnboarding, validFeatureFlags, validPermissions]);
  }

  return Guard as React.ComponentType;
}
