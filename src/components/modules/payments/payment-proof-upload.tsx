import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuUpload } from 'react-icons/lu';
import { toast } from 'sonner';

import { Spinner } from '@components/loaders';
import { usePaymentIntents } from '@hooks';

type PaymentProofUploadMode = 'owner' | 'admin';

interface PaymentProofUploadProps {
  intentId: string;
  currentProofUrl: string | null;
  onUploaded?: () => void;
  mode?: PaymentProofUploadMode;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

function isDisplayableImageUrl(value: string | null): value is string {
  if (!value) return false;

  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:image/')
  );
}

export function PaymentProofUpload({ intentId, currentProofUrl, onUploaded, mode = 'owner' }: PaymentProofUploadProps) {
  const { t } = useTranslation();
  const { getProofUploadUrl, getAdminProofUploadUrl, isGettingProofUploadUrl, isGettingAdminProofUploadUrl } =
    usePaymentIntents();
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    isDisplayableImageUrl(currentProofUrl) ? currentProofUrl : null,
  );

  useEffect(() => {
    setPreviewUrl(isDisplayableImageUrl(currentProofUrl) ? currentProofUrl : null);
  }, [currentProofUrl]);

  const isUploading = isGettingProofUploadUrl || isGettingAdminProofUploadUrl;

  const fileAccept = useMemo(() => ACCEPTED_TYPES.join(','), []);

  const handleFileSelected = async (file: File | null) => {
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
      toast.error(t('payments:proofInvalidTypeDesc'));

      return;
    }

    try {
      if (mode === 'admin') {
        await getAdminProofUploadUrl(intentId, file);
      } else {
        await getProofUploadUrl(intentId, file);
      }

      setPreviewUrl(URL.createObjectURL(file));
      onUploaded?.();
    } catch {
      toast.error(t('payments:proofUploadFailedDesc'));
    }
  };

  return (
    <div className='space-y-3'>
      <div className='rounded-md border border-dashed border-gray-300 p-3'>
        <label className='flex cursor-pointer items-center gap-2 text-sm text-gray-700'>
          {isUploading ? <Spinner /> : <LuUpload className='h-4 w-4' />}
          <span>{isUploading ? t('payments:proofUploading') : t('payments:uploadProof')}</span>
          <input
            type='file'
            className='hidden'
            accept={fileAccept}
            disabled={isUploading}
            onChange={event => {
              void handleFileSelected(event.target.files?.[0] ?? null);
              event.currentTarget.value = '';
            }}
          />
        </label>
      </div>

      {previewUrl ? (
        <div className='space-y-2'>
          <img
            src={previewUrl}
            alt={t('payments:proofPreviewAlt')}
            className='h-28 w-28 rounded-md border object-cover'
          />
        </div>
      ) : null}
    </div>
  );
}
