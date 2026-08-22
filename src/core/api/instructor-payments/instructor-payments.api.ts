import { HttpClient } from 'polpo-http-client';

import {
  type AdminPaymentDocumentsResponse,
  type AdminPaymentProfileUpdatePayload,
  type GeneratePaymentDocumentPayload,
  type PaymentDocument,
  type PaymentDocumentContentType,
  type PaymentDocumentKind,
  type PaymentDocumentListResponse,
  type PaymentProfile,
  type PaymentProfileUpdatePayload,
  type PayRateListResponse,
  type SetPayRatePayload,
  SignatureContentTypes,
  PaymentDocumentContentTypes,
  normalizeAdminPaymentDocuments,
  normalizeGeneratedDocument,
  normalizePayRate,
  normalizePayRateList,
  normalizePaymentDocumentList,
  type InstructorPayRate,
} from './instructor-payments.models';

import { DansshipAPIError } from '@core/api';

import type { PresignedUrlResponse, ProofViewUrlResponse } from '../payments/payments.models';

async function putFileToPresignedUrl(file: File, uploadUrl: string) {
  const uploadResponse = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload instructor payment document');
  }
}

export class InstructorPaymentsAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getPaymentProfile() {
    return this.httpClient.callNoError<PaymentProfile>({
      path: '/instructors/payment-profile',
      method: 'GET',
    });
  }

  async updatePaymentProfile(payload: PaymentProfileUpdatePayload) {
    return this.httpClient.callNoError<PaymentProfile, PaymentProfileUpdatePayload>({
      path: '/instructors/payment-profile',
      method: 'PUT',
      data: payload,
    });
  }

  private async getUploadUrl(kind: PaymentDocumentKind, contentType: string) {
    return this.httpClient.callNoError<PresignedUrlResponse, { content_type: string }>({
      path: `/instructors/payment-profile/${kind}/upload-url`,
      method: 'POST',
      data: { content_type: contentType },
    });
  }

  async uploadPaymentDocument(kind: PaymentDocumentKind, file: File) {
    const allowed = kind === 'signature' ? SignatureContentTypes : PaymentDocumentContentTypes;

    if (!allowed.includes(file.type as PaymentDocumentContentType)) {
      throw new Error('Invalid payment document content type');
    }

    const { data } = await this.getUploadUrl(kind, file.type);

    if (!data?.upload_url || !data.file_key) {
      throw new Error('Failed to get instructor payment document upload url');
    }

    await putFileToPresignedUrl(file, data.upload_url);

    return data.file_key;
  }

  async getFileViewUrl(kind: PaymentDocumentKind) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/instructors/payment-profile/${kind}/view-url`,
      method: 'GET',
    });
  }

  async listPaymentDocuments() {
    return this.httpClient.callNoError<PaymentDocumentListResponse>(
      {
        path: '/instructors/payment-documents',
        method: 'GET',
      },
      normalizePaymentDocumentList,
    );
  }

  async generatePaymentDocument(payload: GeneratePaymentDocumentPayload) {
    return this.httpClient.callNoError<PaymentDocument, GeneratePaymentDocumentPayload>(
      {
        path: '/instructors/payment-documents',
        method: 'POST',
        data: payload,
      },
      normalizeGeneratedDocument,
    );
  }

  async getDocumentViewUrl(documentId: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/instructors/payment-documents/${documentId}/view-url`,
      method: 'GET',
    });
  }
}

export class InstructorPaymentsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getUserPaymentDocuments(userId: string) {
    return this.httpClient.callNoError<AdminPaymentDocumentsResponse>(
      {
        path: `/admin/users/${userId}/payment-documents`,
        method: 'GET',
      },
      normalizeAdminPaymentDocuments,
    );
  }

  async updateUserPaymentProfile(userId: string, payload: AdminPaymentProfileUpdatePayload) {
    return this.httpClient.callNoError<PaymentProfile, AdminPaymentProfileUpdatePayload>({
      path: `/admin/users/${userId}/payment-profile`,
      method: 'PATCH',
      data: payload,
    });
  }

  async getFileViewUrl(userId: string, kind: PaymentDocumentKind) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/admin/users/${userId}/payment-profile/${kind}/view-url`,
      method: 'GET',
    });
  }

  async getDocumentViewUrl(userId: string, documentId: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/admin/users/${userId}/payment-documents/${documentId}/view-url`,
      method: 'GET',
    });
  }

  async voidDocument(userId: string, documentId: string, reason: string) {
    return this.httpClient.callNoError<PaymentDocument, { reason: string }>(
      {
        path: `/admin/users/${userId}/payment-documents/${documentId}/void`,
        method: 'POST',
        data: { reason },
      },
      normalizeGeneratedDocument,
    );
  }

  async listPayRates() {
    return this.httpClient.callNoError<PayRateListResponse>(
      {
        path: '/admin/instructor-pay-rates',
        method: 'GET',
      },
      normalizePayRateList,
    );
  }

  async setPayRate(payload: SetPayRatePayload) {
    return this.httpClient.callNoError<InstructorPayRate, SetPayRatePayload>(
      {
        path: '/admin/instructor-pay-rates',
        method: 'POST',
        data: payload,
      },
      normalizePayRate,
    );
  }
}
