import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  BookClassPayload,
  Booking,
  BookingCancelPayload,
  MarkAttendancePayload,
  MyBooking,
} from './bookings.models';

export class BookingsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

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

  async cancelBooking(id: string, payload: BookingCancelPayload = {}) {
    return this.httpClient.callNoError<Booking, BookingCancelPayload>({
      path: `/bookings/${id}/cancel`,
      method: 'PUT',
      data: payload,
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
