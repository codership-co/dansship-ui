import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PlanModal, PlanModalSubmitData } from './plan-modal';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { Plan } from '@core/api';
import { useClassGroups, usePlans, useTaxTypes } from '@hooks';

function formatPlanPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function PlansTab() {
  const { t } = useTranslation();
  const {
    plans,
    isLoading,
    createPlan,
    updatePlan,
    deletePlan,
    reactivatePlan,
    isCreating,
    isUpdating,
    isDeleting,
    isReactivating,
  } = usePlans();
  const { classGroups, isLoading: isLoadingClassGroups } = useClassGroups();
  const { taxTypes, defaultTaxTypeId, isLoading: isLoadingTaxTypes } = useTaxTypes();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planToDeactivate, setPlanToDeactivate] = useState<Plan | null>(null);
  const [planToReactivate, setPlanToReactivate] = useState<Plan | null>(null);

  const handleOpenModal = (plan?: Plan) => {
    setSelectedPlan(plan || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPlan(null);
  };

  const handleSubmit = async (data: PlanModalSubmitData) => {
    if (selectedPlan) {
      await updatePlan(selectedPlan.id, data);
    } else {
      await createPlan(data);
    }

    handleCloseModal();
  };

  const handleDeactivate = async (plan: Plan) => {
    setPlanToDeactivate(plan);
  };

  const handleConfirmDeactivate = async () => {
    if (!planToDeactivate) {
      return;
    }

    await deletePlan(planToDeactivate.id);
    setPlanToDeactivate(null);
  };

  const handleReactivate = async (plan: Plan) => {
    setPlanToReactivate(plan);
  };

  const handleConfirmReactivate = async () => {
    if (!planToReactivate) {
      return;
    }

    await reactivatePlan(planToReactivate.id);
    setPlanToReactivate(null);
  };

  if (isLoading || isLoadingClassGroups || isLoadingTaxTypes) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  const sortedPlans = [...plans].sort((a, b) => Number(b.is_active) - Number(a.is_active));

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('billing:plansTitle')}</h2>
        <Button onClick={() => handleOpenModal()} disabled={classGroups.length === 0 || taxTypes.length === 0}>
          {t('billing:addPlan')}
        </Button>
      </div>

      {classGroups.length === 0 && <p className='text-sm text-gray-500'>{t('billing:noClassGroups')}</p>}

      <div className='border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common:name')}</TableHead>
              <TableHead>{t('billing:price')}</TableHead>
              <TableHead>{t('billing:classes')}</TableHead>
              <TableHead>{t('billing:validity')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-4 text-gray-500'>
                  {t('billing:noPlansFound')}
                </TableCell>
              </TableRow>
            ) : (
              sortedPlans.map(plan => (
                <TableRow key={plan.id} className={!plan.is_active ? 'opacity-60 grayscale blur-[0.5px]' : undefined}>
                  <TableCell className='font-medium'>{plan.name}</TableCell>
                  <TableCell>{formatPlanPrice(plan.price, plan.currency)}</TableCell>
                  <TableCell>{plan.classes_included}</TableCell>
                  <TableCell>
                    {plan.validity_days} {t('billing:daysUnit')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${plan.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {plan.is_active ? t('common:active') : t('common:inactive')}
                    </span>
                  </TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button variant='outline' size='sm' onClick={() => handleOpenModal(plan)}>
                      {t('common:edit')}
                    </Button>
                    {plan.is_active ? (
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeactivate(plan)}
                        disabled={isDeleting}
                      >
                        {t('common:deactivate')}
                      </Button>
                    ) : (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => handleReactivate(plan)}
                        disabled={isReactivating}
                      >
                        {t('common:reactivate')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <PlanModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedPlan}
        classGroups={classGroups}
        taxTypes={taxTypes}
        defaultTaxTypeId={defaultTaxTypeId}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={Boolean(planToDeactivate)}
        onOpenChange={open => {
          if (!open) {
            setPlanToDeactivate(null);
          }
        }}
        onConfirm={handleConfirmDeactivate}
        title={t('billing:deactivatePlanTitle')}
        description={
          planToDeactivate?.name
            ? t('billing:deactivatePlanConfirm', { name: planToDeactivate.name })
            : t('billing:deactivatePlanConfirmGeneric')
        }
        confirmLabel={t('common:deactivate')}
        confirmVariant='destructive'
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={Boolean(planToReactivate)}
        onOpenChange={open => {
          if (!open) {
            setPlanToReactivate(null);
          }
        }}
        onConfirm={handleConfirmReactivate}
        title={t('billing:reactivatePlanTitle')}
        description={
          planToReactivate?.name
            ? t('billing:reactivatePlanConfirm', { name: planToReactivate.name })
            : t('billing:reactivatePlanConfirmGeneric')
        }
        confirmLabel={t('common:reactivate')}
        confirmVariant='default'
        isLoading={isReactivating}
      />
    </div>
  );
}
