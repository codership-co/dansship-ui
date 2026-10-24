import i18next from 'i18next';
import { Button } from 'polpo/components';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { FEATURE_FLAG, useEnabledFeatureFlag } from './feature-flags.context';

import { RootLoader } from '@components/loaders/root-loader';
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
  type SetPasswordPayload,
  type UpdateProfilePayload,
  type User,
  type VerifyEmailPayload,
  VerifyEmailResponse,
} from '@core/api';
import { beginSessionSettlement, isSessionExpired, resetSessionEpoch } from '@core/api/session-coordinator';
import { AUTH_SESSION_KEY, PageURLS } from '@core/constants';
import { type PERMISSION } from '@core/permissions';
import { addSentryBreadcrumb, clearSentryUser, setSentryUser } from '@core/sentry';
import {
  consumePendingGiftClaimToken,
  getPendingPlanCheckoutIntent,
  getPendingEventoCheckoutIntent,
  isValidReturnPath,
  resolveBrowserPreferredLanguage,
  resolvePostLoginPath,
} from '@helpers';
import { useEventListener, usePageResume } from '@hooks';
import { Error404Page } from '@pages/error/404.page';
import { UnauthorizedPage } from '@pages/error/unauthorized.page';
import { UnavailablePage } from '@pages/error/unavailable.page';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous' | 'degraded';

type ProfileLoad = { status: 'ok'; user: User } | { status: 'unauthenticated' } | { status: 'unavailable' };

function sameUser(current: User | null, next: User) {
  return current !== null && JSON.stringify(current) === JSON.stringify(next);
}

function isUnauthenticated(error: unknown) {
  return error instanceof DansshipAPIError && error.status === 401 && isSessionExpired();
}

interface CommonAuthContextState {
  ready: boolean;
  sessionStatus: SessionStatus;
  pendingPostLoginPath: string | null;
  login: (data: LoginPayload) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  linkGoogle: (credential: string) => Promise<void>;
  setPassword: (data: SetPasswordPayload) => Promise<boolean>;
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
  mustChangePassword: boolean;
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
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('unknown');
  const [user, setUser] = useState<User | null>(null);
  const [pendingPostLoginPath, setPendingPostLoginPath] = useState<string | null>(null);
  const navigate = useNavigate();
  const userRef = useRef<User | null>(null);
  const sessionStatusRef = useRef<SessionStatus>('unknown');
  const profileGeneration = useRef(0);
  const ready = sessionStatus !== 'unknown';

  const setStatus = useCallback((next: SessionStatus) => {
    sessionStatusRef.current = next;
    setSessionStatus(next);
  }, []);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const forgetUser = useCallback(() => {
    userRef.current = null;
    setUser(null);
    setStatus('anonymous');
    clearSentryUser();
  }, [setStatus]);

  useEventListener('auth:session-expired' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    forgetUser();
    addSentryBreadcrumb('auth.session-expired', 'Session expired');
    toast.error(t('auth:sessionExpired'));

    if (location.pathname !== PageURLS.auth.login) {
      navigate(PageURLS.auth.login, { replace: true, state: { from: location } });
    }
  });

  useEventListener('auth:logout' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    forgetUser();
  });

  const loadProfile = useCallback(async (): Promise<ProfileLoad> => {
    const generation = ++profileGeneration.current;

    try {
      const data = await DansshipAPI.auth.getProfile();

      if (generation !== profileGeneration.current) {
        return { status: 'ok', user: data };
      }

      let next = data;

      setUser(current => {
        next = sameUser(current, data) ? current! : data;
        userRef.current = next;

        return next;
      });
      setStatus('authenticated');
      setSentryUser(next);

      return { status: 'ok', user: next };
    } catch (error) {
      if (generation !== profileGeneration.current) {
        return { status: 'unavailable' };
      }

      if (isUnauthenticated(error)) {
        clearSessionArtifacts();
        forgetUser();

        return { status: 'unauthenticated' };
      }

      if (!userRef.current) {
        setStatus('degraded');
      }

      return { status: 'unavailable' };
    }
  }, [forgetUser, setStatus]);

  const getProfile = useCallback(async () => {
    const result = await loadProfile();

    return result.status === 'ok' ? result.user : undefined;
  }, [loadProfile]);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const boot = async (attempt: number) => {
      if (localStorage.getItem(AUTH_SESSION_KEY) !== '1') {
        if (!cancelled) {
          setStatus('anonymous');
        }

        return;
      }

      const result = await loadProfile();

      if (cancelled || result.status !== 'unavailable' || userRef.current) {
        return;
      }

      const delay = Math.min(1000 * 2 ** attempt, 15_000);

      timer = setTimeout(() => {
        void boot(attempt + 1);
      }, delay);
    };

    void boot(0);

    return () => {
      cancelled = true;

      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [loadProfile, setStatus]);

  usePageResume(
    () => {
      if (localStorage.getItem(AUTH_SESSION_KEY) !== '1') {
        beginSessionSettlement(async () => undefined);

        return;
      }

      beginSessionSettlement(async () => {
        await loadProfile();
      });
    },
    { priority: 'session' },
  );

  const fromPath = useMemo(() => {
    const locationState = location.state as { from?: Location } | null;

    if (!locationState?.from) {
      return null;
    }

    return `${locationState.from.pathname}${locationState.from.search ?? ''}${locationState.from.hash ?? ''}`;
  }, [location]);

  useEffect(() => {
    if (!pendingPostLoginPath) {
      return;
    }

    if (location.pathname !== PageURLS.auth.login) {
      setPendingPostLoginPath(null);
    }
  }, [location.pathname, pendingPostLoginPath]);

  async function completeAuthenticatedSession(data: User) {
    resetSessionEpoch();
    localStorage.setItem(AUTH_SESSION_KEY, '1');
    userRef.current = data;
    setUser(data);
    setStatus('authenticated');
    toast.success(t('auth:loginSuccess'));

    const roleHome = await resolvePostLoginPath(data);
    const roles = (data.roles ?? []).map(role => role.toLowerCase());
    const prefersRoleHome = roles.includes('admin') || roles.includes('area_leader') || roles.includes('instructor');
    let redirectPath = roleHome;

    if (!prefersRoleHome) {
      if (isValidReturnPath(fromPath)) {
        redirectPath = fromPath;
      } else {
        const giftToken = consumePendingGiftClaimToken();

        if (giftToken) {
          redirectPath = `${PageURLS.gifts.claim}?token=${encodeURIComponent(giftToken)}`;
        }
      }
    }

    setPendingPostLoginPath(redirectPath);
    const profile = await getProfile();
    setUser(profile ?? data);
    setSentryUser(profile ?? data);
    navigate(redirectPath, { replace: true });
  }

  async function login(payload: LoginPayload) {
    try {
      const data = await DansshipAPI.auth.login(payload);
      await completeAuthenticatedSession(data);
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

        if (error.body.error_code === DANSSHIP_ERROR_CODE.TEMP_PASSWORD_EXPIRED) {
          toast.error(t('auth:tempPasswordExpired'));
        }

        return;
      }

      toast.error(t('auth:loginFailed'));
    }
  }

  async function googleLogin(credential: string) {
    try {
      const data = await DansshipAPI.auth.googleSignIn({ credential });
      await completeAuthenticatedSession(data);
    } catch (error) {
      if (error instanceof DansshipAPIError) {
        if (error.body.error_code === DANSSHIP_ERROR_CODE.GOOGLE_AUTH_NOT_ALLOWED_FOR_ADMIN) {
          toast.error(t('auth:google.adminNotAllowed'));

          return;
        }

        if (error.body.error_code === DANSSHIP_ERROR_CODE.GOOGLE_ACCOUNT_CONFLICT) {
          toast.error(t('auth:google.conflict'));

          return;
        }

        if (error.body.error_code === DANSSHIP_ERROR_CODE.GOOGLE_TOKEN_INVALID) {
          toast.error(t('auth:google.invalidToken'));

          return;
        }

        toast.error(t('auth:google.failed'));

        return;
      }

      toast.error(t('auth:google.failed'));
    }
  }

  async function linkGoogle(credential: string) {
    try {
      const data = await DansshipAPI.auth.linkGoogle({ credential });
      setUser(data);
      toast.success(t('auth:google.linkSuccess'));
    } catch (error) {
      if (error instanceof DansshipAPIError) {
        if (error.body.error_code === DANSSHIP_ERROR_CODE.GOOGLE_AUTH_NOT_ALLOWED_FOR_ADMIN) {
          toast.error(t('auth:google.adminNotAllowed'));

          return;
        }

        if (error.body.error_code === DANSSHIP_ERROR_CODE.GOOGLE_ACCOUNT_CONFLICT) {
          toast.error(t('auth:google.conflict'));

          return;
        }

        toast.error(t('auth:google.linkFailed'));

        return;
      }

      toast.error(t('auth:google.linkFailed'));
    }
  }

  async function setPassword(payload: SetPasswordPayload) {
    try {
      const data = await DansshipAPI.auth.setPassword(payload);
      setUser(data);
      toast.success(t('auth:setPassword.success'));

      return true;
    } catch (error) {
      if (error instanceof DansshipAPIError && error.body.error_code === DANSSHIP_ERROR_CODE.TEMP_PASSWORD_REUSE) {
        toast.error(t('auth:changePassword.reuse'));

        return false;
      }

      toast.error(t('auth:setPassword.failed'));

      return false;
    }
  }

  async function signUp(payload: RegisterPayload) {
    const preferred_language = resolveBrowserPreferredLanguage(payload.preferred_language);

    try {
      await DansshipAPI.auth.register({ ...payload, preferred_language });
      clearSessionArtifacts();
      setUser(null);
      navigate(PageURLS.auth.verifyEmail, {
        state: {
          email: payload.email,
          shouldStartCountDownImmediately: true,
          from: (location.state as { from?: Location } | null)?.from,
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
    } catch (error) {
      if (error instanceof DansshipAPIError) {
        const isOtpInvalid =
          error.body.error_code === DANSSHIP_ERROR_CODE.AUTH_OTP_INVALID || /otp/i.test(error.body.message);

        if (isOtpInvalid) {
          toast.error(t('auth:resetPasswordOtpInvalid'), {
            description: t('auth:resetPasswordOtpInvalidDesc'),
          });

          return;
        }
      }

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
        sessionStatus,
        pendingPostLoginPath,
        login,
        googleLogin,
        linkGoogle,
        setPassword,
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
        mustChangePassword: user?.mustChangePassword ?? false,
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
    return <RootLoader />;
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

function SessionDegradedNotice({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();

  return (
    <main className='grid min-h-dvh place-content-center px-6 text-center'>
      <h1 className='mb-2 text-xl font-bold'>{t('auth:connectionFailed.title')}</h1>
      <p className='mb-6 text-muted-foreground'>{t('auth:connectionFailed.description')}</p>
      <div>
        <Button color='primary' onClick={onRetry}>
          {t('auth:connectionFailed.retry')}
        </Button>
      </div>
    </main>
  );
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
    const { isAuthenticated, requireOnboarding, mustChangePassword, ready, sessionStatus, getProfile } = useAuth();
    const location = useLocation();
    const validPermissions = usePermissions({ orPermissions, andPermissions });
    const validFeatureFlags = useEnabledFeatureFlag(featureFlags);

    return useMemo(() => {
      const { pathname } = location;

      if (!ready && (requiresAuth || requiresNoAuth)) {
        return <RootLoader />;
      }

      if (requiresNoAuth && isAuthenticated) {
        return <AuthenticatedHomeRedirect />;
      }

      if (requiresAuth && sessionStatus === 'degraded' && !isAuthenticated) {
        return <SessionDegradedNotice onRetry={() => void getProfile()} />;
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

      const isChangePassword = pathname === PageURLS.auth.changePassword;

      if (isAuthenticated && mustChangePassword) {
        if (!isChangePassword) {
          return <Navigate to={PageURLS.auth.changePassword} state={{ from: location }} />;
        }

        return <Component />;
      }

      if (
        isAuthenticated &&
        requireOnboarding &&
        !isChangePassword &&
        pathname !== PageURLS.auth.onboarding &&
        pathname !== PageURLS.auth.verifyInstructor
      ) {
        return <Navigate to={PageURLS.auth.onboarding} state={{ from: location }} />;
      }

      const pendingEventoSlug = getPendingEventoCheckoutIntent();

      if (isAuthenticated && pendingEventoSlug && pathname !== PageURLS.eventoLanding(pendingEventoSlug)) {
        return <Navigate to={PageURLS.eventoLanding(pendingEventoSlug)} state={{ from: location }} />;
      }

      if (isAuthenticated && getPendingPlanCheckoutIntent() && pathname !== PageURLS.plans) {
        return <Navigate to={PageURLS.plans} state={{ from: location }} />;
      }

      return <Component />;
      // Depend on pathname only so ?tab= / search updates do not remount page trees.
      // eslint-disable-next-line react-hooks/exhaustive-deps -- location used for Navigate state; pathname drives remounts
    }, [
      getProfile,
      isAuthenticated,
      location.pathname,
      mustChangePassword,
      ready,
      sessionStatus,
      requireOnboarding,
      validFeatureFlags,
      validPermissions,
    ]);
  }

  return Guard as React.ComponentType;
}
