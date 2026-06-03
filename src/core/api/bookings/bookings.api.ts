import { HttpClient } from 'polpo-http-client';

import type { BookClassPayload, Booking, MarkAttendancePayload, MyBooking } from './bookings.models';

export class BookingsAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getMyBookings() {
    return this.httpClient.call<Array<MyBooking>>({
      path: '/bookings/me',
      method: 'GET',
    });
  }

  async bookClass(payload: BookClassPayload) {
    return this.httpClient.call<Booking, BookClassPayload>({
      path: '/bookings',
      method: 'POST',
      data: payload,
    });
  }

  async cancelBooking(id: string) {
    return this.httpClient.call<Booking>({
      path: `/bookings/${id}/cancel`,
      method: 'PUT',
    });
  }

  async joinWaitlist(payload: BookClassPayload) {
    return this.httpClient.call<Booking, BookClassPayload>({
      path: '/bookings/waitlist',
      method: 'POST',
      data: payload,
    });
  }

  async cancelWaitlist(id: string) {
    return this.httpClient.call({
      path: `/bookings/waitlist/${id}`,
      method: 'DELETE',
    });
  }

  async markAttendance(bookingId: string, payload: MarkAttendancePayload) {
    return this.httpClient.call({
      path: `/bookings/${bookingId}/attendance`,
      method: 'PUT',
      data: payload,
    });
  }
}
