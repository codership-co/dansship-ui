import { REPORT_GET_TIMEOUT_MS, type DansshipHttpClient } from '../dansship-http-client';

import type {
  ActiveStudentsListReport,
  ActiveStudentsReport,
  AcquisitionReport,
  AttendanceReport,
  BenefitCostReport,
  CashRevenueReport,
  ClassCancellationReport,
  ClassOccupancyReport,
  GiftValueReport,
  InstructorCancellationReport,
  InstructorPerformanceReport,
  NetRevenueByClassTypeReport,
  OccupancyFilters,
  PendingDuoAssignmentsReport,
  RenewalChurnReport,
  RevenueIndicatorsReport,
  StudioRentalFunnelReport,
  StudioRentalMixReport,
  StudioRentalUtilizationReport,
  SubscriptionUsageReport,
  TaxCollectedReport,
  ClassRecoveryReport,
  PromotionCostReport,
  TrialConversionReport,
  TrialStudentsWithoutPlanReport,
  UnderutilizedScheduleReport,
  WalletLiabilityReport,
  EventFillReport,
  EventRevenueReport,
} from './reports.models';

type DateRangeParams = {
  from_date?: string;
  to_date?: string;
};

export class ReportsAdminAPI {
  constructor(private readonly httpClient: DansshipHttpClient) {}

  async getOccupancyReport(startDate?: string, endDate?: string, filters: OccupancyFilters = {}) {
    return this.httpClient.callNoError<ClassOccupancyReport>({
      path: '/admin/reports/class-occupancy',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: {
        ...this.dateParams(startDate, endDate),
        class_type: filters.classType,
        room_id: filters.roomId,
        instructor_id: filters.instructorId,
      },
    });
  }

  async getAttendanceReport(startDate?: string, endDate?: string, filters: OccupancyFilters = {}) {
    return this.httpClient.callNoError<AttendanceReport>({
      path: '/admin/reports/attendance',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: {
        ...this.dateParams(startDate, endDate),
        class_type: filters.classType,
        room_id: filters.roomId,
        instructor_id: filters.instructorId,
      },
    });
  }

  async getUnderutilizedSchedule(startDate?: string, endDate?: string, filters: OccupancyFilters = {}) {
    return this.httpClient.callNoError<UnderutilizedScheduleReport>({
      path: '/admin/reports/underutilized-schedule',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: {
        ...this.dateParams(startDate, endDate),
        room_id: filters.roomId,
        instructor_id: filters.instructorId,
      },
    });
  }

  async getInstructorPerformanceReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<InstructorPerformanceReport>({
      path: '/admin/reports/instructor-performance',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getInstructorCancellationsReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<InstructorCancellationReport>({
      path: '/admin/reports/instructor-cancellations',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<CashRevenueReport>({
      path: '/admin/reports/revenue',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getRevenueIndicators(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<RevenueIndicatorsReport>({
      path: '/admin/reports/revenue-indicators',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getClassRecoveryReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<ClassRecoveryReport>({
      path: '/admin/reports/class-recovery',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getTaxCollected(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<TaxCollectedReport>({
      path: '/admin/reports/tax-collected',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getWalletLiability() {
    return this.httpClient.callNoError<WalletLiabilityReport>({
      path: '/admin/reports/wallet-liability',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
    });
  }

  async getGiftValue(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<GiftValueReport>({
      path: '/admin/reports/gift-value',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getBenefitCost(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<BenefitCostReport>({
      path: '/admin/reports/benefit-cost',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getActiveStudents(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<ActiveStudentsReport>({
      path: '/admin/reports/active-students',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getAcquisition(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<AcquisitionReport>({
      path: '/admin/reports/acquisition',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getRenewalChurn(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<RenewalChurnReport>({
      path: '/admin/reports/renewal-churn',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getTrialConversion(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<TrialConversionReport>({
      path: '/admin/reports/trial-conversion',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getTrialStudentsWithoutPlan(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<TrialStudentsWithoutPlanReport>({
      path: '/admin/reports/trial-students-without-plan',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getPendingDuoAssignments() {
    return this.httpClient.callNoError<PendingDuoAssignmentsReport>({
      path: '/admin/reports/pending-duo-assignments',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
    });
  }

  async getActiveStudentsList(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<ActiveStudentsListReport>({
      path: '/admin/reports/active-students-list',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async exportActiveStudentsCsv() {
    await this.downloadCsv('/admin/reports/active-students-list.csv', 'estudiantes-activos.csv');
  }

  async getPromotionCost(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<PromotionCostReport>({
      path: '/admin/reports/promotion-cost',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async exportPromotionCostCsv(startDate?: string, endDate?: string) {
    await this.downloadCsv('/admin/reports/promotion-cost.csv', 'costo-de-campana.csv', {
      from_date: startDate,
      to_date: endDate,
    });
  }

  async getNetRevenueByClassType(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<NetRevenueByClassTypeReport>({
      path: '/admin/reports/net-revenue-by-class-type',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getSubscriptionUsage(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<SubscriptionUsageReport>({
      path: '/admin/reports/subscription-usage',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalRevenue(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<CashRevenueReport>({
      path: '/admin/reports/studio-rentals/revenue',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalUtilization(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<StudioRentalUtilizationReport>({
      path: '/admin/reports/studio-rentals/utilization',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalFunnel(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<StudioRentalFunnelReport>({
      path: '/admin/reports/studio-rentals/funnel',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalMix(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<StudioRentalMixReport>({
      path: '/admin/reports/studio-rentals/mix',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  async getEventRevenue(startDate?: string, endDate?: string, eventType?: string) {
    return this.httpClient.callNoError<EventRevenueReport>({
      path: '/admin/reports/events/revenue',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: {
        ...this.dateParams(startDate, endDate),
        ...(eventType ? { type: eventType } : {}),
      },
    });
  }

  async getEventFill(startDate?: string, endDate?: string, eventType?: string) {
    return this.httpClient.callNoError<EventFillReport>({
      path: '/admin/reports/events/fill',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: {
        ...this.dateParams(startDate, endDate),
        ...(eventType ? { type: eventType } : {}),
      },
    });
  }

  async getClassCancellationsReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<ClassCancellationReport>({
      path: '/admin/reports/class-cancellations',
      method: 'GET',
      timeoutMs: REPORT_GET_TIMEOUT_MS,
      params: this.dateParams(startDate, endDate),
    });
  }

  /** Raw fetch: a download skips DansshipHttpClient, so it does not refresh a 401 or abort on resume. */
  private async downloadCsv(path: string, filename: string, params: Record<string, string | undefined> = {}) {
    const query = new URLSearchParams(
      Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
    ).toString();
    const response = await fetch(`${import.meta.env.VITE_DANSSHIP_API_URL}${path}${query ? `?${query}` : ''}`, {
      method: 'GET',
      credentials: 'include',
      headers: { accept: 'text/csv' },
    });

    if (!response.ok) {
      throw new Error(`CSV export failed: ${path}`);
    }

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

  private dateParams(startDate?: string, endDate?: string): DateRangeParams {
    return {
      from_date: startDate,
      to_date: endDate,
    };
  }
}
