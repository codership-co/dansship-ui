import { HttpClient } from '@core/http-client';

import type {
  AttendanceReport,
  ClassOccupancyReport,
  InstructorPerformanceReport,
  RevenueIndicatorsReport,
} from './reports.models';

export class ReportsAPI {
  constructor(private readonly httpClient: HttpClient) {}

  async getOccupancyReport(startDate?: string, endDate?: string) {
    return this.httpClient.call<ClassOccupancyReport>({
      path: '/admin/reports/class-occupancy',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }

  async getAttendanceReport(startDate?: string, endDate?: string) {
    return this.httpClient.call<AttendanceReport>({
      path: '/admin/reports/attendance',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }

  async getInstructorPerformanceReport(startDate?: string, endDate?: string) {
    return this.httpClient.call<InstructorPerformanceReport>({
      path: '/admin/reports/instructor-performance',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    return this.httpClient.call<RevenueIndicatorsReport>({
      path: '/admin/reports/revenue-indicators',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }
}
