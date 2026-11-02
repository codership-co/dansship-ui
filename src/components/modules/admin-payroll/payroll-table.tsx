import type { ComponentProps } from 'react';

import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuDownload } from 'react-icons/lu';
import { Link } from 'react-router';

import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { PageURLS } from '@core/constants';
import { formatPrice, toColombiaDateKey } from '@helpers';
import { useDateLocale } from '@hooks';

import type { PayrollDocument } from '@core/api';

export type PayrollDownloadKind = 'invoice' | 'receipt';

const STATUS_VARIANT: Record<string, NonNullable<ComponentProps<typeof Badge>['variant']>> = {
  issued: 'outlineNeutral',
  confirmed: 'outlineWarning',
  disputed: 'destructive',
  paid: 'outlineActive',
  voided: 'destructive',
};

interface PayrollRowsProps {
  documents: Array<PayrollDocument>;
  onDownload: (documentId: string, kind: PayrollDownloadKind) => void;
}

function usePayrollFormatters() {
  const { t } = useTranslation();
  const locale = useDateLocale();

  return {
    day: (iso: string) => format(parseISO(toColombiaDateKey(iso)), 'd MMM yyyy', { locale }),
    period: (year: number, month: number) => {
      const label = format(new Date(year, month - 1, 1), 'LLLL yyyy', {
        locale,
      });

      return label.charAt(0).toUpperCase() + label.slice(1);
    },
    paymentType: (type: string) => t(`admin:payroll.paymentTypes.${type}`, { defaultValue: type }),
    status: (status: string) => t(`admin:payroll.status.${status}`, { defaultValue: status }),
  };
}

function PersonCell({ document }: { document: PayrollDocument }) {
  const format = usePayrollFormatters();

  return (
    <div className='grid gap-0.5'>
      <span className='font-medium'>{document.full_name}</span>
      {document.email ? (
        <Link
          className='truncate text-sm text-primary underline-offset-2 hover:underline'
          to={`${PageURLS.admin.userDetails(document.user_id)}?tab=payment-documents`}
        >
          {document.email}
        </Link>
      ) : null}
      <span className='text-xs text-muted-foreground'>{format.paymentType(document.payment_type)}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const format = usePayrollFormatters();

  return (
    <Badge size='small' variant={STATUS_VARIANT[status] ?? 'outlineNeutral'}>
      {format.status(status)}
    </Badge>
  );
}

function Downloads({
  document,
  onDownload,
  size,
}: {
  document: PayrollDocument;
  onDownload: PayrollRowsProps['onDownload'];
  size: 'small' | 'regular';
}) {
  const { t } = useTranslation();

  return (
    <div className='flex flex-wrap gap-2'>
      <Button
        color='primary'
        variant='outlined'
        size={size}
        type='button'
        onClick={() => onDownload(document.id, 'invoice')}
      >
        <LuDownload className='size-4' />
        {t('admin:payroll.downloads.invoice')}
      </Button>
      {document.status === 'paid' && document.has_receipt ? (
        <Button
          color='primary'
          variant='outlined'
          size={size}
          type='button'
          onClick={() => onDownload(document.id, 'receipt')}
        >
          <LuDownload className='size-4' />
          {t('admin:payroll.downloads.receipt')}
        </Button>
      ) : null}
    </div>
  );
}

export function PayrollTable({ documents, onDownload }: PayrollRowsProps) {
  const { t } = useTranslation();
  const format = usePayrollFormatters();

  return (
    <div className='hidden @3xl:block'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:payroll.table.person')}</TableHead>
            <TableHead>{t('admin:payroll.table.period')}</TableHead>
            <TableHead>{t('admin:payroll.table.amount')}</TableHead>
            <TableHead>{t('admin:payroll.table.paidAmount')}</TableHead>
            <TableHead>{t('admin:payroll.table.paidAt')}</TableHead>
            <TableHead>{t('admin:payroll.table.status')}</TableHead>
            <TableHead>{t('admin:payroll.table.documents')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documents.map(document => (
            <TableRow key={document.id}>
              <TableCell>
                <PersonCell document={document} />
              </TableCell>
              <TableCell>
                <div className='grid gap-0.5'>
                  <span>{format.period(document.period_year, document.period_month)}</span>
                  <span className='text-xs text-muted-foreground'>
                    {t('admin:payroll.issuedOn', {
                      date: format.day(document.issued_at),
                    })}
                  </span>
                </div>
              </TableCell>
              <TableCell>{formatPrice(document.total_amount, 'COP')}</TableCell>
              <TableCell>{document.paid_amount === null ? '—' : formatPrice(document.paid_amount, 'COP')}</TableCell>
              <TableCell>{document.paid_at ? format.day(document.paid_at) : '—'}</TableCell>
              <TableCell>
                <StatusBadge status={document.status} />
              </TableCell>
              <TableCell>
                <Downloads document={document} onDownload={onDownload} size='small' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PayrollCards({ documents, onDownload }: PayrollRowsProps) {
  const { t } = useTranslation();
  const format = usePayrollFormatters();

  return (
    <div className='grid gap-3 @3xl:hidden'>
      {documents.map(document => (
        <Card key={document.id} className='gap-3 p-4'>
          <div className='flex items-start justify-between gap-3'>
            <PersonCell document={document} />
            <StatusBadge status={document.status} />
          </div>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <div className='grid gap-0.5'>
              <span className='text-muted-foreground'>{t('admin:payroll.table.period')}</span>
              <span>{format.period(document.period_year, document.period_month)}</span>
              <span className='text-xs text-muted-foreground'>
                {t('admin:payroll.issuedOn', {
                  date: format.day(document.issued_at),
                })}
              </span>
            </div>
            <div className='grid gap-0.5'>
              <span className='text-muted-foreground'>{t('admin:payroll.table.amount')}</span>
              <span>{formatPrice(document.total_amount, 'COP')}</span>
            </div>
            <div className='grid gap-0.5'>
              <span className='text-muted-foreground'>{t('admin:payroll.table.paidAmount')}</span>
              <span>{document.paid_amount === null ? '—' : formatPrice(document.paid_amount, 'COP')}</span>
            </div>
            <div className='grid gap-0.5'>
              <span className='text-muted-foreground'>{t('admin:payroll.table.paidAt')}</span>
              <span>{document.paid_at ? format.day(document.paid_at) : '—'}</span>
            </div>
          </div>
          <Downloads document={document} onDownload={onDownload} size='regular' />
        </Card>
      ))}
    </div>
  );
}
