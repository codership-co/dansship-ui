import { describe, expect, it } from 'vitest';

import { mapAppliedDiscounts, mapPromotionPreview } from './payments.helpers';

describe('mapPromotionPreview', () => {
  it('maps the decimals of the preview and keeps the terms and ignored inputs', () => {
    const mapped = mapPromotionPreview({
      code: 'BLACK_FRIDAY_2026',
      label_key: 'subscriptions:discountBlackFriday',
      discount_percentage: '30.00',
      original_price: '230000.00',
      promotional_price: '161000.00',
      start_rule: 'on_approval',
      ignored_inputs: ['referral_code'],
      terms: {
        version_id: 'v2',
        version: 2,
        title: 'Black Friday 2026',
        file_url: 'https://cdn.example.com/terms.pdf',
      },
    });

    expect(mapped).toEqual({
      code: 'BLACK_FRIDAY_2026',
      labelKey: 'subscriptions:discountBlackFriday',
      discountPercentage: 30,
      originalPrice: 230000,
      promotionalPrice: 161000,
      startRule: 'on_approval',
      ignoredInputs: ['referral_code'],
      terms: {
        version_id: 'v2',
        version: 2,
        title: 'Black Friday 2026',
        file_url: 'https://cdn.example.com/terms.pdf',
      },
    });
  });

  it('keeps a missing discount (quarterly) as null and a missing promotion as null', () => {
    expect(
      mapPromotionPreview({
        code: 'X',
        label_key: 'k',
        discount_percentage: null,
        original_price: 1,
        promotional_price: 1,
        start_rule: 'on_approval',
        ignored_inputs: [],
        terms: null,
      })?.discountPercentage,
    ).toBeNull();
    expect(mapPromotionPreview(null)).toBeNull();
    expect(mapPromotionPreview(undefined)).toBeNull();
  });
});

describe('mapAppliedDiscounts', () => {
  it('carries the label key a promotion line brings and leaves the others without one', () => {
    const [promo, other] = mapAppliedDiscounts([
      { code: 'BF', name: 'BF', type: 'percentage_discount', value: '30', calculated_amount: '69000', label_key: 'k' },
      { code: 'FIRST_PLAN_PCT_10', name: 'x', type: 'percentage_discount', value: 10, calculated_amount: 1 },
    ]);

    expect(promo.labelKey).toBe('k');
    expect(promo.value).toBe(30);
    expect(other.labelKey).toBeNull();
  });
});
