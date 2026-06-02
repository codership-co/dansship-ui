import { HttpClient } from 'polpo-http-client';

export class StudioRentalAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getStatus() {
    return this.httpClient.call({
      path: '',
      method: 'GET',
    });
  }
}
