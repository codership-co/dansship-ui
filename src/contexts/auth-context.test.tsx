import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider, SecurityGuard, useAuth, type SessionStatus } from './auth-context';

import {
  DansshipAPI,
  DansshipAPIError,
  DansshipTransportError,
  type DansshipResponseError,
  type User,
} from '@core/api';
import { isSessionExpired, refreshSession, resetSessionCoordinatorForTests } from '@core/api/session-coordinator';
import { AUTH_SESSION_KEY } from '@core/constants';
import '@core/i18n';
import { resetPageLifecycleForTests, startPageLifecycle } from '@core/page-lifecycle';

vi.mock('./feature-flags.context', () => ({
  FEATURE_FLAG: {},
  useEnabledFeatureFlag: () => true,
}));

const staff: User = {
  id: 'staff-1',
  username: 'staff',
  baseProfileRedirect: '/',
  email: 'staff@example.com',
  name: 'Staff',
  isAdmin: false,
  isInstructor: false,
  isCoach: false,
  roles: ['staff'],
  permissions: [],
  requiresOnboarding: false,
  onboardingCompleted: true,
  mustChangePassword: false,
  preferredLanguage: 'es',
  joinDate: '2026-01-01T00:00:00.000Z',
  level: 'Beginner',
};

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
}

async function resume() {
  setVisibility('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
  setVisibility('visible');
  document.dispatchEvent(new Event('visibilitychange'));
  await new Promise(resolve => {
    setTimeout(resolve, 450);
  });
}

function Probe() {
  return <p>profile</p>;
}

const SecureProbe = SecurityGuard(Probe, { requiresAuth: true });

function Watch({ identities }: { identities: Array<User | null> }) {
  const auth = useAuth();

  identities.push(auth.user);

  return (
    <>
      <p>{auth.sessionStatus satisfies SessionStatus}</p>
      <p>{auth.user?.email ?? 'signed-out'}</p>
      <SecureProbe />
    </>
  );
}

describe('AuthProvider resume', () => {
  const identities: Array<User | null> = [];

  beforeEach(() => {
    identities.length = 0;
    localStorage.setItem(AUTH_SESSION_KEY, '1');
    setVisibility('visible');
    startPageLifecycle();
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    resetSessionCoordinatorForTests();
    resetPageLifecycleForTests();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  function renderSession() {
    return render(
      <MemoryRouter>
        <AuthProvider>
          <Watch identities={identities} />
        </AuthProvider>
      </MemoryRouter>,
    );
  }

  it('stays degraded instead of showing a 404 when boot has no network', async () => {
    vi.spyOn(DansshipAPI.auth, 'getProfile').mockRejectedValue(
      new DansshipTransportError('network', 'GET', '/auth/profile', new TypeError('Failed to fetch')),
    );

    renderSession();

    expect(await screen.findByText('No pudimos conectar')).toBeInTheDocument();
    expect(screen.queryByText('Vaya... qué situación tan incómoda')).not.toBeInTheDocument();
    expect(screen.getByText('degraded')).toBeInTheDocument();
  });

  it('keeps the signed-in user when resume hits a transport error', async () => {
    const getProfile = vi.spyOn(DansshipAPI.auth, 'getProfile').mockResolvedValue(staff);

    renderSession();
    expect(await screen.findByText('staff@example.com')).toBeInTheDocument();

    getProfile.mockRejectedValue(
      new DansshipTransportError('network', 'GET', '/auth/profile', new TypeError('Failed to fetch')),
    );
    await resume();

    expect(screen.getByText('staff@example.com')).toBeInTheDocument();
    expect(screen.getByText('authenticated')).toBeInTheDocument();
    expect(screen.queryByText('No pudimos conectar')).not.toBeInTheDocument();
  });

  it('clears the session when a 401 follows a rejected refresh', async () => {
    const getProfile = vi.spyOn(DansshipAPI.auth, 'getProfile').mockResolvedValue(staff);

    renderSession();
    expect(await screen.findByText('staff@example.com')).toBeInTheDocument();

    getProfile.mockRejectedValue(new DansshipAPIError(unauthorizedBody(), 401, 'nope'));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    await refreshSession();
    expect(isSessionExpired()).toBe(true);
    await resume();

    await waitFor(() => {
      expect(screen.getAllByText('Vaya... qué situación tan incómoda').length).toBeGreaterThan(0);
    });
    expect(screen.getByText('anonymous')).toBeInTheDocument();
  });

  it('keeps the same user object when the profile did not change', async () => {
    vi.spyOn(DansshipAPI.auth, 'getProfile').mockResolvedValue(staff);

    renderSession();
    expect(await screen.findByText('staff@example.com')).toBeInTheDocument();
    const before = identities.filter(Boolean).at(-1);

    await resume();
    await waitFor(() => expect(DansshipAPI.auth.getProfile).toHaveBeenCalledTimes(2));

    const after = identities.filter(Boolean).at(-1);

    expect(after).toBe(before);
  });
});

function unauthorizedBody(): DansshipResponseError {
  return {
    category: 'AUTHENTICATION_ERROR',
    error_code: 'UNAUTHORIZED',
    message: 'nope',
    status: 401,
    timestamp: '',
    path: '/auth/profile',
    details: { next_action: '', resend_verification_endpoint: '' },
    request_id: null,
    trace_id: null,
  } as DansshipResponseError;
}
