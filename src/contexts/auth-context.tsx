import i18next from 'i18next';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { FEATURE_FLAG, useEnabledFeatureFlag } from './feature-flags.context';

import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
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
import { AUTH_SESSION_KEY, PageURLS } from '@core/constants';
import { type PERMISSION } from '@core/permissions';
import { addSentryBreadcrumb, clearSentryUser, setSentryUser } from '@core/sentry';
import { getPendingPlanCheckoutIntent, isValidReturnPath, resolvePostLoginPath } from '@helpers';
import { useEventListener } from '@hooks';
import { Error404Page, UnauthorizedPage, UnavailablePage } from '@pages';

interface CommonAuthContextState {
  ready: boolean;
  pendingPostLoginPath: string | null;
  login: (data: LoginPayload) => Promise<void>;
  signUp: (data: RegisterPayload) => Promise<void>;
  updateProfile: (data: UpdateProfilePayload) => Promise<void>;
  uploadProfilePhoto: (file: File) => Promise<User | undefined>;
  forgotPassword: (data: ForgotPasswordPayload) => Promise<void>;
  resetPassword: (data: ResetPasswordPayload) => Promise<void>;
  verifyEmail: (data: VerifyEmailPayload) => Promise<VerifyEmailResponse | undefined>;
  resendVerification: (data: ResendVerificationPayload) => Promise<RegisterResponse | undefined>;
  getProfile: () => Promise<User | undefined>;
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

const clearSessionArtifacts = () => {
  localStorage.clear();
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
  const location = useLocation();
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [pendingPostLoginPath, setPendingPostLoginPath] = useState<string | null>(null);
  const navigate = useNavigate();

  useEventListener('auth:session-expired' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    setUser(null);
    clearSentryUser();
    addSentryBreadcrumb('auth.session-expired', 'Session expired');
    toast.error(t('auth:sessionExpired'));

    if (location.pathname !== PageURLS.auth.login) {
      navigate(PageURLS.auth.login, { replace: true, state: { from: location } });
    }
  });

  useEventListener('auth:logout' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    setUser(null);
    clearSentryUser();
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

  const fromPath = useMemo(() => {
    const locationState = location.state as { from?: Location } | null;

    if (!locationState?.from) {
      return null;
    }

    return `${locationState.from.pathname}${locationState.from.search ?? ''}${locationState.from.hash ?? ''}`;
  }, [location]);

  async function getProfile() {
    try {
      const data = await DansshipAPI.auth.getProfile();
      setUser(data);
      setSentryUser(data);

      return data;
    } catch {
      setUser(null);
      clearSentryUser();
    }
  }

  useEffect(() => {
    if (!pendingPostLoginPath) {
      return;
    }

    if (location.pathname !== PageURLS.auth.login) {
      setPendingPostLoginPath(null);
    }
  }, [location.pathname, pendingPostLoginPath]);

  async function login(payload: LoginPayload) {
    try {
      const data = await DansshipAPI.auth.login(payload);
      localStorage.setItem(AUTH_SESSION_KEY, '1');
      toast.success(t('auth:loginSuccess'));

      const roleHome = await resolvePostLoginPath(data);
      const roles = (data.roles ?? []).map(role => role.toLowerCase());
      const prefersRoleHome = roles.includes('admin') || roles.includes('instructor');
      const redirectPath = !prefersRoleHome && isValidReturnPath(fromPath) ? fromPath : roleHome;

      setPendingPostLoginPath(redirectPath);
      setUser(data);
      setSentryUser(data);
      navigate(redirectPath, { replace: true });
    } catch (error) {
      if (error instanceof DansshipAPIError) {
        if (error.body.error_code === DANSSHIP_ERROR_CODE.EMAIL_NOT_VERIFIED) {
          navigate(PageURLS.auth.verifyEmail, {
            replace: true,
            state: {
              email: payload.email,
              shouldResendVerificationImmediately: true,
            },
          });

          toast.info(t('auth:emailVerificationNeeded'));
        }

        if (error.body.error_code === DANSSHIP_ERROR_CODE.UNAUTHORIZED) {
          toast.error(t('auth:unauthorized'));
        }

        return;
      }

      toast.error(t('auth:loginFailed'));
    }
  }

  async function signUp(payload: RegisterPayload) {
    const lang = payload.preferred_language || navigator.language.split('-')[0];

    try {
      await DansshipAPI.auth.register({ ...payload, preferred_language: lang });
      clearSessionArtifacts();
      setUser(null);
      navigate(PageURLS.auth.verifyEmail, {
        state: {
          email: payload.email,
          shouldStartCountDownImmediately: true,
        },
      });

      toast.success(t('auth:registerSuccess'));
    } catch (error) {
      if (error instanceof DansshipAPIError) {
        if (error.body.error_code === DANSSHIP_ERROR_CODE.BAD_REQUEST) {
          toast.error(t('auth:signUpBadRequest'), {
            description: t('auth:signUpBadRequestDescription'),
          });
        }

        return;
      }

      toast.error(t('auth:registerFailed'));
    }
  }

  async function updateProfile(payload: UpdateProfilePayload) {
    try {
      const data = await DansshipAPI.auth.updateProfile(payload);
      toast.success(t('auth:profileUpdateSuccess'));
      setUser(data);
    } catch {
      toast.error(t('auth:profileUpdateFailed'));
    }
  }

  async function uploadProfilePhoto(file: File) {
    try {
      const data = await DansshipAPI.auth.uploadProfilePhoto(file);
      setUser(data);
      toast.success(t('auth:profilePhotoUpdateSuccess'));

      return data;
    } catch {
      toast.error(t('auth:profilePhotoUpdateFailed'));
    }
  }

  async function logout() {
    try {
      await DansshipAPI.auth.logout();
    } finally {
      setUser(null);
      clearSentryUser();
      window.dispatchEvent(new CustomEvent('auth:logout'));
      toast.success(t('auth:logoutSuccess'));
    }
  }

  async function forgotPassword(payload: ForgotPasswordPayload) {
    try {
      await DansshipAPI.auth.forgotPassword(payload);
      t('auth:forgotPasswordSuccess', {
        email: payload.email,
      });

      if (location.pathname === PageURLS.auth.forgotPassword) {
        navigate(PageURLS.auth.resetPassword, { state: { email: payload.email } });
      }
    } catch {
      t('auth:forgotPasswordFailed');
    }
  }

  async function resetPassword(payload: ResetPasswordPayload) {
    try {
      await DansshipAPI.auth.resetPassword(payload);
      toast.success(t('auth:resetPasswordSuccess'));
      navigate(PageURLS.auth.login);
    } catch {
      toast.error(t('auth:resetPasswordFailed'));
    }
  }

  async function verifyEmail(payload: VerifyEmailPayload) {
    try {
      const data = await DansshipAPI.auth.verifyEmail(payload);
      toast.success(t('auth:verifyEmail.titles.verified'), {
        description: t('auth:verifyEmail.subtitles.verified'),
      });

      return data;
    } catch {
      toast.error(t('auth:verifyEmail.titles.verificationFailed'), {
        description: t('auth:verifyEmail.subtitles.verificationFailed'),
      });
    }
  }

  async function resendVerification(payload: ResendVerificationPayload) {
    try {
      const data = await DansshipAPI.auth.resendVerification(payload);

      if (data.verification_sent) {
        toast.success(t('auth:verifyEmail.titles.verificationResended'), {
          description: t('auth:verifyEmail.subtitles.verificationResended'),
        });
      }

      return data;
    } catch (error) {
      if (error instanceof DansshipAPIError) {
        if (error.body.error_code === DANSSHIP_ERROR_CODE.TOO_MANY_REQUESTS) {
          toast.error(t('auth:resendVerificationManyRequests'), {
            description: t('auth:resendVerificationManyRequestsDescription', {
              email: payload.email,
            }),
          });
        }

        return;
      }

      toast.error(
        t('auth:verifyEmail.titles.verificationResendFailed', {
          email: payload.email,
        }),
        {
          description: t('auth:verifyEmail.subtitles.verificationResendFailed'),
        },
      );
    }
  }

  useEffect(() => {
    if (user) {
      setSentryUser(user);
    } else {
      clearSentryUser();
    }
  }, [user]);

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
        pendingPostLoginPath,
        login,
        getProfile,
        signUp,
        updateProfile,
        uploadProfilePhoto,
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

function AuthenticatedHomeRedirect() {
  const { user, pendingPostLoginPath } = useAuth();
  const [path, setPath] = useState<string | null>(pendingPostLoginPath);

  useEffect(() => {
    if (pendingPostLoginPath) {
      setPath(pendingPostLoginPath);

      return;
    }

    if (!user) {
      return;
    }

    let cancelled = false;

    void resolvePostLoginPath(user).then(resolved => {
      if (!cancelled) {
        setPath(resolved);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [user, pendingPostLoginPath]);

  if (!path) {
    return null;
  }

  return <Navigate to={path} replace />;
}

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

      if (requiresNoAuth && isAuthenticated) {
        return <AuthenticatedHomeRedirect />;
      }

      if (requiresAuth && !isAuthenticated) {
        return redirect ? <Navigate to={redirect} state={{ from: location }} /> : <Error404Page />;
      }

      if (!validFeatureFlags) {
        return <UnavailablePage />;
      }

      if (isAuthenticated && !validPermissions) {
        return <UnauthorizedPage />;
      }

      if (
        isAuthenticated &&
        requireOnboarding &&
        pathname !== PageURLS.auth.onboarding &&
        pathname !== PageURLS.auth.verifyInstructor
      ) {
        return <Navigate to={PageURLS.auth.onboarding} state={{ from: location }} />;
      }

      if (isAuthenticated && getPendingPlanCheckoutIntent() && pathname !== PageURLS.plans) {
        return <Navigate to={PageURLS.plans} state={{ from: location }} />;
      }

      return <Component />;
    }, [isAuthenticated, location, requireOnboarding, validFeatureFlags, validPermissions]);
  }

  return Guard as React.ComponentType;
}
