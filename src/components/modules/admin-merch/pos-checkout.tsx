import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuUpload, LuX } from 'react-icons/lu';

import { CustomerSearch } from './customer-search';

import { PaymentMethodSelector } from '@components/modules';
import { Button } from '@components/ui';
import { useOrPermissions } from '@contexts';
import {
  type CustomerSearchUser,
  PaymentMethod,
  PaymentProofContentType,
  PaymentProofContentTypesList,
} from '@core/api';
import { PERMISSION } from '@core/permissions';
import { formatMerchPrice } from '@helpers';

interface POSCheckoutProps {
  selectedCustomer: CustomerSearchUser | null;
  onSelectCustomer: (customer: CustomerSearchUser) => void;
  selectedPaymentMethod: PaymentMethod;
  onSelectPaymentMethod: (method: PaymentMethod) => void;
  cartTotal: number;
  canSubmit: boolean;
  onSubmit: (proofFile?: File | null, proofUploadMode?: 'owner' | 'admin') => Promise<void>;
  isSubmitting?: boolean;
}

export function POSCheckout({
  selectedCustomer,
  onSelectCustomer,
  selectedPaymentMethod,
  onSelectPaymentMethod,
  cartTotal,
  canSubmit,
  onSubmit,
  isSubmitting = false,
}: POSCheckoutProps) {
  const { t } = useTranslation();
  const [selectedProofFile, setSelectedProofFile] = useState<File | null>(null);
  const [selectedProofPreview, setSelectedProofPreview] = useState<string | null>(null);
  const [proofValidationError, setProofValidationError] = useState<string | null>(null);
  const proofUploadMode = useOrPermissions([PERMISSION.PAYMENT_MANAGE, PERMISSION.ORDER_CREATE]) ? 'admin' : 'owner';
  const canUploadProof = useOrPermissions([
    PERMISSION.PAYMENT_MANAGE,
    PERMISSION.SUBSCRIPTION_PURCHASE,
    PERMISSION.ORDER_CREATE,
  ]);

  const proofAccept = useMemo(() => Object.values(PaymentProofContentType).join(','), []);

  useEffect(() => {
    if (!selectedProofFile) {
      setSelectedProofPreview(null);

      return;
    }

    const nextPreview = URL.createObjectURL(selectedProofFile);
    setSelectedProofPreview(nextPreview);

    return () => {
      URL.revokeObjectURL(nextPreview);
    };
  }, [selectedProofFile]);

  const handleProofFileSelect = (file: File | null) => {
    if (!file) return;

    if (!PaymentProofContentTypesList.includes(file.type as PaymentProofContentType)) {
      setSelectedProofFile(null);
      setProofValidationError(
        t('payments:proofInvalidTypeDesc', {
          defaultValue: 'Use JPG, PNG, or WEBP files only.',
        }),
      );

      return;
    }

    setProofValidationError(null);
    setSelectedProofFile(file);
  };

  return (
    <div className='space-y-4 rounded-lg border bg-white p-4 shadow-sm'>
      <CustomerSearch selectedCustomer={selectedCustomer} onSelect={onSelectCustomer} />

      <div className='space-y-2'>
        <p className='text-sm font-medium text-gray-700'>{t('payments:selectMethod')}</p>
        <PaymentMethodSelector value={selectedPaymentMethod} onChange={onSelectPaymentMethod} />
      </div>

      <div className='flex items-center justify-between border-t pt-3'>
        <p className='font-semibold'>{t('merch:cartTotal')}</p>
        <p className='text-lg font-bold'>{formatMerchPrice(cartTotal)}</p>
      </div>

      {canUploadProof ? (
        <div className='space-y-2 rounded-md border border-dashed border-gray-300 p-3'>
          <p className='text-sm font-medium text-gray-800'>
            {t('payments:uploadProof')}{' '}
            <span className='text-gray-500'>({t('common:optional', { defaultValue: 'optional' })})</span>
          </p>
          <p className='text-xs text-gray-600'>
            {t('payments:proofUploadHint', {
              defaultValue: 'Adding proof now can speed up manual payment review.',
            })}
          </p>
          <p className='text-xs text-gray-500'>JPG, PNG, WEBP</p>
          <label className='inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700 hover:text-gray-900'>
            <LuUpload className='h-4 w-4' />
            <span>
              {selectedProofFile ? t('common:change', { defaultValue: 'Change' }) : t('payments:uploadProof')}
            </span>
            <input
              type='file'
              className='hidden'
              accept={proofAccept}
              disabled={isSubmitting}
              onChange={event => {
                handleProofFileSelect(event.target.files?.[0] ?? null);
                event.currentTarget.value = '';
              }}
            />
          </label>
          {selectedProofFile ? (
            <div className='flex items-start justify-between gap-3 rounded-md border bg-gray-50 p-2'>
              <div className='min-w-0'>
                <p className='truncate text-xs font-medium text-gray-800'>{selectedProofFile.name}</p>
                <p className='text-xs text-gray-500'>{(selectedProofFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <Button
                type='button'
                size='icon'
                variant='ghost'
                className='h-7 w-7'
                disabled={isSubmitting}
                onClick={() => {
                  setSelectedProofFile(null);
                  setProofValidationError(null);
                }}
              >
                <LuX className='h-4 w-4' />
              </Button>
            </div>
          ) : null}
          {proofValidationError ? <p className='text-xs text-alert-600'>{proofValidationError}</p> : null}
          {selectedProofPreview ? (
            <img
              src={selectedProofPreview}
              alt={t('payments:proofPreviewAlt')}
              className='h-24 w-24 rounded-md border object-cover'
            />
          ) : null}
        </div>
      ) : null}

      <Button
        className='w-full'
        disabled={!canSubmit || isSubmitting}
        onClick={() => void onSubmit(selectedProofFile, proofUploadMode)}
      >
        {isSubmitting ? t('common:saving', { defaultValue: 'Saving...' }) : t('merch:completeSale')}
      </Button>
    </div>
  );
}
