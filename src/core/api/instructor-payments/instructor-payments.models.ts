export type BankAccountType = 'savings' | 'checking' | 'bre_b';

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
  social_security_applicable: boolean;
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

export interface PaymentCalculationComponent {
  payment_type: string;
  assignment_id?: string;
  assignment_start_date?: string;
  assignment_end_date?: string | null;
  covered_start?: string;
  covered_end?: string;
  monthly_amount?: string;
  hourly_rate?: string;
  days_covered?: number;
  days_in_month?: number;
  hours?: string;
  subtotal?: string;
}

export interface PaymentCalculationSnapshot {
  version?: number;
  days_in_month?: number;
  components?: Array<PaymentCalculationComponent>;
}

export interface PaymentDocumentBreakdown {
  service_value: number;
  advances_discounted: number;
  advance_remainder: number;
  net: number;
  extras: Array<{
    concept: string;
    period_year: number;
    period_month: number;
    amount: number;
    event_name: string | null;
  }>;
  advances: Array<{ payment_date: string; note: string | null; amount: number }>;
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
  calculation_snapshot?: PaymentCalculationSnapshot | null;
  breakdown?: PaymentDocumentBreakdown | null;
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
  documents: Array<PaymentDocument>;
  can_generate: boolean;
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

function normalizeBreakdown(breakdown: PaymentDocumentBreakdown | null | undefined): PaymentDocumentBreakdown | null {
  if (!breakdown) return null;

  return {
    service_value: toNumber(breakdown.service_value),
    advances_discounted: toNumber(breakdown.advances_discounted),
    advance_remainder: toNumber(breakdown.advance_remainder),
    net: toNumber(breakdown.net),
    extras: (breakdown.extras ?? []).map(extra => ({ ...extra, amount: toNumber(extra.amount) })),
    advances: (breakdown.advances ?? []).map(advance => ({ ...advance, amount: toNumber(advance.amount) })),
  };
}

function normalizeDocument(document: PaymentDocument): PaymentDocument {
  return {
    ...document,
    breakdown: normalizeBreakdown(document.breakdown),
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
      documents: (month.documents ?? []).map(normalizeDocument),
      can_generate: month.can_generate ?? false,
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

export type PayrollDateField = 'issued' | 'paid';

export interface PayrollQuery {
  q?: string;
  status?: PaymentDocumentStatus;
  date_field: PayrollDateField;
  from?: string;
  to?: string;
}

export interface PayrollDocument {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  payment_type: PaymentType | 'mixed' | string;
  period_year: number;
  period_month: number;
  status: PaymentDocumentStatus | string;
  total_amount: number;
  service_value: number;
  advances_discounted: number;
  advance_remainder: number;
  paid_amount: number | null;
  issued_at: string;
  paid_at: string | null;
  has_receipt: boolean;
}

export interface PayrollDocumentsPage {
  items: Array<PayrollDocument>;
  total: number;
  page: number;
  page_size: number;
}

export function normalizePayrollDocumentsPage(data: PayrollDocumentsPage): PayrollDocumentsPage {
  return {
    ...data,
    items: (data.items ?? []).map(item => ({
      ...item,
      total_amount: toNumber(item.total_amount),
      service_value: toNumber(item.service_value),
      advances_discounted: toNumber(item.advances_discounted),
      advance_remainder: toNumber(item.advance_remainder),
      paid_amount: toNullableNumber(item.paid_amount),
    })),
  };
}

export interface PayrollSummary {
  paid_amount: number;
  paid_count: number;
  pending_amount: number;
  pending_count: number;
  total_count: number;
}

export type PayrollAdjustmentType = 'extra' | 'advance';

export type PayrollAdjustmentStatus = 'pending' | 'applied';

export interface PayrollAdjustmentQuery {
  q?: string;
  type?: PayrollAdjustmentType;
  status?: PayrollAdjustmentStatus;
  /** YYYY-MM */
  month?: string;
}

export interface PayrollAdjustment {
  id: string;
  type: PayrollAdjustmentType;
  user_id: string;
  full_name: string;
  email: string | null;
  concept: string | null;
  note: string | null;
  event_id: string | null;
  event_name: string | null;
  period_year: number | null;
  period_month: number | null;
  passes_to_year: number | null;
  passes_to_month: number | null;
  payment_date: string | null;
  amount: number;
  discounted: number;
  balance: number;
  status: PayrollAdjustmentStatus;
  document_id: string | null;
  can_edit: boolean;
  created_at: string;
}

export interface PayrollAdjustmentsSummary {
  pending_extras_amount: number;
  pending_extras_count: number;
  advances_balance_amount: number;
  advances_balance_count: number;
}

export interface PayrollAdjustmentsPage {
  items: Array<PayrollAdjustment>;
  total: number;
  page: number;
  page_size: number;
  summary: PayrollAdjustmentsSummary;
}

export interface AdjustmentEligibility {
  has_active_assignment: boolean;
  month_has_document: boolean;
}

export interface AdjustmentEventOption {
  id: string;
  name: string;
}

export interface ExtraPayload {
  period_year: number;
  period_month: number;
  concept: string;
  amount: number;
  event_id: string | null;
}

export interface CreateExtraPayload extends ExtraPayload {
  user_id: string;
}

export interface AdvancePayload {
  amount: number;
  payment_date: string;
  note: string | null;
}

export interface CreateAdvancePayload extends AdvancePayload {
  user_id: string;
}

export function normalizePayrollAdjustment(item: PayrollAdjustment): PayrollAdjustment {
  return {
    ...item,
    amount: toNumber(item.amount),
    discounted: toNumber(item.discounted),
    balance: toNumber(item.balance),
  };
}

export function normalizePayrollAdjustmentsPage(data: PayrollAdjustmentsPage): PayrollAdjustmentsPage {
  return {
    ...data,
    items: (data.items ?? []).map(normalizePayrollAdjustment),
    summary: {
      ...data.summary,
      pending_extras_amount: toNumber(data.summary?.pending_extras_amount),
      advances_balance_amount: toNumber(data.summary?.advances_balance_amount),
    },
  };
}
