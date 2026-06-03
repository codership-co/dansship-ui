import { HttpClient } from 'polpo-http-client';

import type { AdminBookClassPayload, AdminBookingUser, Booking } from './bookings.models';

export class BookingsAdminAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async adminBookClass(payload: AdminBookClassPayload) {
    return this.httpClient.call<Booking, AdminBookClassPayload>({
      path: '/admin/bookings',
      method: 'POST',
      data: payload,
    });
  }

  async searchUsers(email: string) {
    return this.httpClient.call<Array<AdminBookingUser>>({
      path: '/admin/users',
      method: 'GET',
      params: { email },
    });
  }
}
