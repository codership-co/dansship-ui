export interface ClassOccupancyItem {
  scheduled_class_id: string;
  class_name: string;
  instructor: string;
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
