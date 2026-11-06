import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useOrPermissions } from '@contexts';
import { PageURLS } from '@core/constants';
import { AdminPermissions, AssistedPagePermissions } from '@core/permissions';

interface UserRegistrationActionsProps {
  userId: string;
}

export function UserRegistrationActions({ userId }: UserRegistrationActionsProps) {
  const { t } = useTranslation();
  const canRegister = useOrPermissions(AdminPermissions.userRegistration);
  const canAssist = useOrPermissions(AssistedPagePermissions);

  if (!canRegister && !canAssist) {
    return null;
  }

  return (
    <div className='flex flex-wrap gap-2'>
      {canAssist ? (
        <Link to={PageURLS.admin.assistedFor(userId)}>
          <Button color='primary' variant='solid' size='small'>
            {t('admin:users.registration.assist')}
          </Button>
        </Link>
      ) : null}
      {canRegister ? (
        <Link to={PageURLS.admin.userEdit(userId)}>
          <Button color='primary' variant='outlined' size='small'>
            {t('admin:users.registration.edit')}
          </Button>
        </Link>
      ) : null}
    </div>
  );
}
