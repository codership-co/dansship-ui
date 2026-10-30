export type RefreshOutcome = 'refreshed' | 'expired' | 'unavailable';

const REFRESH_TIMEOUT_MS = 10_000;
const SESSION_EXPIRED_EVENT = 'auth:session-expired';
const SESSION_LOGOUT_EVENT = 'auth:logout';

let inFlight: Promise<RefreshOutcome> | null = null;
let expiredLatched = false;
let settlement: Promise<void> = Promise.resolve();
let logoutListenerBound = false;

function refreshUrl() {
  const base = import.meta.env.VITE_DANSSHIP_API_URL ?? '';

  return `${base}/auth/refresh-token`;
}

function dispatchSessionExpired() {
  if (expiredLatched || typeof window === 'undefined') {
    expiredLatched = true;

    return;
  }

  expiredLatched = true;
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
}

function bindLogoutReset() {
  if (logoutListenerBound || typeof window === 'undefined') {
    return;
  }

  logoutListenerBound = true;
  window.addEventListener(SESSION_LOGOUT_EVENT, () => {
    resetSessionEpoch();
  });
}

export function resetSessionEpoch() {
  expiredLatched = false;
}

export function isSessionExpired() {
  return expiredLatched;
}

export function beginSessionSettlement(task: () => Promise<void>) {
  const run = task().catch(() => undefined);

  settlement = Promise.all([settlement, run]).then(() => undefined);
}

export function whenSessionSettled() {
  const pendingRefresh = inFlight?.then(() => undefined) ?? Promise.resolve();

  return Promise.all([settlement, pendingRefresh]).then(() => undefined);
}

async function runRefresh(): Promise<RefreshOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new DOMException('The operation timed out', 'TimeoutError'));
  }, REFRESH_TIMEOUT_MS);

  try {
    const response = await fetch(refreshUrl(), {
      method: 'POST',
      credentials: 'include',
      headers: { accept: 'application/json' },
      signal: controller.signal,
    });

    await response.text().catch(() => undefined);

    /*
     * 401 is a dead session. 403 is a session the server will not renew
     * (a managed account). Other failures stay retryable.
     */
    if (response.status === 401 || response.status === 403) {
      dispatchSessionExpired();

      return 'expired';
    }

    if (!response.ok) {
      return 'unavailable';
    }

    return 'refreshed';
  } catch {
    return 'unavailable';
  } finally {
    clearTimeout(timer);
  }
}

export function refreshSession(): Promise<RefreshOutcome> {
  bindLogoutReset();

  if (expiredLatched) {
    return Promise.resolve('expired');
  }

  if (!inFlight) {
    inFlight = runRefresh().finally(() => {
      inFlight = null;
    });
  }

  return inFlight;
}

export function resetSessionCoordinatorForTests() {
  inFlight = null;
  expiredLatched = false;
  settlement = Promise.resolve();
}
