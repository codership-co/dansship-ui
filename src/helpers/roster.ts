import type { RosterStudent } from '@core/api';

export function rosterStudentName(student: RosterStudent, fallback = '-') {
  return student.user_full_name || student.user_name || student.user_email || fallback;
}
