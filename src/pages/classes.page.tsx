import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function ClassesPage() {
  return <main>Classes Page</main>;
}

export const SecureClassesPage = SecurityGuard(ClassesPage, {
  featureFlags: [FEATURE_FLAG.isClassesPageEnabled],
});
