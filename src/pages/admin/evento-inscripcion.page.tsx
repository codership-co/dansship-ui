import { useParams } from 'react-router';

import { ArtistSignupDetail } from '@components/modules/admin-eventos';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

function AdminEventoInscripcionPage() {
  const { eventId = '', signupId = '' } = useParams();

  return (
    <div className='mx-auto max-w-5xl px-4 py-8 pt-28 sm:pt-32'>
      <ArtistSignupDetail eventId={eventId} signupId={signupId} />
    </div>
  );
}

export const SecureAdminEventoInscripcionPage = SecurityGuard(AdminEventoInscripcionPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.eventos,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
