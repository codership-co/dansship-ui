import { zodResolver } from '@hookform/resolvers/zod';
import { TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuPlus, LuTrash2 } from 'react-icons/lu';
import { toast } from 'sonner';
import { z } from 'zod';

import { DateField, TextField } from '@components/form-fields';
import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { DansshipAPI, InstructorCertificationContentTypes, InstructorCertificationPayload } from '@core/api';
import { useCallablePromise } from '@hooks';

export const createCertificationsProfileSchema = (t: TFunction) =>
  z.object({
    documents: z.array(
      z.object({
        // Avoid `id` — useFieldArray overwrites fields named `id`.
        certificationId: z.string().optional(),
        title: z
          .string()
          .min(1, { message: t('auth:onboarding.validationRequired') })
          .max(255),
        issuer: z
          .string()
          .min(1, { message: t('auth:onboarding.validationRequired') })
          .max(255),
        file_key: z.string().min(1, { message: t('auth:onboarding.certificationFileRequired') }),
        issue_date: z.date().optional().nullable(),
      }),
    ),
  });

export type CertificationsProfileFormValues = z.infer<ReturnType<typeof createCertificationsProfileSchema>>;

export type CertificationDocumentDefault = {
  certificationId?: string;
  title: string;
  issuer: string;
  file_key: string;
  issue_date?: string | null;
};

interface CertificationsProfileFormProps {
  isLoading: boolean;
  error: string | null;
  onComplete: (documents: Array<InstructorCertificationPayload & { certificationId?: string }>) => void;
  onSkip?: () => void;
  onBack?: () => void;
  /** Defaults to onboarding upload; profile self-service should pass instructors.uploadCertificationDocument. */
  uploadDocument?: (file: File) => Promise<string>;
  defaultDocuments?: Array<CertificationDocumentDefault>;
  submitLabel?: string;
}

export function CertificationsProfileForm({
  isLoading,
  error,
  onComplete,
  onSkip,
  onBack,
  uploadDocument = file => DansshipAPI.onboarding.uploadDocument(file),
  defaultDocuments = [],
  submitLabel,
}: CertificationsProfileFormProps) {
  const { t } = useTranslation();
  const schema = createCertificationsProfileSchema(t);
  const { call: uploadCertificationFile, isLoading: isUploading } = useCallablePromise((file: File) =>
    uploadDocument(file),
  );
  const [filePreviews, setFilePreviews] = useState<Record<number, { file: File | null; previewUrl: string | null }>>(
    {},
  );
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm<CertificationsProfileFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(schema),
    defaultValues: {
      documents: defaultDocuments.map(document => ({
        certificationId: document.certificationId,
        title: document.title,
        issuer: document.issuer,
        file_key: document.file_key,
        issue_date: document.issue_date ? new Date(document.issue_date) : null,
      })),
    },
  });

  useEffect(() => {
    reset({
      documents: defaultDocuments.map(document => ({
        certificationId: document.certificationId,
        title: document.title,
        issuer: document.issuer,
        file_key: document.file_key,
        issue_date: document.issue_date ? new Date(document.issue_date) : null,
      })),
    });
  }, [defaultDocuments, reset]);

  const { fields, append, remove } = useFieldArray({ control, name: 'documents' });

  const handleFileChange = async (index: number, file: File | null, previewUrl: string | null) => {
    setFilePreviews(prev => ({
      ...prev,
      [index]: { file, previewUrl },
    }));

    if (!file) {
      setValue(`documents.${index}.file_key`, '', { shouldValidate: true });

      return;
    }

    setUploadingIndex(index);

    try {
      const fileKey = await uploadCertificationFile(file);
      setValue(`documents.${index}.file_key`, fileKey, { shouldValidate: true });
    } catch {
      toast.error(t('auth:onboarding.certificationUploadFailed'));
      setFilePreviews(prev => ({
        ...prev,
        [index]: { file: null, previewUrl: null },
      }));
      setValue(`documents.${index}.file_key`, '', { shouldValidate: true });
    } finally {
      setUploadingIndex(null);
    }
  };

  const handleFormSubmit = (values: CertificationsProfileFormValues) => {
    onComplete(
      values.documents.map(document => ({
        certificationId: document.certificationId,
        title: document.title,
        issuer: document.issuer,
        file_key: document.file_key,
        issue_date: document.issue_date ? document.issue_date.toISOString().slice(0, 10) : null,
      })),
    );
  };

  const handleAddDocument = () => {
    append({
      certificationId: undefined,
      title: '',
      issuer: '',
      file_key: '',
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
    <div className='space-y-6' data-component='OnboardingCertificationsProfileForm' data-sentry-mask>
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

        {fields.map((field, index) => {
          const isExisting = Boolean(getValues(`documents.${index}.certificationId`));

          return (
            <section key={field.id} className='space-y-4 rounded-xl border border-gray-200 p-4'>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  color='tertiary'
                  variant='text'
                  disabled={isExisting}
                  onClick={() => handleRemoveDocument(index)}
                >
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
                  disabled={isExisting}
                />
                <TextField
                  control={control}
                  name={`documents.${index}.issuer`}
                  label={t('auth:onboarding.fields.certificationIssuer.label')}
                  placeholder={t('auth:onboarding.fields.certificationIssuer.placeholder')}
                  disabled={isExisting}
                />
              </div>

              <DateField
                control={control}
                name={`documents.${index}.issue_date`}
                label={t('auth:onboarding.fields.certificationIssueDate.label')}
                placeholder={t('auth:onboarding.fields.certificationIssueDate.placeholder')}
                disabled={isExisting}
              />

              <OptionalFileUpload
                value={filePreviews[index]?.file ?? null}
                previewUrl={filePreviews[index]?.previewUrl ?? null}
                acceptedTypes={[...InstructorCertificationContentTypes]}
                isUploading={uploadingIndex === index || (isUploading && uploadingIndex === index)}
                helperText={t('auth:onboarding.fields.certificationFile.helper')}
                label={t('auth:onboarding.fields.certificationFile.label')}
                onChange={(file, previewUrl) => {
                  void handleFileChange(index, file, previewUrl);
                }}
                disabled={isExisting}
              />

              {getValues(`documents.${index}.file_key`) ? (
                <p className='text-xs text-active-600'>{t('auth:onboarding.certificationUploaded')}</p>
              ) : null}

              {errors.documents?.[index]?.file_key?.message ? (
                <p className='text-xs text-alert-600'>{errors.documents[index].file_key.message}</p>
              ) : null}
            </section>
          );
        })}

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
              {submitLabel ?? t('auth:onboarding.complete')}
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
