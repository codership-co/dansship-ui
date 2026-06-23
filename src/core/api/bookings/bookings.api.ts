import { HttpClient } from 'polpo-http-client';

import type { BookClassPayload, Booking, MarkAttendancePayload, MyBooking } from './bookings.models';

export class BookingsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipResponseError>) {}

  async getMyBookings() {
    return this.httpClient.callNoError<Array<MyBooking>>({
      path: '/bookings/me',
      method: 'GET',
    });
  }

  async bookClass(payload: BookClassPayload) {
    return this.httpClient.callNoError<Booking, BookClassPayload>({
      path: '/bookings',
      method: 'POST',
      data: payload,
    });
  }

  async cancelBooking(id: string) {
    return this.httpClient.callNoError<Booking>({
      path: `/bookings/${id}/cancel`,
      method: 'PUT',
    });
  }

  async joinWaitlist(payload: BookClassPayload) {
    return this.httpClient.callNoError<Booking, BookClassPayload>({
      path: '/bookings/waitlist',
      method: 'POST',
      data: payload,
    });
  }

  async cancelWaitlist(id: string) {
    return this.httpClient.callNoError({
      path: `/bookings/waitlist/${id}`,
      method: 'DELETE',
    });
  }

  async markAttendance(bookingId: string, payload: MarkAttendancePayload) {
    return this.httpClient.callNoError({
      path: `/bookings/${bookingId}/attendance`,
      method: 'PUT',
      data: payload,
    });
  }
}
