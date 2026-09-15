import { HttpClient } from 'polpo-http-client';

import { uploadFileWithPresignedRetry } from '../common/put-file-to-presigned-url';

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
  type SetFixedPayRatePayload,
  type SetPayRatePayload,
  type FixedPayRate,
  SignatureContentTypes,
  PaymentDocumentContentTypes,
  normalizeAdminPaymentDocuments,
  normalizeFixedPayRate,
  normalizeGeneratedDocument,
  normalizePayRate,
  normalizePayRateList,
  normalizePaymentDocumentList,
  type InstructorPayRate,
} from './instructor-payments.models';

import { DansshipAPIError } from '@core/api';

import type { PresignedUrlResponse, ProofViewUrlResponse } from '../payments/payments.models';

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

    return uploadFileWithPresignedRetry(
      file,
      async () => {
        const { data } = await this.getUploadUrl(kind, file.type);

        return data;
      },
      async fileKey => fileKey,
    );
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

  async confirmPaymentDocument(documentId: string) {
    return this.httpClient.callNoError<PaymentDocument>(
      {
        path: `/instructors/payment-documents/${documentId}/confirm`,
        method: 'POST',
      },
      normalizeGeneratedDocument,
    );
  }

  async disputePaymentDocument(documentId: string, reason: string) {
    return this.httpClient.callNoError<PaymentDocument, { reason: string }>(
      {
        path: `/instructors/payment-documents/${documentId}/dispute`,
        method: 'POST',
        data: { reason },
      },
      normalizeGeneratedDocument,
    );
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

  private async getReceiptUploadUrl(userId: string, documentId: string, contentType: string) {
    return this.httpClient.callNoError<PresignedUrlResponse, { content_type: string }>({
      path: `/admin/users/${userId}/payment-documents/${documentId}/receipt/upload-url`,
      method: 'POST',
      data: { content_type: contentType },
    });
  }

  async uploadReceipt(userId: string, documentId: string, file: File) {
    if (!PaymentDocumentContentTypes.includes(file.type as PaymentDocumentContentType)) {
      throw new Error('Invalid payment receipt content type');
    }

    return uploadFileWithPresignedRetry(
      file,
      async () => {
        const { data } = await this.getReceiptUploadUrl(userId, documentId, file.type);

        return data;
      },
      async fileKey => fileKey,
    );
  }

  async getReceiptViewUrl(userId: string, documentId: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/admin/users/${userId}/payment-documents/${documentId}/receipt/view-url`,
      method: 'GET',
    });
  }

  async payDocument(userId: string, documentId: string, fileKey: string) {
    return this.httpClient.callNoError<PaymentDocument, { file_key: string }>(
      {
        path: `/admin/users/${userId}/payment-documents/${documentId}/pay`,
        method: 'POST',
        data: { file_key: fileKey },
      },
      normalizeGeneratedDocument,
    );
  }

  async setFixedPayRate(userId: string, payload: SetFixedPayRatePayload) {
    return this.httpClient.callNoError<FixedPayRate, SetFixedPayRatePayload>(
      {
        path: `/admin/users/${userId}/fixed-pay-rate`,
        method: 'PUT',
        data: payload,
      },
      normalizeFixedPayRate,
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
