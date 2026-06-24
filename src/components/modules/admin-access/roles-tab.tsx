import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { AssignPolicyToRolePayload, DansshipAPI } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

export function RolesTab() {
  const { t } = useTranslation();
  const { response: roles, isLoading: isLoadingRoles } = usePromise(() => DansshipAPI.rbacAdmin.getRoles());
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  if (isLoadingRoles) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('rbac:roles.title')}</h2>
      </div>

      <div className='border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common:name')}</TableHead>
              <TableHead>{t('common:description')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!roles?.ok || roles?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className='text-center py-4 text-gray-500'>
                  {t('rbac:roles.empty')}
                </TableCell>
              </TableRow>
            ) : (
              roles.data.map(role => (
                <TableRow key={role.id}>
                  <TableCell className='font-medium'>{role.name}</TableCell>
                  <TableCell className='text-sm text-gray-600'>{role.description || '-'}</TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button size='sm' onClick={() => setSelectedRoleId(role.id)}>
                      {t('rbac:roles.managePolicies')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedRoleId && (
        <RolePoliciesModal roleId={selectedRoleId} isOpen={!!selectedRoleId} onClose={() => setSelectedRoleId(null)} />
      )}
    </div>
  );
}

function RolePoliciesModal({ roleId, isOpen, onClose }: { roleId: string; isOpen: boolean; onClose: () => void }) {
  const { t } = useTranslation();
  const { response: roleDetail, isLoading: isLoadingRole } = usePromise(() =>
    DansshipAPI.rbacAdmin.getRoleDetail(roleId),
  );
  const { response: allPolicies, isLoading: isLoadingPolicies } = usePromise(() => DansshipAPI.rbacAdmin.getPolicies());

  const { call: assignPolicy, isLoading: isAssigning } = useCallablePromise(
    (roleId: string, payload: AssignPolicyToRolePayload) => DansshipAPI.rbacAdmin.assignPolicyToRole(roleId, payload),
  );
  const { call: revokePolicy, isLoading: isRevoking } = useCallablePromise((roleId: string, policyId: string) =>
    DansshipAPI.rbacAdmin.revokePolicyFromRole(roleId, policyId),
  );

  const handleAssign = (policyId: string) => {
    void assignPolicy(roleId, { policy_id: policyId });
  };

  const handleRevoke = (policyId: string) => {
    void revokePolicy(roleId, policyId);
  };

  const isLoading = isLoadingRole || isLoadingPolicies;

  // Filter out policies that are already assigned
  const availablePolicies =
    allPolicies?.data?.filter(p => !roleDetail?.data?.policies.some(rp => rp.id === p.id)) || [];

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-[600px] max-h-[80vh] flex flex-col'>
        <DialogHeader>
          <DialogTitle>{t('rbac:roles.managePoliciesFor', { name: roleDetail?.data?.name || 'Role' })}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className='py-8 flex justify-center'>
            <SpinnerLoader />
          </div>
        ) : (
          <div className='flex-1 overflow-y-auto space-y-6 py-4'>
            <div>
              <h3 className='text-sm font-semibold mb-2 text-gray-700'>{t('rbac:roles.assignedPolicies')}</h3>
              {roleDetail?.data?.policies.length === 0 ? (
                <p className='text-sm text-gray-500 italic'>{t('rbac:roles.noPoliciesAssigned')}</p>
              ) : (
                <div className='space-y-2'>
                  {roleDetail?.data?.policies.map(policy => (
                    <div key={policy.id} className='flex justify-between items-center bg-gray-50 p-2 rounded-md border'>
                      <div>
                        <span className='font-medium text-sm block'>{policy.name}</span>
                        <span className='text-xs text-gray-500'>
                          {policy.action} : {policy.resource}
                        </span>
                      </div>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleRevoke(policy.id)}
                        disabled={isRevoking || isAssigning}
                      >
                        {t('common:revoke')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='border-t pt-4'>
              <h3 className='text-sm font-semibold mb-2 text-gray-700'>{t('rbac:roles.availablePolicies')}</h3>
              {availablePolicies.length === 0 ? (
                <p className='text-sm text-gray-500 italic'>{t('rbac:roles.allPoliciesAssigned')}</p>
              ) : (
                <div className='space-y-2'>
                  {availablePolicies.map(policy => (
                    <div key={policy.id} className='flex justify-between items-center bg-white p-2 rounded-md border'>
                      <div>
                        <span className='font-medium text-sm block'>{policy.name}</span>
                        <span className='text-xs text-gray-500'>
                          {policy.action} : {policy.resource}
                        </span>
                      </div>
                      <Button size='sm' onClick={() => handleAssign(policy.id)} disabled={isAssigning || isRevoking}>
                        {t('common:assign')}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>{t('common:close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
