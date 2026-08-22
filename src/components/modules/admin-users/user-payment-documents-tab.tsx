import { format, parseISO } from 'date-fns';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import {
  Button,
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
import { DansshipAPI, type PaymentDocument, type PaymentDocumentKind } from '@core/api';
import { formatPrice } from '@helpers';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

function openUrl(url: string | undefined) {
  if (!url) return;

  window.open(url, '_blank', 'noopener,noreferrer');
}

export function UserPaymentDocumentsTab({ userId, canVoid }: { userId: string; canVoid: boolean }) {
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
  const { call: voidDocument, isLoading: isVoiding } = useCallablePromise((documentId: string, reason: string) =>
    DansshipAPI.instructorPaymentsAdmin.voidDocument(userId, documentId, reason),
  );
  const { call: updatePaymentProfile, isLoading: isToggling } = useCallablePromise((enabled: boolean) =>
    DansshipAPI.instructorPaymentsAdmin.updateUserPaymentProfile(userId, {
      cuenta_de_cobro_enabled: enabled,
    }),
  );

  const [voidTarget, setVoidTarget] = useState<PaymentDocument | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

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

  const handleToggleCuenta = async (checked: boolean) => {
    const { ok } = await updatePaymentProfile(checked);

    if (!ok) {
      toast.error(t('admin:users.details.paymentDocuments.toggleFailed'));

      return;
    }

    toast.success(t('admin:users.details.paymentDocuments.toggleSuccess'));
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
                const isIssued = document.status === 'issued';

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
                      {document.status === 'voided'
                        ? t('admin:users.details.paymentDocuments.statusVoided')
                        : t('admin:users.details.paymentDocuments.statusIssued')}
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
                        {canVoid && isIssued ? (
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
