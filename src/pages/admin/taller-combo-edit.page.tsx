import { useParams } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { ComboEditForm } from '@components/modules/admin-talleres';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function AdminTallerComboEditPage() {
  const { comboId } = useParams();
  const isNew = !comboId || comboId === 'new';
  const { response, isLoading } = usePromise(() => DansshipAPI.talleresAdmin.getCombo(comboId ?? ''), !isNew, [
    comboId,
  ]);

  if (!isNew && (isLoading || response === null)) {
    return (
      <div className='px-4 py-20'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='mx-auto max-w-5xl px-4 py-8 pt-28 sm:pt-32'>
      <ComboEditForm combo={isNew ? undefined : (response?.data ?? undefined)} />
    </div>
  );
}

export const SecureAdminTallerComboEditPage = SecurityGuard(AdminTallerComboEditPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.talleres,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
