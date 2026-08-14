import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
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
  OccupancyFilters,
  RenewalChurnReport,
  RevenueIndicatorsReport,
  StudioRentalFunnelReport,
  StudioRentalMixReport,
  StudioRentalUtilizationReport,
  SubscriptionUsageReport,
  TaxCollectedReport,
  TrialConversionReport,
  UnderutilizedScheduleReport,
  WalletLiabilityReport,
} from './reports.models';

type DateRangeParams = {
  from_date?: string;
  to_date?: string;
};

export class ReportsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getOccupancyReport(startDate?: string, endDate?: string, filters: OccupancyFilters = {}) {
    return this.httpClient.callNoError<ClassOccupancyReport>({
      path: '/admin/reports/class-occupancy',
      method: 'GET',
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
      params: this.dateParams(startDate, endDate),
    });
  }

  async getInstructorCancellationsReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<InstructorCancellationReport>({
      path: '/admin/reports/instructor-cancellations',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<CashRevenueReport>({
      path: '/admin/reports/revenue',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getRevenueIndicators(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<RevenueIndicatorsReport>({
      path: '/admin/reports/revenue-indicators',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getTaxCollected(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<TaxCollectedReport>({
      path: '/admin/reports/tax-collected',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getWalletLiability() {
    return this.httpClient.callNoError<WalletLiabilityReport>({
      path: '/admin/reports/wallet-liability',
      method: 'GET',
    });
  }

  async getGiftValue(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<GiftValueReport>({
      path: '/admin/reports/gift-value',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getBenefitCost(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<BenefitCostReport>({
      path: '/admin/reports/benefit-cost',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getActiveStudents(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<ActiveStudentsReport>({
      path: '/admin/reports/active-students',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getAcquisition(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<AcquisitionReport>({
      path: '/admin/reports/acquisition',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getRenewalChurn(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<RenewalChurnReport>({
      path: '/admin/reports/renewal-churn',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getTrialConversion(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<TrialConversionReport>({
      path: '/admin/reports/trial-conversion',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getSubscriptionUsage(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<SubscriptionUsageReport>({
      path: '/admin/reports/subscription-usage',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalRevenue(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<CashRevenueReport>({
      path: '/admin/reports/studio-rentals/revenue',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalUtilization(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<StudioRentalUtilizationReport>({
      path: '/admin/reports/studio-rentals/utilization',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalFunnel(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<StudioRentalFunnelReport>({
      path: '/admin/reports/studio-rentals/funnel',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getStudioRentalMix(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<StudioRentalMixReport>({
      path: '/admin/reports/studio-rentals/mix',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  async getClassCancellationsReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<ClassCancellationReport>({
      path: '/admin/reports/class-cancellations',
      method: 'GET',
      params: this.dateParams(startDate, endDate),
    });
  }

  private dateParams(startDate?: string, endDate?: string): DateRangeParams {
    return {
      from_date: startDate,
      to_date: endDate,
    };
  }
}
