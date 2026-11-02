import { HttpClient } from 'polpo-http-client';

import { uploadFileWithPresignedRetry } from '../common/put-file-to-presigned-url';

import {
  type AdminPaymentDocumentsResponse,
  type GeneratePaymentDocumentPayload,
  type PaymentDocument,
  type PaymentDocumentContentType,
  type PaymentDocumentKind,
  type PaymentDocumentListResponse,
  type PaymentProfile,
  type PaymentProfileUpdatePayload,
  type PayrollDocumentsPage,
  type PayrollQuery,
  type PayrollSummary,
  type CreatePaymentAssignmentPayload,
  type PaymentAssignment,
  type PaymentAssignmentListResponse,
  type UpdatePaymentAssignmentPayload,
  SignatureContentTypes,
  PaymentDocumentContentTypes,
  normalizeAdminPaymentDocuments,
  normalizeGeneratedDocument,
  normalizePaymentAssignment,
  normalizePaymentAssignmentList,
  normalizePaymentDocumentList,
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
        const { ok, data, error } = await this.getReceiptUploadUrl(userId, documentId, file.type);

        if (!ok || !data?.upload_url || !data.file_key) {
          throw error instanceof DansshipAPIError ? error : new Error('Failed to get upload url');
        }

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

  async listPaymentAssignments() {
    return this.httpClient.callNoError<PaymentAssignmentListResponse>(
      {
        path: '/admin/payment-assignments',
        method: 'GET',
      },
      normalizePaymentAssignmentList,
    );
  }

  async listUserPaymentAssignments(userId: string) {
    return this.httpClient.callNoError<PaymentAssignmentListResponse>(
      {
        path: `/admin/users/${userId}/payment-assignments`,
        method: 'GET',
      },
      normalizePaymentAssignmentList,
    );
  }

  async createPaymentAssignment(payload: CreatePaymentAssignmentPayload) {
    return this.httpClient.callNoError<PaymentAssignment, CreatePaymentAssignmentPayload>(
      {
        path: '/admin/payment-assignments',
        method: 'POST',
        data: payload,
      },
      normalizePaymentAssignment,
    );
  }

  async updatePaymentAssignment(assignmentId: string, payload: UpdatePaymentAssignmentPayload) {
    return this.httpClient.callNoError<PaymentAssignment, UpdatePaymentAssignmentPayload>(
      {
        path: `/admin/payment-assignments/${assignmentId}`,
        method: 'PATCH',
        data: payload,
      },
      normalizePaymentAssignment,
    );
  }

  private payrollParams(query: PayrollQuery) {
    const params: Record<string, string> = { date_field: query.date_field };

    if (query.q) params.q = query.q;

    if (query.status) params.status = query.status;

    if (query.from) params.from = query.from;

    if (query.to) params.to = query.to;

    return params;
  }

  async listPayrollDocuments(query: PayrollQuery, page: number, pageSize: number) {
    return this.httpClient.callNoError<PayrollDocumentsPage>({
      path: '/admin/payroll/documents',
      method: 'GET',
      params: {
        ...this.payrollParams(query),
        page: String(page),
        page_size: String(pageSize),
      },
    });
  }

  async getPayrollSummary(query: PayrollQuery) {
    return this.httpClient.callNoError<PayrollSummary>({
      path: '/admin/payroll/summary',
      method: 'GET',
      params: this.payrollParams(query),
    });
  }

  async getPayrollDocumentViewUrl(documentId: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/admin/payroll/documents/${documentId}/view-url`,
      method: 'GET',
    });
  }

  async getPayrollReceiptViewUrl(documentId: string) {
    return this.httpClient.callNoError<ProofViewUrlResponse>({
      path: `/admin/payroll/documents/${documentId}/receipt/view-url`,
      method: 'GET',
    });
  }

  async exportPayrollCsv(query: PayrollQuery) {
    // Raw fetch: this download skips DansshipHttpClient, so it does not refresh a 401 or abort on resume.
    const search = new URLSearchParams(this.payrollParams(query));
    const response = await fetch(`${import.meta.env.VITE_DANSSHIP_API_URL}/admin/payroll/export.csv?${search}`, {
      method: 'GET',
      credentials: 'include',
      headers: { accept: 'text/csv' },
    });

    if (!response.ok) {
      throw new Error('Payroll export failed');
    }

    const filename = /filename="([^"]+)"/.exec(response.headers.get('content-disposition') ?? '')?.[1] ?? 'nomina.csv';
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');

    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }
}
