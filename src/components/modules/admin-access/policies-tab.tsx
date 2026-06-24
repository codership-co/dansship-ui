import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PolicyModal } from './policy-modal';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI, PolicyCreatePayload, PolicyResponse, type PolicyUpdatePayload } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

export function PoliciesTab() {
  const { t } = useTranslation();
  const { response: policies, isLoading } = usePromise(() => DansshipAPI.rbacAdmin.getPolicies());

  const { call: createPolicy, isLoading: isCreating } = useCallablePromise((payload: PolicyCreatePayload) =>
    DansshipAPI.rbacAdmin.createPolicy(payload),
  );
  const { call: updatePolicy, isLoading: isUpdating } = useCallablePromise(
    (policyId: string, payload: PolicyUpdatePayload) => DansshipAPI.rbacAdmin.updatePolicy(policyId, payload),
  );
  const { call: deletePolicy, isLoading: isDeleting } = useCallablePromise((policyId: string) =>
    DansshipAPI.rbacAdmin.deletePolicy(policyId),
  );

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<PolicyResponse | null>(null);
  const [policyToDelete, setPolicyToDelete] = useState<PolicyResponse | null>(null);

  const handleOpenModal = (policy?: PolicyResponse) => {
    setSelectedPolicy(policy || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPolicy(null);
  };

  const handleSubmit = async (data: PolicyCreatePayload) => {
    if (selectedPolicy) {
      await updatePolicy(selectedPolicy.id, data);
    } else {
      await createPolicy(data);
    }

    handleCloseModal();
  };

  const handleDelete = async (policy: PolicyResponse) => {
    setPolicyToDelete(policy);
  };

  const handleConfirmDelete = async () => {
    if (!policyToDelete) {
      return;
    }

    await deletePolicy(policyToDelete.id);
    setPolicyToDelete(null);
  };

  if (isLoading) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('rbac:policies.title')}</h2>
        <Button onClick={() => handleOpenModal()}>{t('rbac:policies.addPolicy')}</Button>
      </div>

      <div className='border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common:name')}</TableHead>
              <TableHead>{t('rbac:policies.action')}</TableHead>
              <TableHead>{t('rbac:policies.resource')}</TableHead>
              <TableHead>{t('common:description')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {!policies?.ok || policies?.data?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className='text-center py-4 text-gray-500'>
                  {t('rbac:policies.empty')}
                </TableCell>
              </TableRow>
            ) : (
              policies.data.map(policy => (
                <TableRow key={policy.id}>
                  <TableCell className='font-medium'>{policy.name}</TableCell>
                  <TableCell>
                    <span className='px-2 py-1 rounded-md text-xs bg-accent text-accent-foreground'>
                      {policy.action}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className='px-2 py-1 rounded-md text-xs bg-secondary text-secondary-foreground'>
                      {policy.resource}
                    </span>
                  </TableCell>
                  <TableCell className='text-sm text-gray-600 truncate max-w-xs' title={policy.description || ''}>
                    {policy.description || '-'}
                  </TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button size='sm' onClick={() => handleOpenModal(policy)}>
                      {t('common:edit')}
                    </Button>
                    <Button variant='destructive' size='sm' onClick={() => handleDelete(policy)} disabled={isDeleting}>
                      {t('common:delete')}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PolicyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedPolicy}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={Boolean(policyToDelete)}
        onOpenChange={open => {
          if (!open) {
            setPolicyToDelete(null);
          }
        }}
        onConfirm={handleConfirmDelete}
        title={t('rbac:policies.deleteTitle')}
        description={
          policyToDelete?.name
            ? t('rbac:policies.deleteConfirmNamed', { name: policyToDelete.name })
            : t('rbac:policies.deleteConfirm')
        }
        confirmLabel={t('common:delete')}
        confirmVariant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
}
