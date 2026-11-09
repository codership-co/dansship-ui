import type { TrialStudentWithoutPlanItem } from '@core/api/reports/reports.models';

export type TrialStudentContact =
  | { kind: 'own'; email: string }
  | { kind: 'guardian'; name: string | null; email: string }
  | { kind: 'managed-no-contact' }
  | { kind: 'none' };

/**
 * Who to contact for a trial student. A managed (minor) account has no email of
 * its own, so the guardian is the contact; without one there is nobody to reach.
 */
export function getTrialStudentContact(
  row: Pick<TrialStudentWithoutPlanItem, 'email' | 'is_managed' | 'guardian_name' | 'guardian_email'>,
): TrialStudentContact {
  if (row.email) {
    return { kind: 'own', email: row.email };
  }

  if (row.is_managed) {
    return row.guardian_email
      ? { kind: 'guardian', name: row.guardian_name, email: row.guardian_email }
      : { kind: 'managed-no-contact' };
  }

  return { kind: 'none' };
}
