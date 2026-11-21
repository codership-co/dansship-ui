import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AdminEventPerson,
  AdminPersonUpdatePayload,
  DoorEvent,
  DoorSearchRow,
  EntryCounters,
  EntryPass,
  EntryScanResult,
  EntryWindow,
  EntryWindowPayload,
} from './entry.models';

/** Entry QR (holder, attendee, "Tu entrada") and the door (`validate:event_entry`). */
export class EntryAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getMyCode(personId: string) {
    return this.httpClient.callNoError<EntryPass>({
      path: `/events/entry/people/${personId}/code`,
      method: 'GET',
    });
  }

  async getPublicPass(token: string) {
    return this.httpClient.callNoError<EntryPass>({
      path: `/events/entry/passes/${encodeURIComponent(token)}`,
      method: 'GET',
    });
  }

  async getPublicCode(token: string) {
    return this.httpClient.callNoError<EntryPass>({
      path: `/events/entry/passes/${encodeURIComponent(token)}/code`,
      method: 'GET',
    });
  }

  async listDoorEvents() {
    return this.httpClient.callNoError<Array<DoorEvent>>({ path: '/events/entry/events', method: 'GET' });
  }

  async getCounters(eventId: string) {
    return this.httpClient.callNoError<EntryCounters>({
      path: `/events/entry/events/${eventId}/counters`,
      method: 'GET',
    });
  }

  async scan(eventId: string, code: string) {
    return this.httpClient.callNoError<EntryScanResult, { code: string }>({
      path: `/events/entry/events/${eventId}/scan`,
      method: 'POST',
      data: { code },
    });
  }

  async search(eventId: string, query: string) {
    return this.httpClient.callNoError<{ items: Array<DoorSearchRow> }>({
      path: `/events/entry/events/${eventId}/search`,
      method: 'GET',
      params: { q: query },
    });
  }

  async enter(eventId: string, personId: string) {
    return this.httpClient.callNoError<EntryScanResult>({
      path: `/events/entry/events/${eventId}/people/${personId}/enter`,
      method: 'POST',
    });
  }

  async setDonationReceived(signupId: string, received: boolean) {
    return this.httpClient.callNoError<{ signup_id: string; received_at: string | null }, { received: boolean }>({
      path: `/events/entry/signups/${signupId}/donation-received`,
      method: 'PUT',
      data: { received },
    });
  }

  // ── Admin (manage:event) ────────────────────────────────────────────

  async updatePerson(personId: string, payload: AdminPersonUpdatePayload) {
    return this.httpClient.callNoError<AdminEventPerson, AdminPersonUpdatePayload>({
      path: `/admin/events/people/${personId}`,
      method: 'PATCH',
      data: payload,
    });
  }

  async resendEntry(personId: string) {
    return this.httpClient.callNoError<AdminEventPerson>({
      path: `/admin/events/people/${personId}/resend-entry`,
      method: 'POST',
    });
  }

  async voidEntry(personId: string) {
    return this.httpClient.callNoError<AdminEventPerson>({
      path: `/admin/events/people/${personId}/void-entry`,
      method: 'POST',
    });
  }

  async getEntryWindow(eventId: string) {
    return this.httpClient.callNoError<EntryWindow>({
      path: `/admin/events/${eventId}/entry-window`,
      method: 'GET',
    });
  }

  async setEntryWindow(eventId: string, payload: EntryWindowPayload) {
    return this.httpClient.callNoError<EntryWindow, EntryWindowPayload>({
      path: `/admin/events/${eventId}/entry-window`,
      method: 'PUT',
      data: payload,
    });
  }
}
