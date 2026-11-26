import { ClassFeedbackTable } from '@components/modules/admin-reports/class-feedback-table';

/** Ratings that belong to the student, including the ones their guardian made for a managed minor. */
export function UserStudentCsatTab({ userId }: { userId: string }) {
  return <ClassFeedbackTable studentId={userId} />;
}
