import { Button } from 'polpo/components';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEye, LuUpload } from 'react-icons/lu';
import { toast } from 'sonner';

import type { PaymentProfile, PaymentProfileFileKind, SocialSecurityPeriodStatus } from '@core/api';

export type PaymentFileCardProps = {
  label: string;
  hint: string;
  uploaded: boolean;
  accept: string;
  acceptedTypes: Array<string>;
  isUploading: boolean;
  isOpeningFile: boolean;
  onFile: (file: File) => void;
  onView?: () => void;
};

export function PaymentFileCard({
  label,
  hint,
  uploaded,
  accept,
  acceptedTypes,
  isUploading,
  isOpeningFile,
  onFile,
  onView,
}: PaymentFileCardProps) {
  const { t } = useTranslation();
  const inputRef = useRef<HTMLInputElement>(null);

  const openPicker = () => {
    inputRef.current?.click();
  };

  const handleChange = (file: File | undefined) => {
    if (!file) return;

    if (!acceptedTypes.includes(file.type)) {
      toast.error(t('common:fileUpload.invalidType'));

      return;
    }

    onFile(file);
  };

  return (
    <div>
      {uploaded ? (
        <div className='flex items-center justify-between gap-2.5 rounded-md border px-3.5 py-2.5'>
          <div className='flex min-w-0 items-center gap-2'>
            <span className='size-2 shrink-0 rounded-full bg-[#2e9e5b]' />
            <span className='truncate text-[13px] font-semibold'>{label}</span>
          </div>
          <div className='flex shrink-0 gap-1'>
            <Button
              color='primary'
              variant='text'
              size='small'
              forIcon
              type='button'
              aria-label={t('profile:paymentDocuments.viewFile')}
              title={t('profile:paymentDocuments.viewFile')}
              disabled={isUploading || isOpeningFile}
              onClick={onView}
            >
              <LuEye />
            </Button>
            <Button
              color='primary'
              variant='outlined'
              size='small'
              forIcon
              type='button'
              aria-label={t('profile:paymentDocuments.replaceFile')}
              title={t('profile:paymentDocuments.replaceFile')}
              disabled={isUploading}
              onClick={openPicker}
            >
              <LuUpload />
            </Button>
          </div>
        </div>
      ) : (
        <div className='flex flex-col gap-2.5 rounded-md border p-4'>
          <div className='flex items-center gap-2'>
            <span className='size-2 shrink-0 rounded-full bg-border' />
            <span className='text-[13px] font-semibold'>{label}</span>
          </div>
          <div className='flex items-center gap-2.5'>
            <Button
              color='primary'
              variant='outlined'
              size='small'
              forIcon
              type='button'
              aria-label={t('profile:paymentDocuments.uploadFile')}
              title={t('profile:paymentDocuments.uploadFile')}
              disabled={isUploading}
              onClick={openPicker}
            >
              <LuUpload />
            </Button>
            <p className='text-xs text-muted-foreground'>{hint}</p>
          </div>
        </div>
      )}
      <input
        ref={inputRef}
        type='file'
        accept={accept}
        className='hidden'
        onChange={event => {
          handleChange(event.target.files?.[0]);
          event.currentTarget.value = '';
        }}
      />
    </div>
  );
}

type PaymentDocumentFilesProps = {
  profile: PaymentProfile;
  isUploading: boolean;
  isOpeningFile: boolean;
  onUpload: (kind: PaymentProfileFileKind, file: File) => void;
  onView: (kind: PaymentProfileFileKind) => void;
};

export function PaymentDocumentFiles({
  profile,
  isUploading,
  isOpeningFile,
  onUpload,
  onView,
}: PaymentDocumentFilesProps) {
  const { t } = useTranslation();
  const cards: Array<{
    kind: PaymentProfileFileKind;
    label: string;
    hint: string;
    uploaded: boolean;
    accept: string;
    acceptedTypes: Array<string>;
  }> = [
    {
      kind: 'rut',
      label: t('profile:paymentDocuments.rut'),
      hint: t('profile:paymentDocuments.rutHint'),
      uploaded: profile.has_rut,
      accept: 'application/pdf,image/jpeg,image/png,image/webp',
      acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    },
    {
      kind: 'bank-certificate',
      label: t('profile:paymentDocuments.bankCertificate'),
      hint: t('profile:paymentDocuments.bankCertificateHint'),
      uploaded: profile.has_bank_certificate,
      accept: 'application/pdf,image/jpeg,image/png,image/webp',
      acceptedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
    },
    {
      kind: 'signature',
      label: t('profile:paymentDocuments.signature'),
      hint: t('profile:paymentDocuments.signatureHint'),
      uploaded: profile.has_signature,
      accept: 'image/jpeg,image/png,image/webp',
      acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    },
  ];

  const uploadedCount = cards.filter(card => card.uploaded).length;

  return (
    <div className='grid gap-1.5'>
      <span className='text-[13px] font-semibold'>
        {t('profile:paymentDocuments.documentsLoaded', {
          count: uploadedCount,
          total: cards.length,
        })}
      </span>
      <div className='h-1.5 overflow-hidden rounded-full bg-border'>
        <div
          className='h-full rounded-full bg-primary'
          style={{
            width: `${cards.length ? Math.round((uploadedCount / cards.length) * 100) : 0}%`,
          }}
        />
      </div>
      <div className='mt-2.5 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4'>
        {cards.map(card => (
          <PaymentFileCard
            key={card.kind}
            label={card.label}
            hint={card.hint}
            uploaded={card.uploaded}
            accept={card.accept}
            acceptedTypes={card.acceptedTypes}
            isUploading={isUploading}
            isOpeningFile={isOpeningFile}
            onFile={file => onUpload(card.kind, file)}
            onView={card.uploaded ? () => onView(card.kind) : undefined}
          />
        ))}
      </div>
    </div>
  );
}

const PROOF_ACCEPT = 'application/pdf,image/jpeg,image/png,image/webp';
const PROOF_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

type SocialSecurityRequestsProps = {
  requests: Array<SocialSecurityPeriodStatus>;
  isUploading: boolean;
  isOpeningFile: boolean;
  onUpload: (request: SocialSecurityPeriodStatus, file: File) => void;
  onView: (request: SocialSecurityPeriodStatus) => void;
};

/** One card per month the team asked the planilla for. Renders nothing when no month is requested. */
export function SocialSecurityRequests({
  requests,
  isUploading,
  isOpeningFile,
  onUpload,
  onView,
}: SocialSecurityRequestsProps) {
  const { t } = useTranslation();

  if (requests.length === 0) return null;

  return (
    <section className='grid gap-4 rounded-md border bg-white/50 p-5'>
      <h3 className='text-base font-bold'>{t('profile:paymentDocuments.socialSecurityTitle')}</h3>
      <div className='grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4'>
        {requests.map(request => (
          <PaymentFileCard
            key={`${request.year}-${request.month}`}
            label={t('profile:paymentDocuments.socialSecurityPeriod', {
              month: t(`profile:paymentDocuments.months.${request.proof_month}`),
              year: request.proof_year,
            })}
            hint={t('profile:paymentDocuments.socialSecurityPeriodHint')}
            uploaded={request.uploaded}
            accept={PROOF_ACCEPT}
            acceptedTypes={PROOF_TYPES}
            isUploading={isUploading}
            isOpeningFile={isOpeningFile}
            onFile={file => onUpload(request, file)}
            onView={request.uploaded ? () => onView(request) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
