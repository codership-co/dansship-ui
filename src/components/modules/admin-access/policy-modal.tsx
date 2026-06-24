import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import z from 'zod';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@components/ui';
import { PolicyResponse } from '@core/api';

const policySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  action: z.string().min(1, 'Action is required').max(100),
  resource: z.string().min(1, 'Resource is required').max(100),
  description: z.string().optional().nullable(),
});

type PolicyFormData = z.infer<typeof policySchema>;

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PolicyFormData) => Promise<void>;
  initialData?: PolicyResponse | null;
  isLoading?: boolean;
}

export function PolicyModal({ isOpen, onClose, onSubmit, initialData, isLoading }: PolicyModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PolicyFormData>({
    resolver: zodResolver(policySchema),
    defaultValues: {
      name: '',
      action: '',
      resource: '',
      description: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          action: initialData.action,
          resource: initialData.resource,
          description: initialData.description || '',
        });
      } else {
        reset({
          name: '',
          action: '',
          resource: '',
          description: '',
        });
      }
    }
  }, [isOpen, initialData, reset]);

  const handleFormSubmit = async (data: PolicyFormData) => {
    await onSubmit(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>{initialData ? t('rbac:policies.editTitle') : t('rbac:policies.createTitle')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className='space-y-4 py-4'>
          <div className='space-y-2'>
            <label htmlFor='name' className='text-sm font-medium'>
              {t('common:name')}
            </label>
            <input
              id='name'
              {...register('name')}
              className='flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent'
              placeholder={t('rbac:policies.namePlaceholder')}
            />
            {errors.name && <p className='text-sm text-alert-500'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <label htmlFor='action' className='text-sm font-medium'>
              {t('rbac:policies.action')}
            </label>
            <input
              id='action'
              {...register('action')}
              className='flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent'
              placeholder={t('rbac:policies.actionPlaceholder')}
            />
            {errors.action && <p className='text-sm text-alert-500'>{errors.action.message}</p>}
          </div>

          <div className='space-y-2'>
            <label htmlFor='resource' className='text-sm font-medium'>
              {t('rbac:policies.resource')}
            </label>
            <input
              id='resource'
              {...register('resource')}
              className='flex h-10 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent'
              placeholder={t('rbac:policies.resourcePlaceholder')}
            />
            {errors.resource && <p className='text-sm text-alert-500'>{errors.resource.message}</p>}
          </div>

          <div className='space-y-2'>
            <label htmlFor='description' className='text-sm font-medium'>
              {t('common:description')}
            </label>
            <textarea
              id='description'
              {...register('description')}
              className='flex min-h-20 w-full rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent'
              placeholder={t('rbac:policies.descriptionPlaceholder')}
            />
          </div>

          <DialogFooter>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? t('common:saving') : t('common:save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
