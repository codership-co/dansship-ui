import { useParams } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { EventoEditForm } from '@components/modules/admin-eventos';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function AdminEventoEditPage() {
  const { eventId } = useParams();
  const isNew = !eventId || eventId === 'new';
  const { response, isLoading } = usePromise(() => DansshipAPI.eventosAdmin.getEvent(eventId ?? ''), !isNew, [eventId]);

  if (!isNew && (isLoading || response === null)) {
    return (
      <div className='px-4 py-20'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl px-4 py-8 pt-28 sm:pt-32'>
      <EventoEditForm event={isNew ? undefined : (response?.data ?? undefined)} />
    </div>
  );
}

export const SecureAdminEventoEditPage = SecurityGuard(AdminEventoEditPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.eventos,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
