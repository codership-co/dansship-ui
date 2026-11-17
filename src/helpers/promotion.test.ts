import { describe, expect, it } from 'vitest';

import {
  acceptedTermsVersion,
  giftClaimPolicyFor,
  previewFixesStart,
  resolveCheckoutPromotion,
  promotionCopyKey,
  promotionDiscountApplies,
  promotionFixesStart,
  promotionSkipsQuarterly,
} from './promotion';

import type { PlanPromotion } from '@core/api';

const promotion: PlanPromotion = {
  code: 'BLACK_FRIDAY_2026',
  label_key: 'subscriptions:discountBlackFriday',
  discount_percentage: 30,
  discount_modes: ['monthly'],
  original_price: 230000,
  promotional_price: 161000,
  start_rule: 'on_approval',
  terms_required: false,
};

describe('promotion helpers', () => {
  it('fixes the start for every purchase mode while a promotion is open', () => {
    expect(promotionFixesStart({ promotion })).toBe(true);
    expect(promotionFixesStart({ promotion: null })).toBe(false);
    expect(promotionFixesStart({})).toBe(false);
  });

  it('discounts monthly purchases only', () => {
    expect(promotionDiscountApplies({ promotion }, false)).toBe(true);
    expect(promotionDiscountApplies({ promotion }, true)).toBe(false);
    expect(promotionDiscountApplies({ promotion: null }, false)).toBe(false);
  });

  it('tells a quarterly purchase it keeps its own discount', () => {
    expect(promotionSkipsQuarterly({ promotion }, true)).toBe(true);
    expect(promotionSkipsQuarterly({ promotion }, false)).toBe(false);
    expect(promotionSkipsQuarterly({ promotion: null }, true)).toBe(false);
  });

  it('reads the gift claim policy by purchase mode and never invents one', () => {
    const gift_claim = {
      monthly: { claim_days: 7, refund_to_wallet: true },
      quarterly: { claim_days: 90, refund_to_wallet: false },
    };

    expect(giftClaimPolicyFor({ gift_claim }, false)).toEqual({ claim_days: 7, refund_to_wallet: true });
    expect(giftClaimPolicyFor({ gift_claim }, true)).toEqual({ claim_days: 90, refund_to_wallet: false });
    expect(giftClaimPolicyFor({}, false)).toBeNull();
  });

  it('namespaces copy by promotion code with a generic fallback', () => {
    expect(promotionCopyKey('BLACK_FRIDAY_2026', 'badge')).toEqual([
      'subscriptions:promotions.BLACK_FRIDAY_2026.badge',
      'subscriptions:promotions.default.badge',
    ]);
  });

  it('reads the start rule of a checkout preview', () => {
    expect(previewFixesStart({ startRule: 'on_approval' })).toBe(true);
    expect(previewFixesStart({ startRule: null })).toBe(false);
    expect(previewFixesStart(null)).toBe(false);
  });

  it('keeps an accepted terms version only while the preview still shows it', () => {
    expect(acceptedTermsVersion({ version_id: 'v2' }, 'v2')).toBe('v2');
    expect(acceptedTermsVersion({ version_id: 'v3' }, 'v2')).toBeNull();
    expect(acceptedTermsVersion(null, 'v2')).toBeNull();
    expect(acceptedTermsVersion({ version_id: 'v2' }, null)).toBeNull();
  });
});

describe('resolveCheckoutPromotion', () => {
  const plan = {
    promotion,
    gift_claim: {
      monthly: { claim_days: 7, refund_to_wallet: true },
      quarterly: { claim_days: 90, refund_to_wallet: false },
    },
  };
  const self = { isGift: false, isDuo: false, isQuarterly: false };

  it('fixes the start and hides the codes for a monthly purchase for oneself', () => {
    expect(resolveCheckoutPromotion(plan, self)).toEqual({
      startIsFixed: true,
      startNoteVisible: true,
      codesHidden: true,
      quarterlyKeepsOwn: false,
      giftClaim: null,
    });
  });

  it('keeps the start fixed but gives the codes back for the quarterly mode', () => {
    expect(resolveCheckoutPromotion(plan, { ...self, isQuarterly: true })).toEqual({
      startIsFixed: true,
      startNoteVisible: false,
      codesHidden: false,
      quarterlyKeepsOwn: true,
      giftClaim: null,
    });
  });

  it('gives the gift claim policy of the mode and no start rule for a gift', () => {
    expect(resolveCheckoutPromotion(plan, { ...self, isGift: true }).giftClaim).toEqual({
      claim_days: 7,
      refund_to_wallet: true,
    });
    expect(resolveCheckoutPromotion(plan, { ...self, isGift: true, isQuarterly: true }).giftClaim).toEqual({
      claim_days: 90,
      refund_to_wallet: false,
    });
    expect(resolveCheckoutPromotion(plan, { ...self, isGift: true }).startIsFixed).toBe(false);
  });

  it('changes nothing for Plan Duo or without a promotion', () => {
    expect(resolveCheckoutPromotion(plan, { ...self, isDuo: true })).toEqual({
      startIsFixed: false,
      startNoteVisible: false,
      codesHidden: false,
      quarterlyKeepsOwn: false,
      giftClaim: null,
    });
    expect(resolveCheckoutPromotion({ promotion: null }, self)).toEqual({
      startIsFixed: false,
      startNoteVisible: false,
      codesHidden: false,
      quarterlyKeepsOwn: false,
      giftClaim: null,
    });
  });
});
