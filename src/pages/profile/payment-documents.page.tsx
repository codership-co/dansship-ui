import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuLoader } from 'react-icons/lu';
import { Navigate } from 'react-router';
import { toast } from 'sonner';

import { Section, SectionHeading } from '@components/containers';
import { OptionalFileUpload } from '@components/forms';
import { SpinnerLoader } from '@components/loaders';
import { Button, Input, Label, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useAuth } from '@contexts';
import {
  DansshipAPI,
  PaymentDocumentContentTypes,
  SignatureContentTypes,
  type BankAccountType,
  type PaymentDocumentKind,
  type PaymentMonthSummary,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { PERMISSION } from '@core/permissions';
import { formatPrice } from '@helpers';
import { useCallablePromise, usePromise } from '@hooks';

function openUrl(url: string | undefined) {
  if (!url) return;

  window.open(url, '_blank', 'noopener,noreferrer');
}

function PaymentDocumentsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { response, isLoading, error, reFetch } = usePromise(() =>
    DansshipAPI.instructorPayments.listPaymentDocuments(),
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
        kind === 'rut' ? 'rut_file_key' : kind === 'signature' ? 'signature_file_key' : 'bank_certificate_file_key';

      return DansshipAPI.instructorPayments.updatePaymentProfile({ [field]: fileKey });
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
      const { ok } = await generateDocument(month.year, month.month);

      if (!ok) {
        toast.error(t('profile:paymentDocuments.generateFailed'));

        return;
      }

      toast.success(t('profile:paymentDocuments.generateSuccess'));
      void reFetch();
    } catch {
      toast.error(t('profile:paymentDocuments.generateFailed'));
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

  if (user?.cuentaDeCobroEnabled === false || profile?.cuenta_de_cobro_enabled === false) {
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
          <section className='grid gap-6 rounded-md border bg-white/50 p-4'>
            <h3 className='text-lg font-semibold'>{t('profile:paymentDocuments.documentsTitle')}</h3>

            <div className='grid gap-6 lg:grid-cols-3'>
              <div className='grid gap-2'>
                <OptionalFileUpload
                  label={t('profile:paymentDocuments.rut')}
                  helperText={t('profile:paymentDocuments.rutHint')}
                  acceptedTypes={PaymentDocumentContentTypes}
                  isUploading={isUploading}
                  onChange={file => void handleUpload('rut', file)}
                />
                {profile?.has_rut ? (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={isOpeningFile}
                    onClick={() => void handleOpenFile('rut')}
                  >
                    {t('profile:paymentDocuments.viewCurrent')}
                  </Button>
                ) : null}
              </div>

              <div className='grid gap-2'>
                <OptionalFileUpload
                  label={t('profile:paymentDocuments.bankCertificate')}
                  helperText={t('profile:paymentDocuments.bankCertificateHint')}
                  acceptedTypes={PaymentDocumentContentTypes}
                  isUploading={isUploading}
                  onChange={file => void handleUpload('bank-certificate', file)}
                />
                {profile?.has_bank_certificate ? (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={isOpeningFile}
                    onClick={() => void handleOpenFile('bank-certificate')}
                  >
                    {t('profile:paymentDocuments.viewCurrent')}
                  </Button>
                ) : null}
              </div>

              <div className='grid gap-2'>
                <OptionalFileUpload
                  label={t('profile:paymentDocuments.signature')}
                  helperText={t('profile:paymentDocuments.signatureHint')}
                  acceptedTypes={SignatureContentTypes}
                  isUploading={isUploading}
                  onChange={file => void handleUpload('signature', file)}
                />
                {profile?.has_signature ? (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    disabled={isOpeningFile}
                    onClick={() => void handleOpenFile('signature')}
                  >
                    {t('profile:paymentDocuments.viewCurrent')}
                  </Button>
                ) : null}
              </div>
            </div>

            <form
              className='grid gap-4'
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

          <section className='grid gap-4'>
            <h3 className='text-lg font-semibold'>{t('profile:paymentDocuments.cuentasTitle')}</h3>
            {!list?.months.length ? (
              <p className='py-8 text-center text-sm text-muted-foreground'>
                {t('profile:paymentDocuments.emptyMonths')}
              </p>
            ) : (
              <div className='rounded-md border bg-white/50 overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('profile:paymentDocuments.columns.period')}</TableHead>
                      <TableHead>{t('profile:paymentDocuments.columns.status')}</TableHead>
                      <TableHead>{t('profile:paymentDocuments.columns.total')}</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {list.months.map(month => {
                      const issuedDocument = month.issued_document;

                      return (
                        <TableRow key={`${month.year}-${month.month}`}>
                          <TableCell>
                            {t(`profile:paymentDocuments.months.${month.month}`)} {month.year}
                          </TableCell>
                          <TableCell>
                            {t(`profile:paymentDocuments.monthStatus.${month.status}`)}
                            {month.status === 'blocked' && month.missing_requirements.length ? (
                              <p className='mt-1 text-xs text-muted-foreground'>
                                {month.missing_requirements
                                  .map(code => t(`profile:paymentDocuments.missing.${code}`, { defaultValue: code }))
                                  .join(', ')}
                              </p>
                            ) : null}
                          </TableCell>
                          <TableCell>
                            {issuedDocument ? formatPrice(issuedDocument.total_amount, 'COP') : '—'}
                          </TableCell>
                          <TableCell>
                            <div className='flex justify-end gap-2'>
                              {month.status === 'available' ? (
                                <Button
                                  type='button'
                                  size='sm'
                                  disabled={isGenerating}
                                  onClick={() => void handleGenerate(month)}
                                >
                                  {isGenerating ? <LuLoader className='animate-spin' /> : null}
                                  {t('profile:paymentDocuments.generate')}
                                </Button>
                              ) : null}
                              {issuedDocument ? (
                                <Button
                                  type='button'
                                  variant='outline'
                                  size='sm'
                                  disabled={isOpeningDocument}
                                  onClick={() => void handleOpenDocument(issuedDocument.id)}
                                >
                                  {t('profile:paymentDocuments.download')}
                                </Button>
                              ) : null}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </section>
        </>
      )}
    </Section>
  );
}

export const SecurePaymentDocumentsPage = SecurityGuard(PaymentDocumentsPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  orPermissions: [PERMISSION.OWN_PAYMENT_DOCUMENT_MANAGE],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
