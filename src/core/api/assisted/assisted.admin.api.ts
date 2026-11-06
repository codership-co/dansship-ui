import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AccountContactPayload,
  AccountContactResult,
  AccountLinkIssueResult,
  AccountLinkKind,
  AccountLinkStatus,
  AssistedBookingItem,
  AssistedBookingPayload,
  AssistedBookingResult,
  AssistedCancelPayload,
  AssistedCancelResult,
  AssistedReimbursePayload,
  BenefitGrantItem,
  BenefitGrantPayload,
  CompanionInput,
  ContactLead,
  ContactLeadCreatePayload,
  ContactLeadList,
  ContactLeadStatus,
  MergePayload,
  MergePreview,
  MergeResult,
  PersonSearchResult,
  SimpleAccountResult,
  SimplePersonInput,
} from './assisted.models';

export class AssistedAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async searchPeople(q: string) {
    return this.httpClient.callNoError<Array<PersonSearchResult>>({
      path: '/admin/assisted/people/search',
      method: 'GET',
      params: { q },
    });
  }

  async registerSimpleAccount(payload: SimplePersonInput) {
    return this.httpClient.callNoError<SimpleAccountResult, SimplePersonInput>({
      path: '/admin/assisted/simple-accounts',
      method: 'POST',
      data: payload,
    });
  }

  /** Every booking of the person on one calendar day (YYYY-MM-DD, Bogotá), any status. */
  async listBookingsForDay(userId: string, day: string) {
    return this.httpClient.callNoError<Array<AssistedBookingItem>>({
      path: `/admin/assisted/users/${userId}/bookings`,
      method: 'GET',
      params: { day },
    });
  }

  async reimburseBooking(bookingId: string, payload: AssistedReimbursePayload) {
    return this.httpClient.callNoError<{ booking_id: string; credit_restored: boolean }, AssistedReimbursePayload>({
      path: `/admin/assisted/bookings/${bookingId}/reimburse`,
      method: 'POST',
      data: payload,
    });
  }

  async book(payload: AssistedBookingPayload) {
    return this.httpClient.callNoError<AssistedBookingResult, AssistedBookingPayload>({
      path: '/admin/assisted/bookings',
      method: 'POST',
      data: payload,
    });
  }

  async addCompanion(bookingId: string, companion: CompanionInput, reason?: string) {
    return this.httpClient.callNoError<AssistedBookingResult, { companion: CompanionInput; reason?: string }>({
      path: `/admin/assisted/bookings/${bookingId}/companion`,
      method: 'POST',
      data: { companion, reason },
    });
  }

  async cancelBooking(bookingId: string, payload: AssistedCancelPayload) {
    return this.httpClient.callNoError<AssistedCancelResult, AssistedCancelPayload>({
      path: `/admin/assisted/bookings/${bookingId}/cancel`,
      method: 'POST',
      data: payload,
    });
  }

  async correctContact(userId: string, payload: AccountContactPayload) {
    return this.httpClient.callNoError<AccountContactResult, AccountContactPayload>({
      path: `/admin/assisted/users/${userId}/contact`,
      method: 'PATCH',
      data: payload,
    });
  }

  async listLinks(userId: string) {
    return this.httpClient.callNoError<Array<AccountLinkStatus>>({
      path: `/admin/assisted/users/${userId}/links`,
      method: 'GET',
    });
  }

  async issueLink(userId: string, kind: AccountLinkKind, delivery: 'copy' | 'email') {
    return this.httpClient.callNoError<AccountLinkIssueResult, { delivery: 'copy' | 'email' }>({
      path: `/admin/assisted/users/${userId}/links/${kind}`,
      method: 'POST',
      data: { delivery },
    });
  }

  async previewMerge(primaryUserId: string, secondaryUserId: string) {
    return this.httpClient.callNoError<MergePreview, { primary_user_id: string; secondary_user_id: string }>({
      path: '/admin/assisted/accounts/merge/preview',
      method: 'POST',
      data: {
        primary_user_id: primaryUserId,
        secondary_user_id: secondaryUserId,
      },
    });
  }

  async merge(payload: MergePayload) {
    return this.httpClient.callNoError<MergeResult, MergePayload>({
      path: '/admin/assisted/accounts/merge',
      method: 'POST',
      data: payload,
    });
  }

  async listContactLeads(status?: ContactLeadStatus) {
    return this.httpClient.callNoError<ContactLeadList>({
      path: '/admin/contact-leads',
      method: 'GET',
      params: status ? { status } : {},
    });
  }

  async createContactLead(payload: ContactLeadCreatePayload) {
    return this.httpClient.callNoError<ContactLead, ContactLeadCreatePayload>({
      path: '/admin/contact-leads',
      method: 'POST',
      data: payload,
    });
  }

  async changeContactLeadStatus(leadId: string, status: Exclude<ContactLeadStatus, 'converted'>) {
    return this.httpClient.callNoError<ContactLead, { status: string }>({
      path: `/admin/contact-leads/${leadId}/status`,
      method: 'PATCH',
      data: { status },
    });
  }

  async addContactLeadNote(leadId: string, body: string) {
    return this.httpClient.callNoError<ContactLead, { body: string }>({
      path: `/admin/contact-leads/${leadId}/notes`,
      method: 'POST',
      data: { body },
    });
  }

  async linkContactLead(leadId: string, userId: string) {
    return this.httpClient.callNoError<ContactLead, { user_id: string }>({
      path: `/admin/contact-leads/${leadId}/link-user`,
      method: 'POST',
      data: { user_id: userId },
    });
  }

  async searchContactLeadUsers(q: string) {
    return this.httpClient.callNoError<Array<PersonSearchResult>>({
      path: '/admin/contact-leads/user-search',
      method: 'GET',
      params: { q },
    });
  }

  async listBenefits(userId: string) {
    return this.httpClient.callNoError<Array<BenefitGrantItem>>({
      path: `/admin/assisted/users/${userId}/benefits`,
      method: 'GET',
    });
  }

  async grantBenefit(userId: string, payload: BenefitGrantPayload) {
    return this.httpClient.callNoError<BenefitGrantItem, BenefitGrantPayload>({
      path: `/admin/assisted/users/${userId}/benefits`,
      method: 'POST',
      data: payload,
    });
  }

  async revokeBenefit(grantId: string, reason: string) {
    return this.httpClient.callNoError<BenefitGrantItem, { reason: string }>({
      path: `/admin/assisted/benefits/${grantId}/revoke`,
      method: 'POST',
      data: { reason },
    });
  }
}
