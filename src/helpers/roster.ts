import type { RosterStudent } from '@core/api';

export function rosterStudentName(student: RosterStudent, fallback = '-') {
  return student.user_full_name || student.user_name || student.user_email || fallback;
}

export function splitRosterAttendees(enrolled: Array<RosterStudent>) {
  const students: Array<RosterStudent> = [];
  const instructorAttendees: Array<RosterStudent> = [];

  for (const attendee of enrolled) {
    if (attendee.is_instructor_benefit) {
      instructorAttendees.push(attendee);
    } else {
      students.push(attendee);
    }
  }

  return { students, instructorAttendees };
}
