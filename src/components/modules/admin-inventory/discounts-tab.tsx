import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DiscountModal } from './discount-modal';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { Discount } from '@core/api';
import { useDiscounts } from '@hooks';

export function DiscountsTab() {
  const { t, i18n } = useTranslation();
  const {
    discounts,
    isLoading,
    createDiscount,
    updateDiscount,
    deleteDiscount,
    reactivateDiscount,
    isCreating,
    isUpdating,
    isDeleting,
    isReactivating,
  } = useDiscounts();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState<Discount | null>(null);
  const [discountToDeactivate, setDiscountToDeactivate] = useState<Discount | null>(null);
  const [discountToReactivate, setDiscountToReactivate] = useState<Discount | null>(null);

  const handleOpenModal = (discount?: Discount) => {
    setSelectedDiscount(discount || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);
  };

  const handleSubmit = async (data: Omit<Discount, 'id' | 'is_active' | 'created_at'>) => {
    const formattedData = {
      ...data,
      expiration_date: data.expiration_date ? new Date(data.expiration_date).toISOString() : undefined,
    };

    if (selectedDiscount) {
      await updateDiscount(selectedDiscount.id, formattedData);
    } else {
      await createDiscount(formattedData);
    }

    handleCloseModal();
  };

  const handleDeactivate = async (discount: Discount) => {
    setDiscountToDeactivate(discount);
  };

  const handleConfirmDeactivate = async () => {
    if (!discountToDeactivate) {
      return;
    }

    await deleteDiscount(discountToDeactivate.id);
    setDiscountToDeactivate(null);
  };

  const handleReactivate = async (discount: Discount) => {
    setDiscountToReactivate(discount);
  };

  const handleConfirmReactivate = async () => {
    if (!discountToReactivate) {
      return;
    }

    await reactivateDiscount(discountToReactivate.id);
    setDiscountToReactivate(null);
  };

  if (isLoading) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  const sortedDiscounts = [...discounts].sort((a, b) => Number(b.is_active) - Number(a.is_active));

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('billing:discountsTitle')}</h2>
        <Button onClick={() => handleOpenModal()}>{t('billing:addDiscount')}</Button>
      </div>

      <div className='border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('billing:code')}</TableHead>
              <TableHead>{t('common:type')}</TableHead>
              <TableHead>{t('billing:value')}</TableHead>
              <TableHead>{t('billing:expiration')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {discounts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-4 text-gray-500'>
                  {t('billing:noDiscountsFound')}
                </TableCell>
              </TableRow>
            ) : (
              sortedDiscounts.map(discount => (
                <TableRow
                  key={discount.id}
                  className={!discount.is_active ? 'opacity-60 grayscale blur-[0.5px]' : undefined}
                >
                  <TableCell className='font-medium'>{discount.code}</TableCell>
                  <TableCell className='capitalize'>{discount.type.replace('_', ' ')}</TableCell>
                  <TableCell>{discount.type === 'percentage' ? `${discount.value}%` : `$${discount.value}`}</TableCell>
                  <TableCell>
                    {discount.expiration_date
                      ? new Date(discount.expiration_date).toLocaleDateString(i18n.language)
                      : t('common:never')}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${discount.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {discount.is_active ? t('common:active') : t('common:inactive')}
                    </span>
                  </TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button variant='outline' size='sm' onClick={() => handleOpenModal(discount)}>
                      {t('common:edit')}
                    </Button>
                    {discount.is_active ? (
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeactivate(discount)}
                        disabled={isDeleting}
                      >
                        {t('common:deactivate')}
                      </Button>
                    ) : (
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleReactivate(discount)}
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

      <DiscountModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedDiscount}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={Boolean(discountToDeactivate)}
        onOpenChange={open => {
          if (!open) {
            setDiscountToDeactivate(null);
          }
        }}
        onConfirm={handleConfirmDeactivate}
        title={t('billing:deactivateDiscountTitle')}
        description={
          discountToDeactivate?.name
            ? t('billing:deactivateDiscountConfirm', { name: discountToDeactivate.name })
            : t('billing:deactivateDiscountConfirmGeneric')
        }
        confirmLabel={t('common:deactivate')}
        confirmVariant='destructive'
        isLoading={isDeleting}
      />

      <ConfirmDialog
        open={Boolean(discountToReactivate)}
        onOpenChange={open => {
          if (!open) {
            setDiscountToReactivate(null);
          }
        }}
        onConfirm={handleConfirmReactivate}
        title={t('billing:reactivateDiscountTitle')}
        description={
          discountToReactivate?.name
            ? t('billing:reactivateDiscountConfirm', { name: discountToReactivate.name })
            : t('billing:reactivateDiscountConfirmGeneric')
        }
        confirmLabel={t('common:reactivate')}
        confirmVariant='default'
        isLoading={isReactivating}
      />
    </div>
  );
}
