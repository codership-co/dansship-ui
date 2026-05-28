import { HttpClient } from '@core/http-client';

export class MerchAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getStatus() {
    return this.httpClient.call({
      path: '',
      method: 'GET',
    });
  }
}
