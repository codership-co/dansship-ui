import { afterEach, describe, expect, it, vi } from 'vitest';

import { trackMetaPurchase } from './use-meta-pixel-purchase';

const intentId = '11111111-1111-1111-1111-111111111111';

describe('trackMetaPurchase', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    window.sessionStorage.clear();
    window.localStorage.clear();
    delete window.fbq;
    window.history.replaceState({}, '', '/');
  });

  it('sends the charged amount plus the wallet and remembers the intent', () => {
    const fbq = vi.fn();
    window.fbq = fbq;
    window.history.replaceState({}, '', `/payments/result?intentId=${intentId}&checkout=1`);

    expect(
      trackMetaPurchase({
        intentId,
        amount: 0,
        walletAmountApplied: 120000,
        currency: 'cop',
      }),
    ).toBe(true);

    expect(fbq).toHaveBeenCalledWith('track', 'Purchase', { value: 120000, currency: 'COP' }, { eventID: intentId });
    expect(window.sessionStorage.getItem(`dansship.meta-purchase.${intentId}`)).toBe('1');
    expect(window.localStorage.getItem(`dansship.meta-purchase.${intentId}`)).toBe('1');
    expect(window.location.search).toBe(`?intentId=${intentId}`);
  });

  it('does not send a second purchase after session storage is cleared', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    trackMetaPurchase({ intentId, amount: 50000, currency: 'COP' });
    window.sessionStorage.clear();

    expect(trackMetaPurchase({ intentId, amount: 50000, currency: 'COP' })).toBe(false);
    expect(fbq).toHaveBeenCalledTimes(1);
  });

  it('does not send a purchase with no value and does not mark it', () => {
    const fbq = vi.fn();
    window.fbq = fbq;

    expect(trackMetaPurchase({ intentId, amount: 0, walletAmountApplied: 0, currency: 'COP' })).toBe(false);

    expect(fbq).not.toHaveBeenCalled();
    expect(window.localStorage.getItem(`dansship.meta-purchase.${intentId}`)).toBeNull();
  });

  it('does not mark the intent when the pixel is unavailable', () => {
    expect(trackMetaPurchase({ intentId, amount: 50000, currency: 'COP' })).toBe(false);
    expect(window.localStorage.getItem(`dansship.meta-purchase.${intentId}`)).toBeNull();
  });
});
