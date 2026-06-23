import { HttpClient } from 'polpo-http-client';

import type { AdminBookClassPayload, AdminBookingUser, Booking } from './bookings.models';

export class BookingsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipResponseError>) {}

  async adminBookClass(payload: AdminBookClassPayload) {
    return this.httpClient.callNoError<Booking, AdminBookClassPayload>({
      path: '/admin/bookings',
      method: 'POST',
      data: payload,
    });
  }

  async searchUsers(email: string) {
    return this.httpClient.callNoError<Array<AdminBookingUser>>({
      path: '/admin/users',
      method: 'GET',
      params: { email },
    });
  }
}
