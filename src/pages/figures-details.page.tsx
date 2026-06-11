import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function FiguresDetailsPage() {
  return <main>FiguresDetails Page</main>;
}

export const SecureFiguresDetailsPage = SecurityGuard(FiguresDetailsPage, {
  featureFlags: [FEATURE_FLAG.isFiguresDetailsPageEnabled],
});
