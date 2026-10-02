import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';
import { toast } from 'sonner';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { PaymentDocumentFiles, PaymentMonthsList } from '@components/modules/profile';
import { Button, Input, Label, Textarea } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import {
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  type BankAccountType,
  type PaymentDocumentKind,
  type PaymentMonthSummary,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise, usePromise } from '@hooks';

function openUrl(url: string | undefined) {
  if (!url) return;

  window.open(url, '_blank', 'noopener,noreferrer');
}

function PaymentDocumentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const canOpenPaymentDocuments = user?.cuentaDeCobroEnabled === true;
  const { response, isLoading, error, reFetch } = usePromise(
    () => DansshipAPI.instructorPayments.listPaymentDocuments(),
    canOpenPaymentDocuments,
  );
  const list = response?.data;
  const profile = list?.profile;
  const hasError = Boolean(error) || Boolean(response && !response.ok);

  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState<BankAccountType | ''>('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankInitialized, setBankInitialized] = useState(false);

  useEffect(() => {
    if (!profile || bankInitialized) return;

    setBankName(profile.bank_name ?? '');
    setAccountType((profile.account_type as BankAccountType | null) ?? '');
    setAccountNumber(profile.account_number ?? '');
    setBankInitialized(true);
  }, [profile, bankInitialized]);

  const { call: uploadAndSave, isLoading: isUploading } = useCallablePromise(
    async (kind: PaymentDocumentKind, file: File) => {
      const fileKey = await DansshipAPI.instructorPayments.uploadPaymentDocument(kind, file);
      const field =
        kind === 'rut'
          ? 'rut_file_key'
          : kind === 'signature'
            ? 'signature_file_key'
            : kind === 'social-security'
              ? 'social_security_file_key'
              : 'bank_certificate_file_key';

      return DansshipAPI.instructorPayments.updatePaymentProfile({
        [field]: fileKey,
      });
    },
  );
  const { call: saveBankFields, isLoading: isSavingBank } = useCallablePromise(() =>
    DansshipAPI.instructorPayments.updatePaymentProfile({
      bank_name: bankName,
      account_type: accountType || null,
      account_number: accountNumber,
    }),
  );
  const { call: generateDocument, isLoading: isGenerating } = useCallablePromise((year: number, month: number) =>
    DansshipAPI.instructorPayments.generatePaymentDocument({ year, month }),
  );
  const { call: getFileViewUrl, isLoading: isOpeningFile } = useCallablePromise((kind: PaymentDocumentKind) =>
    DansshipAPI.instructorPayments.getFileViewUrl(kind),
  );
  const { call: getDocumentViewUrl, isLoading: isOpeningDocument } = useCallablePromise((documentId: string) =>
    DansshipAPI.instructorPayments.getDocumentViewUrl(documentId),
  );
  const { call: confirmDocument, isLoading: isConfirming } = useCallablePromise((documentId: string) =>
    DansshipAPI.instructorPayments.confirmPaymentDocument(documentId),
  );
  const { call: disputeDocument, isLoading: isDisputing } = useCallablePromise((documentId: string, reason: string) =>
    DansshipAPI.instructorPayments.disputePaymentDocument(documentId, reason),
  );

  const [confirmTargetId, setConfirmTargetId] = useState<string | null>(null);
  const [disputeTargetId, setDisputeTargetId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeConfirmOpen, setDisputeConfirmOpen] = useState(false);

  const handleUpload = async (kind: PaymentDocumentKind, file: File | null) => {
    if (!file) return;

    try {
      const { ok } = await uploadAndSave(kind, file);

      if (!ok) {
        toast.error(t('profile:paymentDocuments.uploadFailed'));

        return;
      }

      toast.success(t('profile:paymentDocuments.uploadSuccess'));
      void reFetch();
    } catch {
      toast.error(t('profile:paymentDocuments.uploadFailed'));
    }
  };

  const handleSaveBank = async () => {
    try {
      const { ok } = await saveBankFields();

      if (!ok) {
        toast.error(t('profile:paymentDocuments.bankSaveFailed'));

        return;
      }

      toast.success(t('profile:paymentDocuments.bankSaveSuccess'));
      void reFetch();
    } catch {
      toast.error(t('profile:paymentDocuments.bankSaveFailed'));
    }
  };

  const handleGenerate = async (month: PaymentMonthSummary) => {
    try {
      const result = await generateDocument(month.year, month.month);

      if (!result.ok) {
        const code = result.error instanceof DansshipAPIError ? result.error.body.error_code : undefined;

        toast.error(
          code === DANSSHIP_ERROR_CODE.INSTRUCTOR_PAYMENT_NO_NEW_CLASSES
            ? t('profile:paymentDocuments.noNewClasses')
            : t('profile:paymentDocuments.generateFailed'),
        );

        return;
      }

      toast.success(t('profile:paymentDocuments.generateSuccess'));
      void reFetch();
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : undefined;

      toast.error(
        code === DANSSHIP_ERROR_CODE.INSTRUCTOR_PAYMENT_NO_NEW_CLASSES
          ? t('profile:paymentDocuments.noNewClasses')
          : t('profile:paymentDocuments.generateFailed'),
      );
    }
  };

  const handleOpenFile = async (kind: PaymentDocumentKind) => {
    const { ok, data } = await getFileViewUrl(kind);

    if (!ok || !data?.view_url) {
      toast.error(t('profile:paymentDocuments.viewFailed'));

      return;
    }

    openUrl(data.view_url);
  };

  const handleOpenDocument = async (documentId: string) => {
    const { ok, data } = await getDocumentViewUrl(documentId);

    if (!ok || !data?.view_url) {
      toast.error(t('profile:paymentDocuments.viewFailed'));

      return;
    }

    openUrl(data.view_url);
  };

  const handleConfirm = async () => {
    if (!confirmTargetId) return;

    try {
      const { ok } = await confirmDocument(confirmTargetId);

      if (!ok) {
        toast.error(t('profile:paymentDocuments.confirmFailed'));

        return;
      }

      toast.success(t('profile:paymentDocuments.confirmSuccess'));
      setConfirmTargetId(null);
      void reFetch();
    } catch {
      toast.error(t('profile:paymentDocuments.confirmFailed'));
    }
  };

  const handleDispute = async () => {
    if (!disputeTargetId || !disputeReason.trim()) return;

    try {
      const { ok } = await disputeDocument(disputeTargetId, disputeReason.trim());

      if (!ok) {
        toast.error(t('profile:paymentDocuments.disputeFailed'));

        return;
      }

      toast.success(t('profile:paymentDocuments.disputeSuccess'));
      setDisputeConfirmOpen(false);
      setDisputeTargetId(null);
      setDisputeReason('');
      void reFetch();
    } catch {
      toast.error(t('profile:paymentDocuments.disputeFailed'));
    }
  };

  if (!user) {
    return (
      <Section navbarPadding>
        <div className='grid place-content-center py-12'>
          <SpinnerLoader message={t('profile:paymentDocuments.loading')} />
        </div>
      </Section>
    );
  }

  if (!canOpenPaymentDocuments) {
    return <Navigate to={PageURLS.profile.root} replace />;
  }

  return (
    <Section navbarPadding className='grid gap-8 pb-8'>
      <SectionHeading title={t('profile:paymentDocuments.title')} subtitle={t('profile:paymentDocuments.subtitle')} />

      {isLoading && !list ? (
        <div className='grid place-content-center py-12'>
          <SpinnerLoader message={t('profile:paymentDocuments.loading')} />
        </div>
      ) : hasError ? (
        <p className='py-8 text-center text-sm text-muted-foreground'>{t('profile:paymentDocuments.loadFailed')}</p>
      ) : (
        <>
          <section className='grid gap-4 rounded-md border bg-white/50 p-5'>
            <h3 className='text-base font-bold'>{t('profile:paymentDocuments.documentsTitle')}</h3>

            {profile ? (
              <PaymentDocumentFiles
                profile={profile}
                isUploading={isUploading}
                isOpeningFile={isOpeningFile}
                onUpload={(kind, file) => void handleUpload(kind, file)}
                onView={kind => void handleOpenFile(kind)}
              />
            ) : null}

            <form
              className='grid gap-3.5 border-t border-border pt-4'
              onSubmit={event => {
                event.preventDefault();
                void handleSaveBank();
              }}
            >
              <h4 className='text-sm font-semibold'>{t('profile:paymentDocuments.bankFieldsTitle')}</h4>
              <div className='grid gap-4 sm:grid-cols-3'>
                <div className='grid gap-1.5'>
                  <Label htmlFor='bank-name'>{t('profile:paymentDocuments.bankName')}</Label>
                  <Input id='bank-name' value={bankName} onChange={event => setBankName(event.target.value)} required />
                </div>
                <div className='grid gap-1.5'>
                  <Label htmlFor='account-type'>{t('profile:paymentDocuments.accountType')}</Label>
                  <select
                    id='account-type'
                    className='flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                    value={accountType}
                    onChange={event => setAccountType(event.target.value as BankAccountType | '')}
                    required
                  >
                    <option value=''>{t('profile:paymentDocuments.accountTypePlaceholder')}</option>
                    <option value='savings'>{t('profile:paymentDocuments.accountTypeSavings')}</option>
                    <option value='checking'>{t('profile:paymentDocuments.accountTypeChecking')}</option>
                  </select>
                </div>
                <div className='grid gap-1.5'>
                  <Label htmlFor='account-number'>{t('profile:paymentDocuments.accountNumber')}</Label>
                  <Input
                    id='account-number'
                    value={accountNumber}
                    onChange={event => setAccountNumber(event.target.value)}
                    required
                  />
                </div>
              </div>
              <div className='flex justify-end'>
                <Button type='submit' disabled={isSavingBank}>
                  {t('profile:paymentDocuments.saveBank')}
                </Button>
              </div>
            </form>
          </section>

          <section className='grid min-w-0 gap-4'>
            <h3 className='text-lg font-semibold'>{t('profile:paymentDocuments.cuentasTitle')}</h3>
            {!list?.months.length ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>
                {t('profile:paymentDocuments.emptyMonths')}
              </p>
            ) : (
              <PaymentMonthsList
                months={list.months}
                isGenerating={isGenerating}
                isConfirming={isConfirming}
                isOpeningDocument={isOpeningDocument}
                onGenerate={month => void handleGenerate(month)}
                onConfirm={setConfirmTargetId}
                onDispute={documentId => {
                  setDisputeTargetId(documentId);
                  setDisputeReason('');
                }}
                onDownload={documentId => void handleOpenDocument(documentId)}
              />
            )}
          </section>
        </>
      )}

      {disputeTargetId ? (
        <div className='grid gap-3 rounded-md border border-alert/30 bg-white/50 p-4'>
          <h3 className='text-sm font-semibold'>{t('profile:paymentDocuments.disputeTitle')}</h3>
          <p className='text-sm text-muted-foreground'>{t('profile:paymentDocuments.disputeHint')}</p>
          <div className='grid gap-1.5'>
            <Label htmlFor='dispute-reason'>{t('profile:paymentDocuments.disputeReason')}</Label>
            <Textarea
              id='dispute-reason'
              value={disputeReason}
              onChange={event => setDisputeReason(event.target.value)}
              placeholder={t('profile:paymentDocuments.disputeReasonPlaceholder')}
              rows={3}
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setDisputeTargetId(null);
                setDisputeReason('');
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button type='button' disabled={!disputeReason.trim()} onClick={() => setDisputeConfirmOpen(true)}>
              {t('profile:paymentDocuments.disputeContinue')}
            </Button>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmTargetId)}
        onOpenChange={open => {
          if (!open) setConfirmTargetId(null);
        }}
        onConfirm={() => void handleConfirm()}
        title={t('profile:paymentDocuments.confirmTitle')}
        description={t('profile:paymentDocuments.confirmDescription')}
        confirmLabel={t('profile:paymentDocuments.confirm')}
        cancelLabel={t('common:cancel')}
        isLoading={isConfirming}
      />
      <ConfirmDialog
        open={disputeConfirmOpen}
        onOpenChange={setDisputeConfirmOpen}
        onConfirm={() => void handleDispute()}
        title={t('profile:paymentDocuments.disputeConfirmTitle')}
        description={t('profile:paymentDocuments.disputeConfirmDescription')}
        confirmLabel={t('profile:paymentDocuments.disputeConfirmLabel')}
        cancelLabel={t('common:cancel')}
        confirmVariant='destructive'
        isLoading={isDisputing}
      />
    </Section>
  );
}

export const SecurePaymentDocumentsPage = SecurityGuard(PaymentDocumentsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
