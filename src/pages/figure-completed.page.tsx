import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function FigureCompletedPage() {
  return <main>FigureCompleted Page</main>;
}

export const SecureFigureCompletedPage = SecurityGuard(FigureCompletedPage, {
  featureFlags: [FEATURE_FLAG.isFigureCompletedPageEnabled],
});
