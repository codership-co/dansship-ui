import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowLeft } from 'react-icons/lu';
import { Link, useParams } from 'react-router';

import { Section } from '@components/containers';
import { EntryQrScreen } from '@components/modules/event-entry';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';

/** "Ver QR" / "Ver mi entrada" from Mis reservas: the buyer, the artist or the verified attendee. */
function EntradaPage() {
  const { t } = useTranslation();
  const { personId = '' } = useParams();
  const load = useCallback(() => DansshipAPI.entry.getMyCode(personId), [personId]);

  return (
    <Section navbarPadding className='pb-10'>
      <div className='mx-auto grid max-w-sm gap-4'>
        <Link
          to={PageURLS.profile.bookings}
          viewTransition
          className='inline-flex items-center gap-1 text-sm font-semibold text-primary'
        >
          <LuArrowLeft aria-hidden className='size-4' />
          {t('eventos:entry.backToBookings')}
        </Link>
        <EntryQrScreen load={load} cacheKey={personId} />
      </div>
    </Section>
  );
}

export const SecureEntradaPage = SecurityGuard(EntradaPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
