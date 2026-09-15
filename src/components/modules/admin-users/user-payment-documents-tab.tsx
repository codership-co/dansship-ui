import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { OptionalFileUpload } from '@components/forms';
import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import {
  Button,
  Input,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@components/ui';
import { DansshipAPI, PaymentDocumentContentTypes, type PaymentDocument, type PaymentDocumentKind } from '@core/api';
import { formatPrice } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

function openUrl(url: string | undefined) {
  if (!url) return;

  window.open(url, '_blank', 'noopener,noreferrer');
}

const VOIDABLE_STATUSES = new Set(['issued', 'disputed']);

export function UserPaymentDocumentsTab({
  userId,
  canVoid,
  canProcess = false,
  canManagePayRate = false,
}: {
  userId: string;
  canVoid: boolean;
  canProcess?: boolean;
  canManagePayRate?: boolean;
}) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.instructorPaymentsAdmin.getUserPaymentDocuments(userId),
    !!userId,
    [userId],
  );
  const data = response?.data;
  const profile = data?.profile;
  const documents = data?.documents ?? [];

  const { call: getFileViewUrl, isLoading: isOpeningFile } = useCallablePromise((kind: PaymentDocumentKind) =>
    DansshipAPI.instructorPaymentsAdmin.getFileViewUrl(userId, kind),
  );
  const { call: getDocumentViewUrl, isLoading: isOpeningDocument } = useCallablePromise((documentId: string) =>
    DansshipAPI.instructorPaymentsAdmin.getDocumentViewUrl(userId, documentId),
  );
  const { call: getReceiptViewUrl, isLoading: isOpeningReceipt } = useCallablePromise((documentId: string) =>
    DansshipAPI.instructorPaymentsAdmin.getReceiptViewUrl(userId, documentId),
  );
  const { call: voidDocument, isLoading: isVoiding } = useCallablePromise((documentId: string, reason: string) =>
    DansshipAPI.instructorPaymentsAdmin.voidDocument(userId, documentId, reason),
  );
  const { call: updatePaymentProfile, isLoading: isToggling } = useCallablePromise((enabled: boolean) =>
    DansshipAPI.instructorPaymentsAdmin.updateUserPaymentProfile(userId, {
      cuenta_de_cobro_enabled: enabled,
    }),
  );
  const { call: saveFixedRate, isLoading: isSavingRate } = useCallablePromise((monthlyAmount: number) =>
    DansshipAPI.instructorPaymentsAdmin.setFixedPayRate(userId, { monthly_amount: monthlyAmount }),
  );
  const { call: payDocument, isLoading: isPaying } = useCallablePromise(async (documentId: string, file: File) => {
    const fileKey = await DansshipAPI.instructorPaymentsAdmin.uploadReceipt(userId, documentId, file);

    return DansshipAPI.instructorPaymentsAdmin.payDocument(userId, documentId, fileKey);
  });

  const [voidTarget, setVoidTarget] = useState<PaymentDocument | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [payTarget, setPayTarget] = useState<PaymentDocument | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [monthlyAmount, setMonthlyAmount] = useState('');
  const [rateInitialized, setRateInitialized] = useState(false);

  useEffect(() => {
    setRateInitialized(false);
    setMonthlyAmount('');
  }, [userId]);

  useEffect(() => {
    if (rateInitialized || !data) return;

    setMonthlyAmount(data.fixed_pay_rate ? String(data.fixed_pay_rate.monthly_amount) : '');
    setRateInitialized(true);
  }, [data, rateInitialized]);

  const handleOpenFile = async (kind: PaymentDocumentKind) => {
    const { ok, data: view } = await getFileViewUrl(kind);

    if (!ok || !view?.view_url) {
      toast.error(t('admin:users.details.paymentDocuments.viewFailed'));

      return;
    }

    openUrl(view.view_url);
  };

  const handleOpenDocument = async (documentId: string) => {
    const { ok, data: view } = await getDocumentViewUrl(documentId);

    if (!ok || !view?.view_url) {
      toast.error(t('admin:users.details.paymentDocuments.viewFailed'));

      return;
    }

    openUrl(view.view_url);
  };

  const handleOpenReceipt = async (documentId: string) => {
    const { ok, data: view } = await getReceiptViewUrl(documentId);

    if (!ok || !view?.view_url) {
      toast.error(t('admin:users.details.paymentDocuments.viewFailed'));

      return;
    }

    openUrl(view.view_url);
  };

  const handleConfirmVoid = async () => {
    if (!voidTarget || !voidReason.trim()) return;

    const { ok } = await voidDocument(voidTarget.id, voidReason.trim());

    if (!ok) {
      toast.error(t('admin:users.details.paymentDocuments.voidFailed'));

      return;
    }

    toast.success(t('admin:users.details.paymentDocuments.voidSuccess'));
    setConfirmOpen(false);
    setVoidTarget(null);
    setVoidReason('');
    void reFetch();
  };

  const handlePay = async () => {
    if (!payTarget || !receiptFile) return;

    try {
      const { ok } = await payDocument(payTarget.id, receiptFile);

      if (!ok) {
        toast.error(t('admin:users.details.paymentDocuments.payFailed'));

        return;
      }

      toast.success(t('admin:users.details.paymentDocuments.paySuccess'));
      setPayTarget(null);
      setReceiptFile(null);
      void reFetch();
    } catch {
      toast.error(t('admin:users.details.paymentDocuments.payFailed'));
    }
  };

  const handleToggleCuenta = async (checked: boolean) => {
    const { ok } = await updatePaymentProfile(checked);

    if (!ok) {
      toast.error(t('admin:users.details.paymentDocuments.toggleFailed'));

      return;
    }

    toast.success(t('admin:users.details.paymentDocuments.toggleSuccess'));
    void reFetch();
  };

  const handleSaveFixedRate = async () => {
    const amount = Number(monthlyAmount);

    if (!Number.isFinite(amount) || amount <= 0) {
      toast.error(t('admin:users.details.paymentDocuments.fixedRateInvalid'));

      return;
    }

    const { ok } = await saveFixedRate(amount);

    if (!ok) {
      toast.error(t('admin:users.details.paymentDocuments.fixedRateFailed'));

      return;
    }

    toast.success(t('admin:users.details.paymentDocuments.fixedRateSuccess'));
    void reFetch();
  };

  if (isLoading && !data) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  const accountTypeLabel =
    profile?.account_type === 'checking'
      ? t('admin:users.details.paymentDocuments.accountTypeChecking')
      : profile?.account_type === 'savings'
        ? t('admin:users.details.paymentDocuments.accountTypeSavings')
        : (profile?.account_type ?? '—');

  return (
    <section className='grid gap-6'>
      <div className='flex items-start justify-between gap-4 rounded-md border bg-white/50 p-4'>
        <div className='space-y-1'>
          <Label htmlFor='cuenta-de-cobro-enabled' className='text-sm font-semibold'>
            {t('admin:users.details.paymentDocuments.requiresCuenta')}
          </Label>
          <p className='text-sm text-muted-foreground'>
            {t('admin:users.details.paymentDocuments.requiresCuentaHint')}
          </p>
        </div>
        <Switch
          id='cuenta-de-cobro-enabled'
          checked={profile?.cuenta_de_cobro_enabled ?? true}
          disabled={isToggling}
          onCheckedChange={checked => void handleToggleCuenta(checked)}
        />
      </div>

      {canManagePayRate ? (
        <form
          className='grid gap-3 rounded-md border bg-white/50 p-4'
          onSubmit={event => {
            event.preventDefault();
            void handleSaveFixedRate();
          }}
        >
          <h3 className='text-sm font-semibold'>{t('admin:users.details.paymentDocuments.fixedRateTitle')}</h3>
          <p className='text-sm text-muted-foreground'>{t('admin:users.details.paymentDocuments.fixedRateHint')}</p>
          <div className='flex flex-wrap items-end gap-3'>
            <div className='grid min-w-48 flex-1 gap-1.5'>
              <Label htmlFor='fixed-monthly-amount'>{t('admin:users.details.paymentDocuments.fixedRateAmount')}</Label>
              <Input
                id='fixed-monthly-amount'
                type='number'
                min='1'
                step='1'
                value={monthlyAmount}
                onChange={event => setMonthlyAmount(event.target.value)}
                required
              />
            </div>
            <Button type='submit' disabled={isSavingRate}>
              {t('admin:users.details.paymentDocuments.fixedRateSave')}
            </Button>
          </div>
        </form>
      ) : null}

      <div className='grid gap-4 rounded-md border bg-white/50 p-4'>
        <h3 className='text-sm font-semibold'>{t('admin:users.details.paymentDocuments.filesTitle')}</h3>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant='outline'
            disabled={!profile?.has_rut || isOpeningFile}
            onClick={() => void handleOpenFile('rut')}
          >
            {t('admin:users.details.paymentDocuments.viewRut')}
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={!profile?.has_bank_certificate || isOpeningFile}
            onClick={() => void handleOpenFile('bank-certificate')}
          >
            {t('admin:users.details.paymentDocuments.viewBankCertificate')}
          </Button>
          <Button
            type='button'
            variant='outline'
            disabled={!profile?.has_signature || isOpeningFile}
            onClick={() => void handleOpenFile('signature')}
          >
            {t('admin:users.details.paymentDocuments.viewSignature')}
          </Button>
          {profile?.payment_type === 'fixed_amount' || profile?.has_social_security ? (
            <Button
              type='button'
              variant='outline'
              disabled={!profile?.has_social_security || isOpeningFile}
              onClick={() => void handleOpenFile('social-security')}
            >
              {t('admin:users.details.paymentDocuments.viewSocialSecurity')}
            </Button>
          ) : null}
        </div>
        <dl className='grid gap-2 text-sm sm:grid-cols-3'>
          <div>
            <dt className='text-muted-foreground'>{t('admin:users.details.paymentDocuments.bankName')}</dt>
            <dd>{profile?.bank_name || '—'}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>{t('admin:users.details.paymentDocuments.accountType')}</dt>
            <dd>{accountTypeLabel}</dd>
          </div>
          <div>
            <dt className='text-muted-foreground'>{t('admin:users.details.paymentDocuments.accountNumber')}</dt>
            <dd>{profile?.account_number || '—'}</dd>
          </div>
        </dl>
      </div>

      {voidTarget ? (
        <div className='grid gap-3 rounded-md border border-alert/30 bg-white/50 p-4'>
          <h3 className='text-sm font-semibold'>{t('admin:users.details.paymentDocuments.voidTitle')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('admin:users.details.paymentDocuments.voidHint', {
              month: t(`admin:users.details.paymentDocuments.months.${voidTarget.period_month}`),
              year: voidTarget.period_year,
            })}
          </p>
          <div className='grid gap-1.5'>
            <Label htmlFor='void-reason'>{t('admin:users.details.paymentDocuments.voidReason')}</Label>
            <Textarea
              id='void-reason'
              value={voidReason}
              onChange={event => setVoidReason(event.target.value)}
              placeholder={t('admin:users.details.paymentDocuments.voidReasonPlaceholder')}
              rows={3}
            />
          </div>
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setVoidTarget(null);
                setVoidReason('');
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button
              type='button'
              variant='destructive'
              disabled={!voidReason.trim()}
              onClick={() => setConfirmOpen(true)}
            >
              {t('admin:users.details.paymentDocuments.voidContinue')}
            </Button>
          </div>
        </div>
      ) : null}

      {payTarget ? (
        <div className='grid gap-3 rounded-md border bg-white/50 p-4'>
          <h3 className='text-sm font-semibold'>{t('admin:users.details.paymentDocuments.payTitle')}</h3>
          <p className='text-sm text-muted-foreground'>
            {t('admin:users.details.paymentDocuments.payHint', {
              month: t(`admin:users.details.paymentDocuments.months.${payTarget.period_month}`),
              year: payTarget.period_year,
            })}
          </p>
          <OptionalFileUpload
            label={t('admin:users.details.paymentDocuments.receipt')}
            helperText={t('admin:users.details.paymentDocuments.receiptHint')}
            acceptedTypes={PaymentDocumentContentTypes}
            isUploading={isPaying}
            onChange={file => setReceiptFile(file)}
          />
          <div className='flex justify-end gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setPayTarget(null);
                setReceiptFile(null);
              }}
            >
              {t('common:cancel')}
            </Button>
            <Button type='button' disabled={!receiptFile || isPaying} onClick={() => void handlePay()}>
              {t('admin:users.details.paymentDocuments.pay')}
            </Button>
          </div>
        </div>
      ) : null}

      {!documents.length ? (
        <p className='py-8 text-center text-sm text-muted-foreground'>
          {t('admin:users.details.paymentDocuments.empty')}
        </p>
      ) : (
        <div className='rounded-md border bg-white/50 overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin:users.details.paymentDocuments.columns.period')}</TableHead>
                <TableHead>{t('admin:users.details.paymentDocuments.columns.status')}</TableHead>
                <TableHead>{t('admin:users.details.paymentDocuments.columns.total')}</TableHead>
                <TableHead>{t('admin:users.details.paymentDocuments.columns.issuedAt')}</TableHead>
                <TableHead>{t('admin:users.details.paymentDocuments.columns.void')}</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {documents.map(document => {
                const isPayable = document.id === data?.payable_document_id;
                const canVoidThis = canVoid && VOIDABLE_STATUSES.has(document.status);
                const canPayThis = canProcess && document.status === 'confirmed';

                return (
                  <TableRow key={document.id} className={isPayable ? 'bg-primary/5' : undefined}>
                    <TableCell>
                      {t(`admin:users.details.paymentDocuments.months.${document.period_month}`)} {document.period_year}
                      {isPayable ? (
                        <span className='ml-2 text-xs font-medium text-primary'>
                          {t('admin:users.details.paymentDocuments.payable')}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell>
                      {t(`admin:users.details.paymentDocuments.status.${document.status}`, {
                        defaultValue: document.status,
                      })}
                      {document.dispute_reason ? (
                        <p className='mt-1 text-xs text-muted-foreground'>{document.dispute_reason}</p>
                      ) : null}
                    </TableCell>
                    <TableCell>{formatPrice(document.total_amount, 'COP')}</TableCell>
                    <TableCell>{format(parseISO(document.issued_at), 'MMM d, yyyy HH:mm', { locale })}</TableCell>
                    <TableCell className='max-w-xs'>
                      {document.void_reason ? (
                        <span title={document.void_reason}>
                          {document.voided_at
                            ? `${format(parseISO(document.voided_at), 'MMM d, yyyy', { locale })} · ${document.void_reason}`
                            : document.void_reason}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex justify-end gap-2'>
                        <Button
                          type='button'
                          variant='outline'
                          size='sm'
                          disabled={isOpeningDocument}
                          onClick={() => void handleOpenDocument(document.id)}
                        >
                          {t('admin:users.details.paymentDocuments.download')}
                        </Button>
                        {document.payment_receipt_file_key ? (
                          <Button
                            type='button'
                            variant='outline'
                            size='sm'
                            disabled={isOpeningReceipt}
                            onClick={() => void handleOpenReceipt(document.id)}
                          >
                            {t('admin:users.details.paymentDocuments.viewReceipt')}
                          </Button>
                        ) : null}
                        {canPayThis ? (
                          <Button type='button' size='sm' onClick={() => setPayTarget(document)}>
                            {t('admin:users.details.paymentDocuments.pay')}
                          </Button>
                        ) : null}
                        {canVoidThis ? (
                          <Button type='button' variant='destructive' size='sm' onClick={() => setVoidTarget(document)}>
                            {t('admin:users.details.paymentDocuments.void')}
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

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        onConfirm={() => void handleConfirmVoid()}
        title={t('admin:users.details.paymentDocuments.voidConfirmTitle')}
        description={t('admin:users.details.paymentDocuments.voidConfirmDescription')}
        confirmLabel={t('admin:users.details.paymentDocuments.void')}
        cancelLabel={t('common:cancel')}
        confirmVariant='destructive'
        isLoading={isVoiding}
      />
    </section>
  );
}
