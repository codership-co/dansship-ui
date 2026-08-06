import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { GiftClaimPreview, GiftClaimRequest, GiftClaimResponse, GiftListItem } from './gifts.models';

export class GiftsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async previewClaim(token: string) {
    return this.httpClient.callNoError<GiftClaimPreview>({
      path: '/gifts/claim',
      method: 'GET',
      params: { token },
    });
  }

  async claimGift(token: string) {
    return this.httpClient.callNoError<GiftClaimResponse, GiftClaimRequest>({
      path: '/gifts/claim',
      method: 'POST',
      data: { token },
    });
  }

  async claimGiftById(giftOrderId: string) {
    return this.httpClient.callNoError<GiftClaimResponse>({
      path: `/gifts/${giftOrderId}/claim`,
      method: 'POST',
    });
  }

  async listSent() {
    return this.httpClient.callNoError<Array<GiftListItem>>({
      path: '/gifts/sent',
      method: 'GET',
    });
  }

  async listReceived() {
    return this.httpClient.callNoError<Array<GiftListItem>>({
      path: '/gifts/received',
      method: 'GET',
    });
  }
}
