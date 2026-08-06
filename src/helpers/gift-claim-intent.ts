const PENDING_GIFT_CLAIM_TOKEN_KEY = 'pending_gift_claim_token';

export const setPendingGiftClaimToken = (token: string) => {
  sessionStorage.setItem(PENDING_GIFT_CLAIM_TOKEN_KEY, token);
};

export const getPendingGiftClaimToken = (): string | null => {
  return sessionStorage.getItem(PENDING_GIFT_CLAIM_TOKEN_KEY);
};

export const clearPendingGiftClaimToken = () => {
  sessionStorage.removeItem(PENDING_GIFT_CLAIM_TOKEN_KEY);
};

export const consumePendingGiftClaimToken = (): string | null => {
  const token = getPendingGiftClaimToken();
  clearPendingGiftClaimToken();

  return token;
};
