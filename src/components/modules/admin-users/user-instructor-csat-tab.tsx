import { ClassFeedbackTable } from '@components/modules/admin-reports/class-feedback-table';

export function UserInstructorCsatTab({ instructorId }: { instructorId: string }) {
  return <ClassFeedbackTable instructorId={instructorId} hideInstructorColumn />;
}
