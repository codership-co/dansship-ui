import type {
  GiftClaimPolicy,
  PlanPromotion,
  PromotionPreviewMapped,
  PromotionTermsPreview,
  PublicPlan,
} from '@core/api';

/** The server fixes the start date of every purchase for oneself while the promotion is open. */
export const START_RULE_ON_APPROVAL = 'on_approval';
const MONTHLY_MODE = 'monthly';

/** The promotion the API reports as open, read from the plans it came with. Null when none is open. */
export function activePromotionOf(plans: Array<Pick<PublicPlan, 'promotion'>>): PlanPromotion | null {
  return plans.find(plan => plan.promotion)?.promotion ?? null;
}

/** True while a promotion fixes the start date: the date field is not shown and none is sent. */
export function promotionFixesStart(plan: Pick<PublicPlan, 'promotion'>): boolean {
  return plan.promotion?.start_rule === START_RULE_ON_APPROVAL;
}

/** True when this purchase mode gets the promotion discount (monthly only today). */
export function promotionDiscountApplies(plan: Pick<PublicPlan, 'promotion'>, isQuarterly: boolean): boolean {
  const promotion = plan.promotion;

  if (!promotion) {
    return false;
  }

  return !isQuarterly && promotion.discount_modes.includes(MONTHLY_MODE);
}

/** Quarterly purchase inside a promotion that does not discount it: it keeps its own discount. */
export function promotionSkipsQuarterly(plan: Pick<PublicPlan, 'promotion'>, isQuarterly: boolean): boolean {
  return Boolean(plan.promotion) && isQuarterly && !plan.promotion?.discount_modes.includes('quarterly');
}

/**
 * Fixed last Bogotá day (YYYY-MM-DD) the open promotion gives this purchase mode, from the server.
 * Only modes that get the discount carry it (gifts too). Null: the plan keeps its own validity.
 */
export function promotionFixedExpiry(
  plan: Pick<PublicPlan, 'promotion'>,
  mode: { isQuarterly: boolean; isDuo: boolean },
): string | null {
  if (mode.isDuo || !promotionDiscountApplies(plan, mode.isQuarterly)) {
    return null;
  }

  return plan.promotion?.expires_on ?? null;
}

/** Claim policy the server gives for a gift of this plan and mode. Null when the server did not send it. */
export function giftClaimPolicyFor(plan: Pick<PublicPlan, 'gift_claim'>, isQuarterly: boolean): GiftClaimPolicy | null {
  return plan.gift_claim?.[isQuarterly ? 'quarterly' : 'monthly'] ?? null;
}

/**
 * Locale key of a promotion text, namespaced by promotion code so a new promotion only needs copy, not code.
 * Falls back to the generic text when the promotion has no copy of its own.
 */
export function promotionCopyKey(code: string, field: string): Array<string> {
  return [`subscriptions:promotions.${code}.${field}`, `subscriptions:promotions.default.${field}`];
}

/** True when the checkout preview says the server fixes the start date of this purchase. */
export function previewFixesStart(promotion: Pick<PromotionPreviewMapped, 'startRule'> | null | undefined): boolean {
  return promotion?.startRule === START_RULE_ON_APPROVAL;
}

/**
 * The terms version to send with the purchase: the one the buyer accepted, and only while it is still the
 * version the preview shows. A new version means the buyer accepts again.
 */
export function acceptedTermsVersion(
  terms: Pick<PromotionTermsPreview, 'version_id'> | null | undefined,
  acceptedVersionId: string | null,
): string | null {
  return terms && acceptedVersionId === terms.version_id ? acceptedVersionId : null;
}

export interface CheckoutPromotionRules {
  /** No start-date field: the plan starts when the payment is approved. */
  startIsFixed: boolean;
  /** The "plan starts on approval" note. Quarterly purchases do not show it, they only keep their own discount. */
  startNoteVisible: boolean;
  /** No discount or referral code field: the promotion discount is exclusive. */
  codesHidden: boolean;
  /** Quarterly purchase inside a promotion that does not discount it. */
  quarterlyKeepsOwn: boolean;
  /** Gift claim days and refund policy, from the server. Null outside gifts. */
  giftClaim: GiftClaimPolicy | null;
}

/** What an open promotion changes in step 1 for this plan and purchase mode. One owner for render and submit. */
export function resolveCheckoutPromotion(
  plan: Pick<PublicPlan, 'promotion' | 'gift_claim'>,
  mode: { isGift: boolean; isDuo: boolean; isQuarterly: boolean },
): CheckoutPromotionRules {
  const quarterly = mode.isQuarterly && !mode.isDuo;
  const startIsFixed = !mode.isGift && !mode.isDuo && promotionFixesStart(plan);

  return {
    startIsFixed,
    startNoteVisible: startIsFixed && !quarterly,
    codesHidden: !mode.isDuo && promotionDiscountApplies(plan, quarterly),
    quarterlyKeepsOwn: promotionSkipsQuarterly(plan, quarterly),
    giftClaim: mode.isGift ? giftClaimPolicyFor(plan, quarterly) : null,
  };
}
