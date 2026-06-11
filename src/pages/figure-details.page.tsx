import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function FigureDetailsPage() {
  return <main>FigureDetails Page</main>;
}

export const SecureFigureDetailsPage = SecurityGuard(FigureDetailsPage, {
  featureFlags: [FEATURE_FLAG.isFigureDetailsPageEnabled],
});
