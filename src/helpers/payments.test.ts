import { describe, expect, it } from 'vitest';

import { paymentAttemptCardLabel, paymentMethodLabelKey } from './payments';

describe('paymentMethodLabelKey', () => {
  it('uses the namespaced i18n key so the label is translated', () => {
    expect(paymentMethodLabelKey('card')).toBe('payments:method.card');
  });
});

describe('paymentAttemptCardLabel', () => {
  it('joins brand and masked pan', () => {
    expect(paymentAttemptCardLabel({ card_brand: 'VISA', masked_pan: '**** 5051' })).toBe('VISA **** 5051');
  });

  it('works with only one of the two', () => {
    expect(paymentAttemptCardLabel({ card_brand: 'VISA' })).toBe('VISA');
    expect(paymentAttemptCardLabel({ masked_pan: '**** 1369' })).toBe('**** 1369');
  });

  it('returns null when there is no card data', () => {
    expect(paymentAttemptCardLabel({ card_brand: null, masked_pan: null })).toBeNull();
  });
});
