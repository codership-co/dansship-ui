import type { RosterStudent, WorkshopRosterEntry } from '@core/api';

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

export interface WorkshopRosterGroup {
  purchaseId: string;
  members: Array<WorkshopRosterEntry>;
}

export function groupWorkshopRosterByPurchase(rows: Array<WorkshopRosterEntry>): Array<WorkshopRosterGroup> {
  const order: Array<string> = [];
  const membersByPurchase = new Map<string, Array<WorkshopRosterEntry>>();

  for (const row of rows) {
    const existing = membersByPurchase.get(row.purchase_id);

    if (existing) {
      existing.push(row);

      continue;
    }

    membersByPurchase.set(row.purchase_id, [row]);
    order.push(row.purchase_id);
  }

  return order.map(purchaseId => ({
    purchaseId,
    members: membersByPurchase.get(purchaseId) ?? [],
  }));
}
