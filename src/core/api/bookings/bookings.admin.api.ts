import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type { AdminBookClassPayload, AdminBookingUser, Booking, MyBooking } from './bookings.models';
import type { ClassRosterResponse } from '../instructors/instructors.models';
import type { UserListPage } from '../users/users.models';

export class BookingsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async adminBookClass(payload: AdminBookClassPayload) {
    return this.httpClient.callNoError<Booking, AdminBookClassPayload>({
      path: '/admin/bookings',
      method: 'POST',
      data: payload,
    });
  }

  async searchUsers(search: string) {
    return this.httpClient.callNoError<UserListPage, object, Array<AdminBookingUser>>(
      {
        path: '/admin/users',
        method: 'GET',
        params: { search, limit: 20, offset: 0 },
      },
      page =>
        page.items.map(user => ({
          id: user.id,
          email: user.email,
        })),
    );
  }

  async listUserBookings(userId: string) {
    return this.httpClient.callNoError<Array<MyBooking>>({
      path: '/admin/bookings',
      method: 'GET',
      params: { user_id: userId },
    });
  }

  async getAdminClassRoster(classId: string) {
    return this.httpClient.callNoError<ClassRosterResponse>({
      path: `/admin/classes/${classId}/roster`,
      method: 'GET',
    });
  }
}
