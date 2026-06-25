import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuImagePlus, LuX } from 'react-icons/lu';
import { z } from 'zod';

import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Textarea } from '@components/ui';

import type { CreateProductPayload, Product, UpdateProductPayload } from '@core/api';

const productSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().gt(0, 'Price must be greater than 0'),
  sku: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be 0 or greater'),
  category: z.string().optional(),
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormOutput = z.output<typeof productSchema>;
const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

interface ProductFormSubmitOptions {
  imageFile?: File | null;
  removeImage?: boolean;
}

interface ProductFormProps {
  open: boolean;
  initialData?: Product | null;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateProductPayload | UpdateProductPayload, options?: ProductFormSubmitOptions) => Promise<void>;
}

export function ProductForm({ open, initialData, isLoading = false, onClose, onSubmit }: ProductFormProps) {
  const { t } = useTranslation();
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [imageValidationError, setImageValidationError] = useState<string | null>(null);
  const acceptedImageTypes = useMemo(() => ACCEPTED_IMAGE_TYPES.join(','), []);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInput, unknown, ProductFormOutput>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      sku: '',
      stock: 0,
      category: '',
    },
  });

  useEffect(() => {
    if (!open) return;

    if (initialData) {
      reset({
        name: initialData.name,
        description: initialData.description ?? '',
        price: initialData.price,
        sku: initialData.sku ?? '',
        stock: initialData.stock,
        category: initialData.category ?? '',
      });

      return;
    }

    reset({
      name: '',
      description: '',
      price: 0,
      sku: '',
      stock: 0,
      category: '',
    });
  }, [initialData, open, reset]);

  useEffect(() => {
    if (!selectedImageFile) {
      setSelectedImagePreview(null);

      return;
    }

    const nextPreview = URL.createObjectURL(selectedImageFile);
    setSelectedImagePreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [selectedImageFile]);

  useEffect(() => {
    if (!open) return;

    setSelectedImageFile(null);
    setSelectedImagePreview(null);
    setRemoveImage(false);
    setImageValidationError(null);
  }, [open, initialData?.id]);

  const handleImageSelect = (file: File | null) => {
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type as (typeof ACCEPTED_IMAGE_TYPES)[number])) {
      setSelectedImageFile(null);
      setImageValidationError(
        t('merch:imageInvalidType', {
          defaultValue: 'Please upload JPG, PNG, or WEBP images only.',
        }),
      );

      return;
    }

    setImageValidationError(null);
    setRemoveImage(false);
    setSelectedImageFile(file);
  };

  const handleFormSubmit = async (values: ProductFormOutput) => {
    const payload = {
      ...values,
      description: values.description?.trim() || null,
      sku: values.sku?.trim() || null,
      category: values.category?.trim() || null,
    };

    await onSubmit(payload, {
      imageFile: selectedImageFile,
      removeImage,
    });
  };

  const currentImageUrl = initialData?.image_url ?? null;
  const imagePreview = selectedImagePreview ?? (removeImage ? null : currentImageUrl);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? t('merch:editProduct') : t('merch:addProduct')}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(values => void handleFormSubmit(values))} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='product-name'>{t('merch:productName')}</Label>
            <Input id='product-name' {...register('name')} />
            {errors.name ? <p className='text-sm text-alert-500'>{errors.name.message}</p> : null}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='product-description'>{t('merch:productDescription')}</Label>
            <Textarea id='product-description' rows={3} {...register('description')} />
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='product-price'>{t('merch:productPrice')}</Label>
              <Input id='product-price' type='number' min={0} step='0.01' {...register('price')} />
              {errors.price ? <p className='text-sm text-alert-500'>{errors.price.message}</p> : null}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='product-stock'>{t('merch:productStock')}</Label>
              <Input id='product-stock' type='number' min={0} step={1} {...register('stock')} />
              {errors.stock ? <p className='text-sm text-alert-500'>{errors.stock.message}</p> : null}
            </div>
          </div>

          <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='product-sku'>{t('merch:productSku')}</Label>
              <Input id='product-sku' {...register('sku')} />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='product-category'>{t('merch:productCategory')}</Label>
              <Input id='product-category' {...register('category')} />
            </div>
          </div>

          <div className='space-y-2 rounded-md border border-dashed border-gray-300 p-3'>
            <Label>{t('merch:productImage', { defaultValue: 'Product image' })}</Label>
            <p className='text-xs text-gray-500'>
              {t('merch:productImageHelp', {
                defaultValue: 'Optional. Use JPG, PNG, or WEBP for best results in POS.',
              })}
            </p>

            <label className='inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 hover:text-gray-900'>
              <LuImagePlus className='h-4 w-4' />
              <span>
                {selectedImageFile
                  ? t('common:change', { defaultValue: 'Change' })
                  : t('merch:uploadImage', { defaultValue: 'Upload image' })}
              </span>
              <input
                type='file'
                className='hidden'
                accept={acceptedImageTypes}
                disabled={isLoading}
                onChange={event => {
                  handleImageSelect(event.target.files?.[0] ?? null);
                  event.currentTarget.value = '';
                }}
              />
            </label>

            {selectedImageFile ? (
              <div className='flex items-center justify-between gap-3 rounded-md border bg-gray-50 p-2'>
                <div className='min-w-0'>
                  <p className='truncate text-xs font-medium text-gray-800'>{selectedImageFile.name}</p>
                  <p className='text-xs text-gray-500'>{(selectedImageFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  className='h-7 w-7'
                  disabled={isLoading}
                  onClick={() => {
                    setSelectedImageFile(null);
                    setImageValidationError(null);
                  }}
                >
                  <LuX className='h-4 w-4' />
                </Button>
              </div>
            ) : null}

            {initialData?.image_url && !selectedImageFile ? (
              <div className='flex items-center justify-between gap-3 rounded-md border bg-gray-50 p-2'>
                <p className='text-xs text-gray-600'>
                  {removeImage
                    ? t('merch:imageWillBeRemoved', { defaultValue: 'Image will be removed.' })
                    : t('merch:currentImage', { defaultValue: 'Current image' })}
                </p>
                <Button
                  type='button'
                  size='sm'
                  variant='outline'
                  disabled={isLoading}
                  onClick={() => {
                    setRemoveImage(previous => !previous);
                    setImageValidationError(null);
                  }}
                >
                  {removeImage
                    ? t('common:undo', { defaultValue: 'Undo' })
                    : t('merch:removeImage', { defaultValue: 'Remove image' })}
                </Button>
              </div>
            ) : null}

            {imageValidationError ? <p className='text-xs text-alert-600'>{imageValidationError}</p> : null}

            {imagePreview ? (
              <img
                src={imagePreview}
                alt={t('merch:productImagePreviewAlt', { defaultValue: 'Product image preview' })}
                className='h-28 w-28 rounded-md border object-cover'
              />
            ) : (
              <div className='flex h-28 w-28 items-center justify-center rounded-md border border-dashed bg-gray-50 text-xs text-gray-400'>
                {t('merch:noImage', { defaultValue: 'No image' })}
              </div>
            )}
          </div>

          <div className='flex justify-end gap-2 pt-2'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? t('common:saving') : t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
