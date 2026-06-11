import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function FigureSavedPage() {
  return <main>FigureSaved Page</main>;
}

export const SecureFigureSavedPage = SecurityGuard(FigureSavedPage, {
  featureFlags: [FEATURE_FLAG.isFigureSavedPageEnabled],
});
