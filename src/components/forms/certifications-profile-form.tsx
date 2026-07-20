import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuPlus, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { z } from 'zod';

import { DateField, TextField } from '@components/form-fields';
import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { DansshipAPI, InstructorCertificationPayload, PaymentProofContentType } from '@core/api';
import { useCallablePromise } from '@hooks';

export const createCertificationsProfileSchema = (t: TFunction) =>
  z.object({
    documents: z.array(
      z.object({
        title: z
          .string()
          .min(1, { message: t('auth:onboarding.validationRequired') })
          .max(255),
        issuer: z
          .string()
          .min(1, { message: t('auth:onboarding.validationRequired') })
          .max(255),
        file_key: z.string().optional(),
        issue_date: z.date().optional().nullable(),
      }),
    ),
  });

export type CertificationsProfileFormValues = z.infer<ReturnType<typeof createCertificationsProfileSchema>>;

interface OnboardingCertificationsProfileFormProps {
  isLoading: boolean;
  error: string | null;
  onComplete: (documents: Array<InstructorCertificationPayload>) => void;
  onSkip?: () => void;
  onBack?: () => void;
}

export function CertificationsProfileForm({
  isLoading,
  error,
  onComplete,
  onSkip,
  onBack,
}: OnboardingCertificationsProfileFormProps) {
  const { t } = useTranslation();
  const schema = createCertificationsProfileSchema(t);
  const { call: uploadCertificationFile, isLoading: isUploading } = useCallablePromise((file: File) =>
    DansshipAPI.onboarding.uploadDocument(file),
  );
  const [filePreviews, setFilePreviews] = useState<Record<number, { file: File | null; previewUrl: string | null }>>(
    {},
  );
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const { control, handleSubmit, setValue, getValues } = useForm<CertificationsProfileFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      documents: [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'documents' });

  const handleFileChange = async (index: number, file: File | null, previewUrl: string | null) => {
    setFilePreviews(prev => ({
      ...prev,
      [index]: { file, previewUrl },
    }));

    if (!file) {
      setValue(`documents.${index}.file_key`, undefined);

      return;
    }

    setUploadingIndex(index);

    try {
      const fileKey = await uploadCertificationFile(file);
      setValue(`documents.${index}.file_key`, fileKey);
    } catch {
      toast.error(t('auth:onboarding.certificationUploadFailed'));
      setFilePreviews(prev => ({
        ...prev,
        [index]: { file: null, previewUrl: null },
      }));
      setValue(`documents.${index}.file_key`, undefined);
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFormSubmit = (values: CertificationsProfileFormValues) => {
    onComplete(
      values.documents.map(document => ({
        title: document.title,
        issuer: document.issuer,
        file_key: document.file_key || undefined,
        issue_date: document.issue_date ? document.issue_date.toISOString().slice(0, 10) : null,
      })),
    );
  };

  const handleAddDocument = () => {
    append({
      title: '',
      issuer: '',
      file_key: undefined,
      issue_date: undefined,
    });
  };

  const handleRemoveDocument = (index: number) => {
    remove(index);
    setFilePreviews(prev => {
      const next = { ...prev };
      delete next[index];

      return next;
    });
  };

  return (
    <div className='space-y-6' data-component='OnboardingCertificationsProfileForm'>
      <form className='grid gap-8' onSubmit={handleSubmit(handleFormSubmit)}>
        <div className='flex items-center justify-between gap-2'>
          <label className='font-medium text-left'>{t('auth:onboarding.certifications')}</label>

          <Button
            type='button'
            color='primary'
            variant='outlined'
            className='self-center sm:self-auto'
            onClick={handleAddDocument}
          >
            <LuPlus />
            {t('auth:onboarding.addCertification')}
          </Button>
        </div>

        {fields.length === 0 ? (
          <p className='text-sm text-gray-600'>{t('auth:onboarding.certificationsEmpty')}</p>
        ) : null}

        {fields.map((field, index) => (
          <section key={field.id} className='space-y-4 rounded-xl border border-gray-200 p-4'>
            <div className='flex justify-end'>
              <Button type='button' color='tertiary' variant='text' onClick={() => handleRemoveDocument(index)}>
                <LuTrash2 />
                {t('common:fileUpload.remove')}
              </Button>
            </div>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-2 items-start'>
              <TextField
                control={control}
                name={`documents.${index}.title`}
                label={t('auth:onboarding.fields.certificationTitle.label')}
                placeholder={t('auth:onboarding.fields.certificationTitle.placeholder')}
              />
              <TextField
                control={control}
                name={`documents.${index}.issuer`}
                label={t('auth:onboarding.fields.certificationIssuer.label')}
                placeholder={t('auth:onboarding.fields.certificationIssuer.placeholder')}
              />
            </div>

            <DateField
              control={control}
              name={`documents.${index}.issue_date`}
              label={t('auth:onboarding.fields.certificationIssueDate.label')}
              placeholder={t('auth:onboarding.fields.certificationIssueDate.placeholder')}
            />

            <OptionalFileUpload
              value={filePreviews[index]?.file ?? null}
              previewUrl={filePreviews[index]?.previewUrl ?? null}
              acceptedTypes={Object.values(PaymentProofContentType)}
              isUploading={uploadingIndex === index || (isUploading && uploadingIndex === index)}
              helperText={t('auth:onboarding.fields.certificationFile.helper')}
              label={t('auth:onboarding.fields.certificationFile.label')}
              onChange={(file, previewUrl) => {
                void handleFileChange(index, file, previewUrl);
              }}
            />

            {getValues(`documents.${index}.file_key`) ? (
              <p className='text-xs text-active-600'>{t('auth:onboarding.certificationUploaded')}</p>
            ) : null}
          </section>
        ))}

        {error ? <p className='text-sm text-alert-600'>{error}</p> : null}

        <div className='mt-20 grid gap-4'>
          <section className='grid grid-cols-2 gap-4'>
            {onBack && (
              <Button
                type='button'
                variant='outlined'
                color='primary'
                onClick={onBack}
                aria-label={t('common:back')}
                fullWidth
              >
                <LuChevronLeft className='size-6' />
                {t('common:back')}
              </Button>
            )}
            <Button type='submit' fullWidth isLoading={isLoading || uploadingIndex !== null} color='primary'>
              {t('auth:onboarding.complete')}
            </Button>
          </section>
          {onSkip && (
            <Button
              type='button'
              onClick={onSkip}
              variant='text'
              color='tertiary'
              isLoading={isLoading}
              fullWidth
              disabled={uploadingIndex !== null}
            >
              {t('auth:onboarding.omitStep')}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
