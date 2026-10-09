import { useParams, useSearchParams } from 'react-router';

import { Section } from '@components/containers';
import { EventoLanding } from '@components/modules/eventos';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';

function EventoLandingPage() {
  const { slug = '' } = useParams();
  const [params] = useSearchParams();
  const preview = params.get('preview') === '1';

  return (
    <Section navbarPadding>
      <EventoLanding slug={slug} preview={preview} />
    </Section>
  );
}

export const SecureEventoLandingPage = SecurityGuard(EventoLandingPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
});
