import { useEffect, useRef } from 'react';
import { useRevalidator, useSearchParams } from 'react-router';

const STORAGE_PREFIX = 'dansship.meta-purchase.';
const BOLD_POLL_INTERVAL_MS = 2_000;
const BOLD_POLL_DEADLINE_MS = 30_000;

const APPROVED = 'approved';
const PENDING = 'pending';

export interface MetaPurchase {
  intentId: string;
  status: string;
  amount: number;
  walletAmountApplied?: number;
  currency: string;
}

function storageKey(intentId: string) {
  return `${STORAGE_PREFIX}${intentId}`;
}

function wasTracked(intentId: string) {
  const key = storageKey(intentId);

  try {
    if (window.sessionStorage.getItem(key) === '1') {
      return true;
    }
  } catch {
    // Storage can be blocked; the other store may still have the mark.
  }

  try {
    return window.localStorage.getItem(key) === '1';
  } catch {
    return false;
  }
}

function rememberTracked(intentId: string) {
  const key = storageKey(intentId);

  try {
    window.sessionStorage.setItem(key, '1');
  } catch {
    // Logout clears sessionStorage. localStorage is the backup.
  }

  try {
    window.localStorage.setItem(key, '1');
  } catch {
    // Ignore quota and private-mode failures.
  }
}

function purchaseValue(amount: number, walletAmountApplied: number) {
  const charged = Number(amount);
  const wallet = Number(walletAmountApplied);

  if (!Number.isFinite(charged) || !Number.isFinite(wallet)) {
    return null;
  }

  const value = charged + wallet;

  if (!Number.isFinite(value) || value <= 0) {
    return null;
  }

  return value;
}

function clearPurchaseVisitParams() {
  const url = new URL(window.location.href);
  const before = url.search;

  url.searchParams.delete('checkout');
  url.searchParams.delete('bold-order-id');
  url.searchParams.delete('bold-tx-status');

  if (url.search === before) {
    return;
  }

  window.history.replaceState(window.history.state, '', `${url.pathname}${url.search}${url.hash}`);
}

export function trackMetaPurchase(input: Omit<MetaPurchase, 'status'>) {
  const intentId = input.intentId.trim();
  const currency = input.currency.trim().toUpperCase();
  const value = purchaseValue(input.amount, input.walletAmountApplied ?? 0);

  if (!intentId || !/^[A-Z]{3}$/.test(currency) || value === null || wasTracked(intentId)) {
    return false;
  }

  if (typeof window.fbq !== 'function') {
    return false;
  }

  rememberTracked(intentId);
  window.fbq('track', 'Purchase', { value, currency }, { eventID: intentId });
  clearPurchaseVisitParams();

  return true;
}

export function useMetaPixelPurchase(purchase: MetaPurchase | null) {
  const [searchParams] = useSearchParams();
  const { revalidate } = useRevalidator();
  const revalidateRef = useRef(revalidate);

  revalidateRef.current = revalidate;

  const isCheckoutVisit = searchParams.get('checkout') === '1';
  const isBoldReturn = searchParams.has('bold-order-id');
  const shouldTrack = isCheckoutVisit || isBoldReturn;
  const intentId = purchase?.intentId ?? '';
  const status = purchase?.status ?? '';
  const amount = purchase?.amount ?? 0;
  const walletAmountApplied = purchase?.walletAmountApplied ?? 0;
  const currency = purchase?.currency ?? '';

  useEffect(() => {
    if (!shouldTrack || status !== APPROVED || !intentId) {
      return;
    }

    trackMetaPurchase({
      intentId,
      amount,
      walletAmountApplied,
      currency,
    });
  }, [shouldTrack, status, intentId, amount, walletAmountApplied, currency]);

  useEffect(() => {
    if (!isBoldReturn || status !== PENDING || !intentId) {
      return;
    }

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      if (Date.now() - startedAt >= BOLD_POLL_DEADLINE_MS) {
        window.clearInterval(timer);

        return;
      }

      revalidateRef.current();
    }, BOLD_POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [isBoldReturn, status, intentId]);
}
