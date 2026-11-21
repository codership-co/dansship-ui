import { useOnlineStatus } from 'polpo/hooks';
import { useCallback, useEffect, useRef, useState } from 'react';

import { clockSkewMs, entryErrorCode, TERMINAL_ENTRY_ERRORS, type EntryPass } from '@core/api';

interface EntryCodeResponse {
  ok: boolean;
  data?: EntryPass | null;
  error?: unknown;
}

export interface EntryCodeState {
  pass: EntryPass | null;
  skewMs: number;
  errorCode: string | null;
  isLoading: boolean;
  isOnline: boolean;
  /** The last refresh failed: the code on screen may already be expired. */
  isStale: boolean;
}

const RETRY_MS = 10_000;
const AFTER_ROTATION_MS = 400;
const RETRY_AFTER_FAILURE_MS = 3_000;

/** Next poll: right after the code rotates, and at least every `refresh_seconds`. */
export function nextPollDelay(pass: EntryPass | null, nowMs: number, skewMs: number): number {
  if (!pass?.refresh_at) {
    return RETRY_MS;
  }

  const untilRotation = new Date(pass.refresh_at).getTime() - (nowMs - skewMs) + AFTER_ROTATION_MS;
  const every = (pass.refresh_seconds ?? 10) * 1000;

  return Math.max(1_000, Math.min(every, untilRotation));
}

/**
 * Polls the rotating code. The server issues every code, so the phone's clock never matters;
 * offline it keeps the last pass (dimmed by the screen) and resumes when the connection is back.
 */
export function useEntryCode(load: () => Promise<EntryCodeResponse>, key: string): EntryCodeState {
  const isOnline = useOnlineStatus();
  const loadRef = useRef(load);
  const [state, setState] = useState<Omit<EntryCodeState, 'isOnline'>>({
    pass: null,
    skewMs: 0,
    errorCode: null,
    isLoading: true,
    isStale: false,
  });

  useEffect(() => {
    loadRef.current = load;
  }, [load]);

  const fetchOnce = useCallback(async () => {
    const response = await loadRef.current();
    const receivedAt = Date.now();

    if (response.ok && response.data) {
      const pass = response.data;
      const skewMs = clockSkewMs(pass.server_time, receivedAt);

      setState({ pass, skewMs, errorCode: null, isLoading: false, isStale: false });

      return { pass, skewMs, terminal: false };
    }

    const code = entryErrorCode(response.error);
    const terminal = code !== null && TERMINAL_ENTRY_ERRORS.has(code);

    setState(previous => ({
      ...previous,
      errorCode: code,
      isLoading: false,
      isStale: !terminal,
      pass: terminal ? null : previous.pass,
    }));

    return { pass: null, skewMs: 0, terminal };
  }, []);

  useEffect(() => {
    if (!isOnline) {
      return undefined;
    }

    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      const result = await fetchOnce();

      if (cancelled || result.terminal) {
        return;
      }

      const delay = result.pass ? nextPollDelay(result.pass, Date.now(), result.skewMs) : RETRY_AFTER_FAILURE_MS;

      timer = window.setTimeout(() => void tick(), delay);
    };

    void tick();

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [fetchOnce, isOnline, key]);

  return { ...state, isOnline };
}
