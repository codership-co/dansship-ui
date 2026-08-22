export interface ClassOccupancyItem {
  scheduled_class_id: string;
  class_name: string;
  instructor: string;
  instructor_name?: string | null;
  room: string;
  class_date: string;
  start_time?: string;
  capacity: number;
  enrolled: number;
  fill_rate: number;
}

export interface GroupedOccupancyItem {
  class_name: string;
  total_capacity: number;
  total_enrolled: number;
  sessions: number;
  average_fill_rate: number;
}

export type OccupancyDetailSort = 'date_desc' | 'fill_rate_desc' | 'fill_rate_asc' | 'class_name_asc';

export interface OccupancyFilters {
  classType?: string;
  roomId?: string;
  instructorId?: string;
}

export interface ClassOccupancyReport {
  items: Array<ClassOccupancyItem>;
  average_fill_rate: number;
}

export interface AttendanceTrendPoint {
  week: string;
  attended: number;
  no_show: number;
  attendance_rate: number;
  no_show_rate: number;
}

export interface AttendanceReport {
  trend: Array<AttendanceTrendPoint>;
}

export interface RevenueByPlanItem {
  plan_name: string;
  subscription_count: number;
  gross_revenue: string;
  net_revenue: string;
  discount_impact: string;
}

export interface RevenueTrendPoint {
  week: string;
  subscription_count: number;
  gross_revenue: string;
  net_revenue: string;
}

export interface RevenueIndicatorsReport {
  by_plan: Array<RevenueByPlanItem>;
  trend: Array<RevenueTrendPoint>;
}

export interface MoneyTotals {
  intent_count: number;
  cash_collected: string;
  wallet_applied: string;
  recognized_total: string;
  tax_collected: string;
}

export interface CashRevenueByTypeItem extends MoneyTotals {
  purchase_type: string;
}

export interface CashRevenueTrendPoint extends MoneyTotals {
  week: string;
  purchase_type: string;
}

export interface CashRevenueReport {
  totals: MoneyTotals;
  by_purchase_type: Array<CashRevenueByTypeItem>;
  trend: Array<CashRevenueTrendPoint>;
}

export interface TaxCollectedByTypeItem {
  tax_type_name: string | null;
  tax_collected: string;
  intent_count: number;
}

export interface TaxCollectedTrendPoint {
  week: string;
  tax_collected: string;
  intent_count: number;
}

export interface TaxCollectedReport {
  total_tax_collected: string;
  by_tax_type: Array<TaxCollectedByTypeItem>;
  trend: Array<TaxCollectedTrendPoint>;
}

export interface WalletLiabilityReport {
  outstanding_liability: string;
  positive_balance_users: number;
}

export interface GiftValueByStatusItem {
  status: string;
  gift_count: number;
  value: string;
}

export interface GiftValueReport {
  pending_claim: GiftValueByStatusItem;
  claimed: GiftValueByStatusItem;
  expired: GiftValueByStatusItem;
}

export interface BenefitCostCounts {
  trial_classes_granted: number;
  bonus_allowances_granted: number;
  bonus_classes_granted: number;
  monetary_benefits_applied: number;
  monetary_discount_total: string;
}

export interface BenefitCostReport {
  counts: BenefitCostCounts;
}

export interface ActiveStudentsTrendPoint {
  week: string;
  unique_students: number;
}

export interface ActiveStudentsReport {
  trend: Array<ActiveStudentsTrendPoint>;
}

export interface AcquisitionTrendPoint {
  week: string;
  trial_students: number;
  paying_students: number;
}

export interface AcquisitionReport {
  trend: Array<AcquisitionTrendPoint>;
}

export interface RenewalChurnTrendPoint {
  week: string;
  renewals: number;
  churned: number;
}

export interface RenewalChurnReport {
  trend: Array<RenewalChurnTrendPoint>;
}

export interface TrialConversionReport {
  trial_students: number;
  converted_students: number;
  conversion_rate: number;
}

export interface SubscriptionUsageReport {
  active_subscriptions: number;
  total_remaining_classes: number;
  average_remaining_classes: number;
  expiration_rate: number;
  renewal_rate: number;
}

export interface UnderutilizedScheduleItem {
  scheduled_class_id: string;
  class_name: string;
  instructor_name: string | null;
  room: string;
  start_time: string;
  capacity: number;
  enrolled: number;
  fill_rate: number;
}

export interface UnderutilizedScheduleReport {
  items: Array<UnderutilizedScheduleItem>;
}

export interface StudioRentalUtilizationRow {
  room_id: string;
  room_name: string;
  available_hours: number;
  booked_hours: number;
  utilization_rate: number;
}

export interface StudioRentalUtilizationReport {
  items: Array<StudioRentalUtilizationRow>;
  totals: StudioRentalUtilizationRow;
}

export interface StudioRentalFunnelCounts {
  pending_payment: number;
  confirmed: number;
  cancelled: number;
}

export interface StudioRentalFunnelReport {
  requests: StudioRentalFunnelCounts;
  series: StudioRentalFunnelCounts;
  request_confirmation_rate: number;
  series_confirmation_rate: number;
}

export interface StudioRentalMixItem {
  kind: string;
  count: number;
  total_price: string;
}

export interface StudioRentalMixReport {
  items: Array<StudioRentalMixItem>;
}

export interface InstructorPerformanceRow {
  instructor_id: string;
  instructor_name: string;
  classes_taught: number;
  hours_taught: number;
  occupancy_rate: number;
  attendance_reliability: number;
  cancellation_rate: number;
  student_retention: number;
}

export interface InstructorPerformanceReport {
  items: Array<InstructorPerformanceRow>;
}

export interface InstructorCancellationReasonItem {
  reason: string;
  count: number;
}

export interface InstructorCancellationTrendPoint {
  week: string;
  cancellation_count: number;
}

export interface InstructorCancellationReport {
  total_cancellations: number;
  per_instructor: Record<string, number>;
  reason_breakdown: Array<InstructorCancellationReasonItem>;
  trend: Array<InstructorCancellationTrendPoint>;
}

export interface ClassCancellationItem {
  scheduled_class_id: string;
  class_name: string;
  instructor_id: string | null;
  room: string;
  start_time: string;
  cancelled_at: string;
  cancelled_by_user_id: string | null;
  cancellation_note: string | null;
}

export interface ClassCancellationTrendPoint {
  week: string;
  cancellation_count: number;
}

export interface ClassCancellationReport {
  total_cancellations: number;
  items: Array<ClassCancellationItem>;
  trend: Array<ClassCancellationTrendPoint>;
}
