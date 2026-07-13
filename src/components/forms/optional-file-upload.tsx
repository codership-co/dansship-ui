import { ChangeEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuTrash2, LuUpload } from 'react-icons/lu';
import { toast } from 'sonner';

import { Spinner } from '@components/loaders';
import { Button } from '@components/ui';
import { PaymentProofContentType } from '@core/api';
import { cn } from '@helpers';

const DEFAULT_ACCEPTED_TYPES = Object.values(PaymentProofContentType);

export interface OptionalFileUploadProps {
  value?: File | null;
  previewUrl?: string | null;
  onChange: (file: File | null, previewUrl: string | null) => void;
  acceptedTypes?: Array<string>;
  isUploading?: boolean;
  disabled?: boolean;
  label?: string;
  helperText?: string;
  className?: string;
  showPreview?: boolean;
}

export function OptionalFileUpload({
  value = null,
  previewUrl = null,
  onChange,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  isUploading = false,
  disabled = false,
  label,
  helperText,
  className,
  showPreview = true,
}: OptionalFileUploadProps) {
  const { t } = useTranslation();
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(previewUrl);

  useEffect(() => {
    setLocalPreviewUrl(previewUrl);
  }, [previewUrl]);

  const fileAccept = useMemo(() => acceptedTypes.join(','), [acceptedTypes]);
  const isDisabled = disabled || isUploading;

  const handleInputFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      toast.error(t('common:fileUpload.invalidType'));
      event.currentTarget.value = '';

      return;
    }

    const nextPreviewUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(nextPreviewUrl);
    onChange(file, nextPreviewUrl);
    event.currentTarget.value = '';
  };

  const handleClear = () => {
    setLocalPreviewUrl(null);
    onChange(null, null);
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div className='rounded-md border border-dashed border-gray-300 p-3 grid gap-3'>
        <div className='flex flex-wrap items-center gap-2'>
          <label
            className={cn(
              'inline-flex cursor-pointer items-center gap-2 rounded-md border border-accent bg-background px-3 py-2 text-xs font-medium shadow-sm hover:bg-accent hover:text-accent-foreground',
              isDisabled && 'pointer-events-none opacity-60',
            )}
          >
            {isUploading ? <Spinner /> : <LuUpload className='h-4 w-4' />}
            <span>
              {isUploading
                ? t('common:fileUpload.uploading')
                : value || localPreviewUrl
                  ? t('common:fileUpload.replace')
                  : (label ?? t('common:fileUpload.upload'))}
            </span>
            <input
              type='file'
              className='hidden'
              accept={fileAccept}
              disabled={isDisabled}
              onChange={handleInputFileUpload}
            />
          </label>

          {(value || localPreviewUrl) && !isUploading ? (
            <Button type='button' variant='ghost' size='sm' onClick={handleClear} className='h-8 px-2'>
              <LuTrash2 className='h-4 w-4' />
              <span className='sr-only'>{t('common:fileUpload.remove')}</span>
            </Button>
          ) : null}
        </div>

        {helperText ? <p className='text-xs text-gray-600'>{helperText}</p> : null}
        {value ? <p className='text-xs text-gray-600'>{value.name}</p> : null}
      </div>

      {showPreview && localPreviewUrl ? (
        <div className='relative w-full max-w-xs aspect-square bg-gray-300/50 border border-dashed border-gray-300 rounded-xl grid place-content-center overflow-hidden'>
          <img src={localPreviewUrl} alt={t('common:fileUpload.previewAlt')} className='w-full h-full object-contain' />
        </div>
      ) : null}
    </div>
  );
}
