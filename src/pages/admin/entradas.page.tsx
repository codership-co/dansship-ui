import { useParams } from 'react-router';

import { DoorEventList, DoorValidation } from '@components/modules/event-entry';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';

const DOOR_GUARD = {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  andPermissions: [PERMISSION.EVENT_ENTRY_VALIDATE],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
};

function AdminEntradasPage() {
  return (
    <div className='px-4 pt-28 pb-10 sm:pt-32'>
      <DoorEventList />
    </div>
  );
}

function AdminEntradaValidarPage() {
  const { eventId = '' } = useParams();

  return (
    <div className='px-4 pt-28 pb-10 sm:pt-32'>
      <DoorValidation eventId={eventId} />
    </div>
  );
}

export const SecureAdminEntradasPage = SecurityGuard(AdminEntradasPage, DOOR_GUARD);
export const SecureAdminEntradaValidarPage = SecurityGuard(AdminEntradaValidarPage, DOOR_GUARD);
