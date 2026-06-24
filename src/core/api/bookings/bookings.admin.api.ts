import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { AdminBookClassPayload, AdminBookingUser, Booking } from './bookings.models';

export class BookingsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

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
