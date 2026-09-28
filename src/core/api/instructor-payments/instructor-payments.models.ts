export type BankAccountType = 'savings' | 'checking';

export type PaymentType = 'hourly_classes' | 'fixed_amount';

export type PaymentDocumentKind = 'rut' | 'bank-certificate' | 'signature' | 'social-security';

export type PaymentDocumentStatus = 'issued' | 'confirmed' | 'disputed' | 'paid' | 'voided';

export type PaymentMonthStatus = 'issued' | 'confirmed' | 'disputed' | 'paid' | 'available' | 'blocked' | 'in_progress';

export type PaymentDocumentContentType = 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/webp';

export const PaymentDocumentContentTypes: Array<PaymentDocumentContentType> = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
];

export const SignatureContentTypes: Array<Exclude<PaymentDocumentContentType, 'application/pdf'>> = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

export interface PaymentProfile {
  user_id: string;
  payment_type: PaymentType | null;
  has_rut: boolean;
  has_bank_certificate: boolean;
  has_signature: boolean;
  has_social_security: boolean;
  bank_name: string | null;
  account_type: BankAccountType | string | null;
  account_number: string | null;
  is_complete: boolean;
  missing_requirements: Array<string>;
  cuenta_de_cobro_enabled: boolean;
}

export interface PaymentProfileUpdatePayload {
  rut_file_key?: string | null;
  bank_certificate_file_key?: string | null;
  signature_file_key?: string | null;
  social_security_file_key?: string | null;
  bank_name?: string | null;
  account_type?: BankAccountType | null;
  account_number?: string | null;
}

export interface PaymentDocumentLineItem {
  scheduled_class_id: string;
  class_date: string;
  class_name: string;
  hours: number;
}

export interface PaymentDocument {
  id: string;
  user_id: string;
  period_year: number;
  period_month: number;
  payment_type: PaymentType | string;
  status: PaymentDocumentStatus | string;
  issued_at: string;
  issued_by_user_id: string | null;
  hourly_rate_snapshot: number | null;
  total_hours: number;
  total_amount: number;
  instructor_full_name_snapshot: string;
  document_type_snapshot: string;
  document_value_snapshot: string;
  bank_name_snapshot: string;
  account_type_snapshot: string;
  account_number_snapshot: string;
  line_items: Array<PaymentDocumentLineItem>;
  amount_in_words_snapshot: string;
  confirmed_at?: string | null;
  confirmed_by_user_id?: string | null;
  disputed_at?: string | null;
  disputed_by_user_id?: string | null;
  dispute_reason?: string | null;
  paid_at?: string | null;
  paid_by_user_id?: string | null;
  payment_receipt_file_key?: string | null;
  voided_at: string | null;
  voided_by_user_id: string | null;
  void_reason: string | null;
  created_at: string;
}

export interface PaymentMonthSummary {
  year: number;
  month: number;
  status: PaymentMonthStatus;
  missing_requirements: Array<string>;
  issued_document: PaymentDocument | null;
}

export interface PaymentDocumentListResponse {
  profile: PaymentProfile;
  months: Array<PaymentMonthSummary>;
}

export interface GeneratePaymentDocumentPayload {
  year: number;
  month: number;
}

export interface AdminPaymentDocumentsResponse {
  profile: PaymentProfile;
  documents: Array<PaymentDocument>;
  payable_document_id: string | null;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') return value;

  return Number(value) || 0;
}

function toNullableNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === '') return null;

  return toNumber(value);
}

function normalizeDocument(document: PaymentDocument): PaymentDocument {
  return {
    ...document,
    hourly_rate_snapshot: toNullableNumber(document.hourly_rate_snapshot as unknown as string),
    total_hours: toNumber(document.total_hours as unknown as string),
    total_amount: toNumber(document.total_amount as unknown as string),
    line_items: (document.line_items ?? []).map(item => ({
      ...item,
      hours: toNumber(item.hours as unknown as string),
    })),
  };
}

export function normalizePaymentDocumentList(data: PaymentDocumentListResponse): PaymentDocumentListResponse {
  return {
    ...data,
    months: (data.months ?? []).map(month => ({
      ...month,
      missing_requirements: month.missing_requirements ?? [],
      issued_document: month.issued_document ? normalizeDocument(month.issued_document) : null,
    })),
  };
}

export function normalizeAdminPaymentDocuments(data: AdminPaymentDocumentsResponse): AdminPaymentDocumentsResponse {
  return {
    ...data,
    documents: (data.documents ?? []).map(normalizeDocument),
  };
}

export function normalizeGeneratedDocument(data: PaymentDocument): PaymentDocument {
  return normalizeDocument(data);
}

export type PaymentAssignmentState = 'active' | 'scheduled' | 'ended';

export interface PaymentAssignment {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  payment_type: PaymentType;
  amount: number;
  start_date: string;
  end_date: string | null;
  state: PaymentAssignmentState;
  created_at: string;
  updated_at: string;
}

export interface PaymentAssignmentListResponse {
  items: Array<PaymentAssignment>;
}

export interface CreatePaymentAssignmentPayload {
  user_id: string;
  payment_type: PaymentType;
  amount: number;
  start_date: string;
  end_date: string | null;
}

export interface UpdatePaymentAssignmentPayload {
  payment_type: PaymentType;
  amount: number;
  start_date: string;
  end_date: string | null;
}

export function normalizePaymentAssignment(data: PaymentAssignment): PaymentAssignment {
  return {
    ...data,
    amount: toNumber(data.amount as unknown as string),
  };
}

export function normalizePaymentAssignmentList(data: PaymentAssignmentListResponse): PaymentAssignmentListResponse {
  return {
    items: (data.items ?? []).map(normalizePaymentAssignment),
  };
}
