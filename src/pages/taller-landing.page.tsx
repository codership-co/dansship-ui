import { useParams, useSearchParams } from 'react-router';

import { Section } from '@components/containers';
import { TallerLanding } from '@components/modules/talleres';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function TallerLandingPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const preview = params.get('preview') === '1';

  return (
    <Section navbarPadding>
      <TallerLanding slug={slug} preview={preview} />
    </Section>
  );
}

export const SecureTallerLandingPage = SecurityGuard(TallerLandingPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
});
