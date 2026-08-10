import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI, type RbacRole } from '@core/api';
import { AdminPermissions } from '@core/permissions';
import { useCallablePromise, usePromise } from '@hooks';

interface UserRolesManagerProps {
  userId: string;
  onChanged: () => void;
}

export function UserRolesManager({ userId, onChanged }: UserRolesManagerProps) {
  const { t } = useTranslation();
  const canManageRoles = useOrPermissions(AdminPermissions.roles);
  const [selectedRoleId, setSelectedRoleId] = useState<string>('');

  const {
    response: rolesResponse,
    isLoading: isLoadingRoles,
    error: rolesError,
  } = usePromise(() => DansshipAPI.rbacAdmin.listRoles(), canManageRoles);

  const {
    response: userRolesResponse,
    isLoading: isLoadingUserRoles,
    error: userRolesError,
    reFetch: reFetchUserRoles,
  } = usePromise(() => DansshipAPI.rbacAdmin.getUserRoles(userId), canManageRoles && Boolean(userId), [userId]);

  const { call: assignRole, isLoading: isAssigning } = useCallablePromise((roleId: string) =>
    DansshipAPI.rbacAdmin.assignRole(userId, roleId),
  );
  const { call: revokeRole, isLoading: isRevoking } = useCallablePromise((roleId: string) =>
    DansshipAPI.rbacAdmin.revokeRole(userId, roleId),
  );

  const assignedRoles = useMemo(() => userRolesResponse?.data?.roles ?? [], [userRolesResponse]);
  const assignedRoleIds = useMemo(() => new Set(assignedRoles.map(role => role.id)), [assignedRoles]);
  const availableRoles = useMemo(
    () => (rolesResponse?.data ?? []).filter(role => !assignedRoleIds.has(role.id)),
    [rolesResponse, assignedRoleIds],
  );

  if (!canManageRoles) {
    return null;
  }

  const isLoading = isLoadingRoles || isLoadingUserRoles;
  const hasError = Boolean(rolesError) || Boolean(userRolesError) || Boolean(rolesResponse && !rolesResponse.ok);
  const isBusy = isAssigning || isRevoking;

  const handleAssign = async () => {
    if (!selectedRoleId) {
      return;
    }

    try {
      const response = await assignRole(selectedRoleId);

      if (!response.ok) {
        toast.error(t('admin:users.details.roles.assignFailed'));

        return;
      }

      setSelectedRoleId('');
      toast.success(t('admin:users.details.roles.assignSuccess'));
      await reFetchUserRoles();
      onChanged();
    } catch {
      toast.error(t('admin:users.details.roles.assignFailed'));
    }
  };

  const handleRevoke = async (role: RbacRole) => {
    try {
      const response = await revokeRole(role.id);

      if (!response.ok) {
        toast.error(t('admin:users.details.roles.revokeFailed'));

        return;
      }

      toast.success(t('admin:users.details.roles.revokeSuccess', { role: role.name }));
      await reFetchUserRoles();
      onChanged();
    } catch {
      toast.error(t('admin:users.details.roles.revokeFailed'));
    }
  };

  return (
    <section className='rounded-[calc(var(--radius)+4px)] bg-background-paper p-5'>
      <div className='mb-4'>
        <h3 className='text-sm font-semibold text-foreground'>{t('admin:users.details.roles.title')}</h3>
        <p className='mt-1 text-sm text-muted-foreground'>{t('admin:users.details.roles.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className='flex justify-center py-6'>
          <SpinnerLoader />
        </div>
      ) : hasError ? (
        <p className='text-sm text-alert-600'>{t('admin:users.details.roles.loadFailed')}</p>
      ) : (
        <div className='grid gap-4'>
          <div className='flex flex-wrap gap-2'>
            {assignedRoles.length > 0 ? (
              assignedRoles.map(role => (
                <div
                  key={role.id}
                  className='flex items-center gap-2 rounded-(--radius) bg-[hsl(var(--surface-container-highest))] px-2 py-1'
                >
                  <span className='text-sm text-foreground'>{role.name}</span>
                  <button
                    type='button'
                    className='text-xs text-muted-foreground hover:text-alert-600 disabled:opacity-50'
                    disabled={isBusy}
                    onClick={() => void handleRevoke(role)}
                  >
                    {t('admin:users.details.roles.revoke')}
                  </button>
                </div>
              ))
            ) : (
              <span className='text-sm text-muted-foreground'>{t('admin:users.noRoles')}</span>
            )}
          </div>

          <div className='flex flex-col gap-2 sm:flex-row sm:items-end'>
            <div className='w-full sm:max-w-xs'>
              <label className='text-xs font-medium text-muted-foreground'>
                {t('admin:users.details.roles.assignLabel')}
              </label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={isBusy || availableRoles.length === 0}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue placeholder={t('admin:users.details.roles.assignPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {availableRoles.map(role => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                      {role.description ? ` — ${role.description}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type='button' disabled={!selectedRoleId || isBusy} onClick={() => void handleAssign()}>
              {t('admin:users.details.roles.assign')}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
