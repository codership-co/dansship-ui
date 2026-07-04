import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { ProductForm } from './product-form';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { CreateProductPayload, DansshipAPI, PaymentProofContentType, Product, UpdateProductPayload } from '@core/api';
import { formatMerchPrice } from '@helpers';
import { useProducts, usePromise } from '@hooks';

type StatusFilter = 'all' | 'active' | 'inactive';

export function ProductList() {
  const { t } = useTranslation();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productToToggle, setProductToToggle] = useState<Product | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const isActive = statusFilter === 'all' ? undefined : statusFilter === 'active';
  const category = categoryFilter === 'all' ? undefined : categoryFilter;

  const {
    createProduct,
    updateProduct,
    deactivateProduct,
    reactivateProduct,
    isCreating,
    isUpdating,
    isDeactivating,
    isReactivating,
  } = useProducts();

  const { response: products, isLoading } = usePromise(() =>
    DansshipAPI.merchAdmin.getProducts({
      is_active: isActive,
      category,
    }),
  );

  const categories = useMemo(() => {
    const allCategories = products?.data?.map(item => item.category).filter((value): value is string => Boolean(value));

    return [...new Set(allCategories)].sort((a, b) => a.localeCompare(b));
  }, [products]);

  const sortedProducts = useMemo(
    () => [...(products?.data ?? [])].sort((a, b) => Number(b.is_active) - Number(a.is_active)),
    [products],
  );

  const openCreateModal = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const openEditModal = (product: Product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const closeFormModal = () => {
    setSelectedProduct(null);
    setIsFormOpen(false);
  };

  const handleProductSubmit = async (
    payload: CreateProductPayload | UpdateProductPayload,
    options?: { imageFile?: File | null; removeImage?: boolean },
  ) => {
    const imageFile = options?.imageFile ?? null;
    const removeImage = options?.removeImage ?? false;
    let targetProductId: string;

    if (selectedProduct) {
      const nextPayload: UpdateProductPayload = {
        ...payload,
        image_key: removeImage && !imageFile ? null : undefined,
      };

      const updated = await updateProduct(selectedProduct.id, nextPayload);
      targetProductId = updated?.id ?? '';
    } else {
      const created = await createProduct(payload as CreateProductPayload);
      targetProductId = created?.id ?? '';
    }

    if (imageFile) {
      setIsUploadingImage(true);
      try {
        const { data: imageUploadURL, ok } = await DansshipAPI.merchAdmin.getProductImageUploadUrl(targetProductId, {
          content_type: imageFile.type as PaymentProofContentType,
        });

        if (!ok) {
          return;
        }

        const { upload_url, file_key } = imageUploadURL;

        const uploadResponse = await fetch(upload_url, {
          method: 'PUT',
          headers: {
            'Content-Type': imageFile.type,
          },
          body: imageFile,
        });

        if (!uploadResponse.ok) {
          throw new Error('PRODUCT_IMAGE_UPLOAD_FAILED');
        }

        await DansshipAPI.merchAdmin.confirmProductImageUpload(targetProductId, { file_key });
        toast.success(
          t('merch:productImageUpdated', {
            defaultValue: 'Product image updated',
          }),
        );
      } catch {
        toast.error(
          t('merch:imageUploadRetryHint', {
            defaultValue: 'Product data was saved. You can edit the product and try image upload again.',
          }),
        );
      } finally {
        setIsUploadingImage(false);
      }
    }

    closeFormModal();
  };

  const handleConfirmToggle = async () => {
    if (!productToToggle) return;

    if (productToToggle.is_active) {
      await deactivateProduct(productToToggle.id);
    } else {
      await reactivateProduct(productToToggle.id);
    }

    setProductToToggle(null);
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <h2 className='text-xl font-semibold'>{t('merch:productsTitle')}</h2>
        <Button onClick={openCreateModal}>{t('merch:addProduct')}</Button>
      </div>

      <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
        <div>
          <p className='mb-2 text-sm text-gray-600'>{t('common:status')}</p>
          <Select value={statusFilter} onValueChange={value => setStatusFilter(value as StatusFilter)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('common:all', { defaultValue: 'All' })}</SelectItem>
              <SelectItem value='active'>{t('common:active')}</SelectItem>
              <SelectItem value='inactive'>{t('common:inactive')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <p className='mb-2 text-sm text-gray-600'>{t('merch:productCategory')}</p>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>{t('common:all', { defaultValue: 'All' })}</SelectItem>
              {categories.map(item => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='rounded-md border bg-white'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('merch:productImage', { defaultValue: 'Image' })}</TableHead>
              <TableHead>{t('merch:productName')}</TableHead>
              <TableHead>{t('merch:productCategory')}</TableHead>
              <TableHead>{t('merch:productPrice')}</TableHead>
              <TableHead>{t('merch:productStock')}</TableHead>
              <TableHead>{t('merch:productSku')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className='py-8 text-center text-gray-500'>
                  {t('common:noData')}
                </TableCell>
              </TableRow>
            ) : (
              sortedProducts.map(product => (
                <TableRow key={product.id} className={!product.is_active ? 'opacity-60' : undefined}>
                  <TableCell>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className='h-12 w-12 rounded-md border object-cover'
                      />
                    ) : (
                      <div className='flex h-12 w-12 items-center justify-center rounded-md border border-dashed text-[10px] text-gray-400'>
                        {t('merch:noImage', { defaultValue: 'No image' })}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className='font-medium'>{product.name}</TableCell>
                  <TableCell>{product.category ?? '-'}</TableCell>
                  <TableCell>{formatMerchPrice(product.price)}</TableCell>
                  <TableCell>{product.stock}</TableCell>
                  <TableCell>{product.sku ?? '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {product.is_active ? t('common:active') : t('common:inactive')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className='flex justify-end gap-2'>
                      <Button variant='outline' size='sm' onClick={() => openEditModal(product)}>
                        {t('common:edit')}
                      </Button>
                      <Button
                        size='sm'
                        variant={product.is_active ? 'destructive' : 'default'}
                        onClick={() => setProductToToggle(product)}
                      >
                        {product.is_active ? t('common:deactivate') : t('common:reactivate')}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ProductForm
        open={isFormOpen}
        initialData={selectedProduct}
        onClose={closeFormModal}
        onSubmit={handleProductSubmit}
        isLoading={isCreating || isUpdating || isUploadingImage}
      />

      <ConfirmDialog
        open={Boolean(productToToggle)}
        onOpenChange={open => {
          if (!open) {
            setProductToToggle(null);
          }
        }}
        onConfirm={handleConfirmToggle}
        title={productToToggle?.is_active ? t('common:deactivate') : t('common:reactivate')}
        description={
          productToToggle?.is_active
            ? `${t('common:deactivate')} ${productToToggle?.name}?`
            : `${t('common:reactivate')} ${productToToggle?.name}?`
        }
        confirmLabel={productToToggle?.is_active ? t('common:deactivate') : t('common:reactivate')}
        confirmVariant={productToToggle?.is_active ? 'destructive' : 'default'}
        isLoading={isDeactivating || isReactivating}
      />
    </div>
  );
}
