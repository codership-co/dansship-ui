import i18next from 'i18next';
import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TbFaceIdError } from 'react-icons/tb';
import { toast } from 'sonner';

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
import { type PERMISSION, ROLE } from '@core/permissions';
import { useEventListener } from '@hooks';

interface IAuthContext {
  isAuthenticated: boolean;
  error: string | null;
  user: User | null;
  login: typeof DansshipAPI.auth.login;
  signUp: typeof DansshipAPI.auth.register;
  updateProfile: typeof DansshipAPI.auth.updateProfile;
  forgotPassword: typeof DansshipAPI.auth.forgotPassword;
  resetPassword: typeof DansshipAPI.auth.resetPassword;
  verifyEmail: typeof DansshipAPI.auth.verifyEmail;
  resendVerification: typeof DansshipAPI.auth.resendVerification;
  getProfile: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<IAuthContext | null>(null);

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
  const [isSessionEnabled, setIsSessionEnabled] = useState(() => localStorage.getItem(AUTH_SESSION_KEY) === '1');
  const [user, setUser] = useState<User | null>(null);

  useEventListener('auth:session-expired' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    setIsSessionEnabled(false);
    setLocalError('Session expired. Please sign in again.');
  });

  useEventListener('auth:logout' as keyof WindowEventMap, () => {
    clearSessionArtifacts();
    setIsSessionEnabled(false);
    setLocalError(null);
  });

  async function getProfile() {
    if (isSessionEnabled) {
      const { data } = await DansshipAPI.auth.getProfile();

      if (data) {
        setUser(data);
      }

      return data;
    }

    return null;
  }

  async function login(payload: LoginPayload) {
    const response = await DansshipAPI.auth.login(payload);

    if (response.data) {
      setLocalError(null);
      setIsSessionEnabled(true);
      localStorage.setItem(AUTH_SESSION_KEY, '1');
      setUser(response.data);
      toast.success(t('auth:loginSuccess'));
    } else {
      setLocalError(t('auth:loginFailed'));
      toast.error(t('auth:loginFailed'), {
        icon: <TbFaceIdError />,
      });
    }

    return response;
  }

  async function signUp(payload: RegisterPayload) {
    const lang = payload.preferred_language || navigator.language.split('-')[0];

    const response = await DansshipAPI.auth.register({ ...payload, preferred_language: lang });

    if (response.data) {
      setLocalError(null);
      setIsSessionEnabled(false);
      clearSessionArtifacts();
      setUser(null);
      toast.success(t('auth:registerSuccess'));
    } else {
      setLocalError(t('auth:registerFailed'));
      toast.error(t('auth:registerFailed'), {
        icon: <TbFaceIdError />,
      });
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
        isAuthenticated: Boolean(user),
        error: localError,
        user,
        login,
        getProfile,
        signUp,
        updateProfile,
        logout,
        forgotPassword,
        resetPassword,
        verifyEmail,
        resendVerification,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): IAuthContext => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export const useAndPermissions = (permissions: Array<PERMISSION>): boolean => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return false;

  let havePermissions = true;

  for (const permission of permissions) {
    havePermissions &&= (user.permissions ?? []).includes(permission);
  }

  return havePermissions;
};

export const useOrPermissions = (permissions: Array<PERMISSION>): boolean => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) return false;

  if (permissions.length === 0) return true;

  let havePermissions = false;

  for (const permission of permissions) {
    havePermissions ||= (user.permissions ?? []).includes(permission);
  }

  return havePermissions;
};

export const useUserRoles = () => {
  const { user, isAuthenticated } = useAuth();

  let userRoles = [ROLE.USER];

  if (!isAuthenticated || !user) userRoles = [ROLE.USER];

  if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
    userRoles = user.roles.map((r: string) => r.toLowerCase() as ROLE);
  }

  if (user.isCoach) {
    userRoles = [ROLE.INSTRUCTOR, ROLE.USER];
  }

  return {
    role: userRoles,
    isAdmin: userRoles.includes(ROLE.ADMIN),
    isInstructor: userRoles.includes(ROLE.INSTRUCTOR),
    isCoach: userRoles.includes(ROLE.COACH),
  };
};
