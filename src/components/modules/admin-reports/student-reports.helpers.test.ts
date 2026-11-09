import { describe, expect, it } from 'vitest';

import { getTrialStudentContact } from './student-reports.helpers';

describe('getTrialStudentContact', () => {
  it('uses the own email of a regular student', () => {
    expect(
      getTrialStudentContact({ email: 'a@x.com', is_managed: false, guardian_name: null, guardian_email: null }),
    ).toEqual({ kind: 'own', email: 'a@x.com' });
  });

  it('falls back to the guardian for a minor without email', () => {
    expect(
      getTrialStudentContact({ email: null, is_managed: true, guardian_name: 'Ana', guardian_email: 'ana@x.com' }),
    ).toEqual({ kind: 'guardian', name: 'Ana', email: 'ana@x.com' });
  });

  it('reports no contact for a minor without an active guardian', () => {
    expect(
      getTrialStudentContact({ email: null, is_managed: true, guardian_name: null, guardian_email: null }),
    ).toEqual({ kind: 'managed-no-contact' });
  });

  it('does not throw for a non-managed row with a null email', () => {
    expect(
      getTrialStudentContact({ email: null, is_managed: false, guardian_name: null, guardian_email: null }),
    ).toEqual({ kind: 'none' });
  });
});
