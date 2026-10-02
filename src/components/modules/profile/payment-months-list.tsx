import { useTranslation } from 'react-i18next';

import { Button } from '@components/ui';
import { cn, formatPrice } from '@helpers';

import type { PaymentDocument, PaymentMonthSummary } from '@core/api';

type PaymentMonthsListProps = {
  months: Array<PaymentMonthSummary>;
  isGenerating: boolean;
  isConfirming: boolean;
  isOpeningDocument: boolean;
  onGenerate: (month: PaymentMonthSummary) => void;
  onConfirm: (documentId: string) => void;
  onDispute: (documentId: string) => void;
  onDownload: (documentId: string) => void;
};

function monthKey(month: PaymentMonthSummary) {
  return `${month.year}-${month.month}`;
}

function isCurrentColombiaMonth(year: number, month: number) {
  const [currentYear, currentMonth] = new Date()
    .toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
    .split('-')
    .map(Number);

  return year === currentYear && month === currentMonth;
}

function monthDocuments(month: PaymentMonthSummary) {
  if (month.documents?.length) return month.documents;

  return month.issued_document ? [month.issued_document] : [];
}

function monthTotal(documents: Array<PaymentDocument>) {
  if (!documents.length) return null;

  return documents.reduce((sum, document) => sum + document.total_amount, 0);
}

function documentNote(document: PaymentDocument, voidedNote: (reason: string) => string) {
  if (document.status === 'voided' && document.void_reason) return voidedNote(document.void_reason);

  return document.dispute_reason || null;
}

function DocumentActions({
  document,
  alignEnd,
  isConfirming,
  isOpeningDocument,
  onConfirm,
  onDispute,
  onDownload,
}: {
  document: PaymentDocument;
  alignEnd?: boolean;
  isConfirming: boolean;
  isOpeningDocument: boolean;
  onConfirm: (documentId: string) => void;
  onDispute: (documentId: string) => void;
  onDownload: (documentId: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', alignEnd && 'justify-end')}>
      {document.status === 'issued' ? (
        <>
          <Button type='button' size='sm' disabled={isConfirming} onClick={() => onConfirm(document.id)}>
            {t('profile:paymentDocuments.confirm')}
          </Button>
          <Button type='button' variant='outline' size='sm' onClick={() => onDispute(document.id)}>
            {t('profile:paymentDocuments.dispute')}
          </Button>
        </>
      ) : null}
      <Button
        type='button'
        variant='outline'
        size='sm'
        disabled={isOpeningDocument}
        onClick={() => onDownload(document.id)}
      >
        {t('profile:paymentDocuments.download')}
      </Button>
    </div>
  );
}

function MonthBlock({
  month,
  isGenerating,
  isConfirming,
  isOpeningDocument,
  onGenerate,
  onConfirm,
  onDispute,
  onDownload,
}: { month: PaymentMonthSummary } & Omit<PaymentMonthsListProps, 'months'>) {
  const { t } = useTranslation();
  const documents = monthDocuments(month);
  const total = monthTotal(documents);
  const canGenerate = month.can_generate || month.status === 'available';
  const generateNote =
    month.can_generate && isCurrentColombiaMonth(month.year, month.month)
      ? t('profile:paymentDocuments.substituteOpenMonth')
      : t('profile:paymentDocuments.closedMonthGenerate');
  const missingNote =
    month.status === 'blocked' && month.missing_requirements.length
      ? month.missing_requirements
          .map(code => t(`profile:paymentDocuments.missing.${code}`, { defaultValue: code }))
          .join(', ')
      : null;
  const emptyStatus =
    documents.length === 0 && (month.status === 'in_progress' || month.status === 'blocked')
      ? t(`profile:paymentDocuments.monthStatus.${month.status}`)
      : null;

  const periodLabel = `${t(`profile:paymentDocuments.months.${month.month}`)} ${month.year}`;
  const totalLabel = total === null ? '—' : formatPrice(total, 'COP');
  const accountLine = (document: PaymentDocument, index: number) =>
    t('profile:paymentDocuments.accountLine', {
      index: index + 1,
      status: t(`profile:paymentDocuments.monthStatus.${document.status}`, {
        defaultValue: document.status,
      }),
      amount: formatPrice(document.total_amount, 'COP'),
    });

  return (
    <div className='border-b border-border last:border-b-0 md:border-b-2'>
      <div className='px-4 py-4 md:hidden'>
        <p className='font-semibold'>{periodLabel}</p>

        <div className='mt-4'>
          <p className='text-[10px] font-semibold tracking-wide text-muted-foreground uppercase'>
            {t('profile:paymentDocuments.columns.total')}
          </p>
          <p className='mt-0.5 text-[13px] font-semibold'>{totalLabel}</p>
        </div>

        <div className='mt-4'>
          {documents.length > 0 || emptyStatus ? (
            <p className='mb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase'>
              {t('profile:paymentDocuments.columns.documents')}
            </p>
          ) : null}
          {emptyStatus ? (
            <div className='flex flex-col gap-1 py-1'>
              <span className='text-[13px] font-semibold'>{emptyStatus}</span>
              {missingNote ? <p className='text-xs text-muted-foreground'>{missingNote}</p> : null}
            </div>
          ) : null}
          {documents.map((document, index) => {
            const note = documentNote(document, reason => t('profile:paymentDocuments.voidedNote', { reason }));

            return (
              <div key={document.id} className={cn('py-2', index > 0 && 'mt-1 border-t border-border pt-3')}>
                <p className='text-[13px] font-semibold break-words'>{accountLine(document, index)}</p>
                {note ? <p className='mt-0.5 text-xs text-muted-foreground'>{note}</p> : null}
                <div className='mt-2'>
                  <DocumentActions
                    document={document}
                    isConfirming={isConfirming}
                    isOpeningDocument={isOpeningDocument}
                    onConfirm={onConfirm}
                    onDispute={onDispute}
                    onDownload={onDownload}
                  />
                </div>
              </div>
            );
          })}
          {canGenerate ? (
            <div className={cn(documents.length > 0 && 'mt-2 border-t border-dashed border-border pt-3')}>
              <p className='text-[10px] font-semibold tracking-wide text-primary uppercase'>
                {t('profile:paymentDocuments.newAccount')}
              </p>
              <p className='mt-1.5 text-xs text-muted-foreground'>{generateNote}</p>
              <div className='mt-3'>
                <Button type='button' size='sm' disabled={isGenerating} onClick={() => onGenerate(month)}>
                  {t('profile:paymentDocuments.generate')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>

      <div className='hidden md:grid md:grid-cols-[140px_110px_minmax(0,1fr)_230px]'>
        <div className='px-4 py-4 font-semibold'>{periodLabel}</div>
        <div className='px-4 py-4 text-[13px] font-semibold'>{totalLabel}</div>
        <div className='min-w-0 px-4 py-4'>
          {emptyStatus ? (
            <div className='flex flex-col gap-1 py-1'>
              <span className='text-[13px] font-semibold'>{emptyStatus}</span>
              {missingNote ? <p className='text-xs text-muted-foreground'>{missingNote}</p> : null}
            </div>
          ) : null}
          {documents.map((document, index) => {
            const note = documentNote(document, reason => t('profile:paymentDocuments.voidedNote', { reason }));

            return (
              <div
                key={document.id}
                className={cn(
                  'flex min-h-[38px] flex-col justify-center gap-0.5 py-2',
                  index < documents.length - 1 && 'border-b border-border',
                )}
              >
                <span className='text-[13px] font-semibold break-words'>{accountLine(document, index)}</span>
                {note ? <p className='text-xs text-muted-foreground'>{note}</p> : null}
              </div>
            );
          })}
          {canGenerate ? <p className='pt-2.5 text-xs text-muted-foreground'>{generateNote}</p> : null}
        </div>
        <div className='min-w-0 px-4 py-4'>
          <div className='flex flex-col items-end'>
            {emptyStatus ? <div className='py-1' /> : null}
            {documents.map((document, index) => (
              <div
                key={document.id}
                className={cn(
                  'flex min-h-[38px] w-full items-center justify-end py-2',
                  index < documents.length - 1 && 'border-b border-border',
                )}
              >
                <DocumentActions
                  document={document}
                  alignEnd
                  isConfirming={isConfirming}
                  isOpeningDocument={isOpeningDocument}
                  onConfirm={onConfirm}
                  onDispute={onDispute}
                  onDownload={onDownload}
                />
              </div>
            ))}
            {canGenerate ? (
              <div className='flex w-full justify-end pt-2.5'>
                <Button type='button' size='sm' disabled={isGenerating} onClick={() => onGenerate(month)}>
                  {t('profile:paymentDocuments.generate')}
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PaymentMonthsList({ months, ...actions }: PaymentMonthsListProps) {
  const { t } = useTranslation();

  return (
    <div className='overflow-hidden rounded-md border bg-white/50'>
      <div className='hidden border-b border-border md:grid md:grid-cols-[140px_110px_minmax(0,1fr)_230px]'>
        <div className='px-4 py-3 text-[13px] font-semibold'>{t('profile:paymentDocuments.columns.period')}</div>
        <div className='px-4 py-3 text-[13px] font-semibold'>{t('profile:paymentDocuments.columns.total')}</div>
        <div className='px-4 py-3 text-[13px] font-semibold'>{t('profile:paymentDocuments.columns.documents')}</div>
        <div className='px-4 py-3' />
      </div>
      {months.map(month => (
        <MonthBlock key={monthKey(month)} month={month} {...actions} />
      ))}
    </div>
  );
}
