import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ClassModal } from './class-modal';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { ClassDefinition } from '@core/api';
import { useClasses } from '@hooks';

export function ClassesTab() {
  const { t } = useTranslation();
  const {
    classes,
    isLoading,
    createClass,
    updateClass,
    deleteClass,
    reactivateClass,
    isCreating,
    isUpdating,
    isDeleting,
    isReactivating,
  } = useClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassDefinition | null>(null);
  const [classToDeactivate, setClassToDeactivate] = useState<ClassDefinition | null>(null);

  const handleOpenModal = (cls?: ClassDefinition) => {
    setSelectedClass(cls || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClass(null);
  };

  const handleSubmit = async (data: Omit<ClassDefinition, 'id' | 'is_active' | 'created_at'>) => {
    if (selectedClass) {
      await updateClass(selectedClass.id, data);
    } else {
      await createClass(data);
    }

    handleCloseModal();
  };

  const handleDeactivate = async (classDefinition: ClassDefinition) => {
    setClassToDeactivate(classDefinition);
  };

  const handleConfirmDeactivate = async () => {
    if (!classToDeactivate) {
      return;
    }

    await deleteClass(classToDeactivate.id);
    setClassToDeactivate(null);
  };

  const handleReactivate = async (id: string) => {
    await reactivateClass(id);
  };

  if (isLoading) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  const sortedClasses = [...classes].sort((a, b) => Number(b.is_active) - Number(a.is_active));

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('inventory:classes.catalog')}</h2>
        <Button onClick={() => handleOpenModal()}>{t('inventory:classes.addClass')}</Button>
      </div>

      <div className='border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('common:name')}</TableHead>
              <TableHead>{t('inventory:classes.durationHeader')}</TableHead>
              <TableHead>{t('inventory:classes.maxPax')}</TableHead>
              <TableHead>{t('common:level')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-4 text-gray-500'>
                  {t('inventory:classes.empty')}
                </TableCell>
              </TableRow>
            ) : (
              sortedClasses.map(cls => (
                <TableRow key={cls.id} className={!cls.is_active ? 'opacity-60 grayscale blur-[0.5px]' : undefined}>
                  <TableCell className='font-medium'>{cls.name}</TableCell>
                  <TableCell>{cls.duration_minutes}m</TableCell>
                  <TableCell>{cls.max_participants}</TableCell>
                  <TableCell>{cls.level || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${cls.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                    >
                      {cls.is_active ? t('common:active') : t('common:inactive')}
                    </span>
                  </TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button variant='outline' size='sm' onClick={() => handleOpenModal(cls)} disabled={!cls.is_active}>
                      {t('common:edit')}
                    </Button>
                    {cls.is_active && (
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeactivate(cls)}
                        disabled={isDeleting}
                      >
                        {t('common:deactivate')}
                      </Button>
                    )}
                    {!cls.is_active && (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => handleReactivate(cls.id)}
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

      <ClassModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedClass}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={Boolean(classToDeactivate)}
        onOpenChange={open => {
          if (!open) {
            setClassToDeactivate(null);
          }
        }}
        onConfirm={handleConfirmDeactivate}
        title={t('inventory:classes.deactivateTitle')}
        description={
          classToDeactivate?.name
            ? t('inventory:classes.deactivateConfirmNamed', { name: classToDeactivate.name })
            : t('inventory:classes.deactivateConfirm')
        }
        confirmLabel={t('common:deactivate')}
        confirmVariant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
}
