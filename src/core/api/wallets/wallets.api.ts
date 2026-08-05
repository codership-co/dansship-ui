import { HttpClient } from 'polpo-http-client';

import { normalizeWallet, type CreateWalletEntryPayload, type WalletResponse } from './wallets.models';

import { DansshipAPIError } from '@core/api';

export class WalletsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getMine() {
    return this.httpClient.callNoError<WalletResponse>(
      {
        path: '/wallets/me',
        method: 'GET',
      },
      normalizeWallet,
    );
  }
}

export class WalletsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getUserWallet(userId: string) {
    return this.httpClient.callNoError<WalletResponse>(
      {
        path: `/admin/users/${userId}/wallet`,
        method: 'GET',
      },
      normalizeWallet,
    );
  }

  async createEntry(userId: string, payload: CreateWalletEntryPayload) {
    return this.httpClient.callNoError<WalletResponse, CreateWalletEntryPayload>(
      {
        path: `/admin/users/${userId}/wallet/entries`,
        method: 'POST',
        data: payload,
      },
      normalizeWallet,
    );
  }
}
