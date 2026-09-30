import type { ReactNode } from 'react';

import { useTranslation } from 'react-i18next';
import { LuLoader } from 'react-icons/lu';

import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { formatPrice } from '@helpers';

import type { PaymentMonthSummary } from '@core/api';

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

type MonthActionsProps = {
  month: PaymentMonthSummary;
  className?: string;
} & Pick<
  PaymentMonthsListProps,
  'isGenerating' | 'isConfirming' | 'isOpeningDocument' | 'onGenerate' | 'onConfirm' | 'onDispute' | 'onDownload'
>;

function monthKey(month: PaymentMonthSummary) {
  return `${month.year}-${month.month}`;
}

function MonthStatus({ month }: { month: PaymentMonthSummary }) {
  const { t } = useTranslation();
  const issuedDocument = month.issued_document;

  return (
    <div className='min-w-0 text-sm'>
      <p>{t(`profile:paymentDocuments.monthStatus.${month.status}`)}</p>
      {month.status === 'blocked' && month.missing_requirements.length ? (
        <p className='mt-1 text-xs break-words text-muted-foreground'>
          {month.missing_requirements
            .map(code =>
              t(`profile:paymentDocuments.missing.${code}`, {
                defaultValue: code,
              }),
            )
            .join(', ')}
        </p>
      ) : null}
      {issuedDocument?.dispute_reason ? (
        <p className='mt-1 text-xs break-words text-muted-foreground'>{issuedDocument.dispute_reason}</p>
      ) : null}
    </div>
  );
}

function MonthActions({
  month,
  className,
  isGenerating,
  isConfirming,
  isOpeningDocument,
  onGenerate,
  onConfirm,
  onDispute,
  onDownload,
}: MonthActionsProps) {
  const { t } = useTranslation();
  const issuedDocument = month.issued_document;
  const canConfirmOrDispute = month.status === 'issued' && Boolean(issuedDocument);
  const actions: Array<ReactNode> = [];

  if (month.status === 'available') {
    actions.push(
      <Button key='generate' type='button' size='sm' disabled={isGenerating} onClick={() => onGenerate(month)}>
        {isGenerating ? <LuLoader className='animate-spin' /> : null}
        {t('profile:paymentDocuments.generate')}
      </Button>,
    );
  }

  if (canConfirmOrDispute && issuedDocument) {
    actions.push(
      <Button
        key='confirm'
        type='button'
        size='sm'
        disabled={isConfirming}
        onClick={() => onConfirm(issuedDocument.id)}
      >
        {t('profile:paymentDocuments.confirm')}
      </Button>,
      <Button key='dispute' type='button' variant='outline' size='sm' onClick={() => onDispute(issuedDocument.id)}>
        {t('profile:paymentDocuments.dispute')}
      </Button>,
    );
  }

  if (issuedDocument) {
    actions.push(
      <Button
        key='download'
        type='button'
        variant='outline'
        size='sm'
        disabled={isOpeningDocument}
        onClick={() => onDownload(issuedDocument.id)}
      >
        {t('profile:paymentDocuments.download')}
      </Button>,
    );
  }

  if (!actions.length) return null;

  return <div className={className}>{actions}</div>;
}

function PaymentMonthCard({
  month,
  ...actions
}: { month: PaymentMonthSummary } & Omit<MonthActionsProps, 'month' | 'className'>) {
  const { t } = useTranslation();
  const issuedDocument = month.issued_document;

  return (
    <article className='grid min-w-0 gap-3 rounded-md border bg-white/50 p-4'>
      <div className='flex min-w-0 items-start justify-between gap-3'>
        <p className='font-medium'>
          {t(`profile:paymentDocuments.months.${month.month}`)} {month.year}
        </p>
        <p className='shrink-0 text-sm'>{issuedDocument ? formatPrice(issuedDocument.total_amount, 'COP') : '—'}</p>
      </div>
      <MonthStatus month={month} />
      <MonthActions month={month} className='flex flex-wrap gap-2' {...actions} />
    </article>
  );
}

export function PaymentMonthsList({ months, ...actions }: PaymentMonthsListProps) {
  const { t } = useTranslation();

  return (
    <>
      <div className='grid min-w-0 gap-3 md:hidden'>
        {months.map(month => (
          <PaymentMonthCard key={monthKey(month)} month={month} {...actions} />
        ))}
      </div>

      <div className='hidden min-w-0 overflow-hidden rounded-md border bg-white/50 md:block'>
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
            {months.map(month => {
              const issuedDocument = month.issued_document;

              return (
                <TableRow key={monthKey(month)}>
                  <TableCell className='whitespace-normal'>
                    {t(`profile:paymentDocuments.months.${month.month}`)} {month.year}
                  </TableCell>
                  <TableCell className='whitespace-normal'>
                    <MonthStatus month={month} />
                  </TableCell>
                  <TableCell className='whitespace-normal'>
                    {issuedDocument ? formatPrice(issuedDocument.total_amount, 'COP') : '—'}
                  </TableCell>
                  <TableCell className='whitespace-normal'>
                    <MonthActions month={month} className='flex flex-wrap justify-end gap-2' {...actions} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
