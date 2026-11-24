import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { EventWorkspace, EventoEditForm } from '@components/modules/admin-eventos';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function AdminEventoEditPage() {
  const { t } = useTranslation();
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

  const event = isNew ? undefined : (response?.data ?? undefined);
  // The editor is chosen by the configuration model, never by the event label.
  const isLegacy = Boolean(event && event.configuration_model !== 'participant_types');

  return (
    <div className='mx-auto max-w-5xl px-4 py-8 pt-28 sm:pt-32'>
      {!isNew && !event ? <p className='text-center text-muted-foreground'>{t('eventos:landing.notFound')}</p> : null}
      {event && isLegacy ? <EventoEditForm event={event} /> : null}
      {isNew || (event && !isLegacy) ? <EventWorkspace key={eventId ?? 'new'} event={event} /> : null}
    </div>
  );
}

export const SecureAdminEventoEditPage = SecurityGuard(AdminEventoEditPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.eventos,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
