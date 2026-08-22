export type BankAccountType = 'savings' | 'checking';

export type PaymentDocumentKind = 'rut' | 'bank-certificate' | 'signature';

export type PaymentDocumentStatus = 'issued' | 'voided';

export type PaymentMonthStatus = 'issued' | 'available' | 'blocked' | 'in_progress';

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
  instructor_profile_id: string;
  has_rut: boolean;
  has_bank_certificate: boolean;
  has_signature: boolean;
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
  bank_name?: string | null;
  account_type?: BankAccountType | null;
  account_number?: string | null;
}

export interface AdminPaymentProfileUpdatePayload {
  cuenta_de_cobro_enabled: boolean;
}

export interface PaymentDocumentLineItem {
  scheduled_class_id: string;
  class_date: string;
  class_name: string;
  hours: number;
}

export interface PaymentDocument {
  id: string;
  instructor_profile_id: string;
  period_year: number;
  period_month: number;
  status: PaymentDocumentStatus | string;
  issued_at: string;
  issued_by_user_id: string | null;
  hourly_rate_snapshot: number;
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

export interface InstructorPayRate {
  id: string;
  hourly_amount: number;
  effective_from: string;
  effective_to: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PayRateListResponse {
  current: InstructorPayRate | null;
  history: Array<InstructorPayRate>;
}

export interface SetPayRatePayload {
  hourly_amount: number;
}

function toNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;

  if (typeof value === 'number') return value;

  return Number(value) || 0;
}

function normalizeDocument(document: PaymentDocument): PaymentDocument {
  return {
    ...document,
    hourly_rate_snapshot: toNumber(document.hourly_rate_snapshot as unknown as string),
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

export function normalizePayRate(data: InstructorPayRate): InstructorPayRate {
  return {
    ...data,
    hourly_amount: toNumber(data.hourly_amount as unknown as string),
  };
}

export function normalizePayRateList(data: PayRateListResponse): PayRateListResponse {
  return {
    current: data.current ? normalizePayRate(data.current) : null,
    history: (data.history ?? []).map(normalizePayRate),
  };
}

export function normalizeGeneratedDocument(data: PaymentDocument): PaymentDocument {
  return normalizeDocument(data);
}
