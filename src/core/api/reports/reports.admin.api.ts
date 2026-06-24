import { HttpClient } from 'polpo-http-client';

import { DansshipAPIError } from '@core/api';

import type {
  AttendanceReport,
  ClassOccupancyReport,
  InstructorPerformanceReport,
  RevenueIndicatorsReport,
} from './reports.models';

export class ReportsAdminAPI {
  constructor(private readonly httpClient: HttpClient<DansshipAPIError>) {}

  async getOccupancyReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<ClassOccupancyReport>({
      path: '/admin/reports/class-occupancy',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }

  async getAttendanceReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<AttendanceReport>({
      path: '/admin/reports/attendance',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }

  async getInstructorPerformanceReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<InstructorPerformanceReport>({
      path: '/admin/reports/instructor-performance',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }

  async getRevenueReport(startDate?: string, endDate?: string) {
    return this.httpClient.callNoError<RevenueIndicatorsReport>({
      path: '/admin/reports/revenue-indicators',
      method: 'GET',
      params: {
        from_date: startDate,
        to_date: endDate,
      },
    });
  }
}
