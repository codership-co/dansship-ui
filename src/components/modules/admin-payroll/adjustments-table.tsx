import type { ComponentProps } from 'react';

import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuDownload } from 'react-icons/lu';
import { Link } from 'react-router';

import { formatMonthLabel } from './adjustment-months';

import { Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { PageURLS } from '@core/constants';
import { formatPrice } from '@helpers';
import { useDateLocale } from '@hooks';

import type { PayrollAdjustment } from '@core/api';

interface AdjustmentRowsProps {
  items: Array<PayrollAdjustment>;
  onEdit: (item: PayrollAdjustment) => void;
  onDelete: (item: PayrollAdjustment) => void;
  onOpenDocument: (documentId: string) => void;
}

const TYPE_VARIANT: Record<string, NonNullable<ComponentProps<typeof Badge>['variant']>> = {
  extra: 'secondary',
  advance: 'outlineTertiary',
};
const STATUS_VARIANT: Record<string, NonNullable<ComponentProps<typeof Badge>['variant']>> = {
  pending: 'outlineWarning',
  applied: 'outlineActive',
};
const DASH = '—';

function useAdjustmentFormatters() {
  const locale = useDateLocale();

  return {
    month: (year: number | null, month: number | null) =>
      year && month ? formatMonthLabel(year, month, locale) : DASH,
    day: (value: string | null) => (value ? format(parseISO(value), 'd MMM yyyy', { locale }) : DASH),
  };
}

function PersonCell({ item }: { item: PayrollAdjustment }) {
  return (
    <div className='grid gap-0.5'>
      <span className='font-medium'>{item.full_name}</span>
      {item.email ? (
        <Link
          className='truncate text-sm underline underline-offset-2 hover:text-primary'
          to={PageURLS.admin.userDetails(item.user_id)}
        >
          {item.email}
        </Link>
      ) : null}
    </div>
  );
}

function TypeBadge({ type }: { type: string }) {
  const { t } = useTranslation();

  return (
    <Badge size='small' variant={TYPE_VARIANT[type] ?? 'outlineNeutral'}>
      {t(`admin:payroll.adjustments.types.${type}`)}
    </Badge>
  );
}

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();

  return (
    <Badge size='small' variant={STATUS_VARIANT[status] ?? 'outlineNeutral'}>
      {t(`admin:payroll.adjustments.status.${status}`)}
    </Badge>
  );
}

function ConceptCell({ item }: { item: PayrollAdjustment }) {
  const { t } = useTranslation();

  return (
    <div className='grid gap-0.5'>
      <span>{(item.type === 'extra' ? item.concept : item.note) || DASH}</span>
      {item.event_name ? (
        <span className='text-xs text-muted-foreground'>
          {t('admin:payroll.adjustments.event', { name: item.event_name })}
        </span>
      ) : null}
    </div>
  );
}

function MonthCell({ item }: { item: PayrollAdjustment }) {
  const { t } = useTranslation();
  const format = useAdjustmentFormatters();

  if (item.type !== 'extra') return <>{DASH}</>;

  return (
    <div className='grid gap-0.5'>
      <span>{format.month(item.period_year, item.period_month)}</span>
      {item.passes_to_year && item.passes_to_month ? (
        <span className='text-xs text-muted-foreground'>
          {t('admin:payroll.adjustments.passesTo', { month: format.month(item.passes_to_year, item.passes_to_month) })}
        </span>
      ) : null}
    </div>
  );
}

function DiscountedCell({ item }: { item: PayrollAdjustment }) {
  const { t } = useTranslation();

  if (item.type !== 'advance') return <>{DASH}</>;

  return (
    <div className='grid gap-0.5'>
      <span>{t('admin:payroll.adjustments.discountedLine', { amount: formatPrice(item.discounted, 'COP') })}</span>
      <span className='text-xs text-muted-foreground'>
        {t('admin:payroll.adjustments.balanceLine', { amount: formatPrice(item.balance, 'COP') })}
      </span>
    </div>
  );
}

function DocumentButton({
  item,
  onOpenDocument,
  size,
}: {
  item: PayrollAdjustment;
  onOpenDocument: AdjustmentRowsProps['onOpenDocument'];
  size: 'small' | 'regular';
}) {
  const { t } = useTranslation();

  if (!item.document_id) return <>{DASH}</>;

  const documentId = item.document_id;

  return (
    <Button color='primary' variant='outlined' size={size} type='button' onClick={() => onOpenDocument(documentId)}>
      <LuDownload className='size-4' />
      {t('admin:payroll.adjustments.document')}
    </Button>
  );
}

function Actions({
  item,
  onEdit,
  onDelete,
  size,
}: {
  item: PayrollAdjustment;
  onEdit: AdjustmentRowsProps['onEdit'];
  onDelete: AdjustmentRowsProps['onDelete'];
  size: 'small' | 'regular';
}) {
  const { t } = useTranslation();

  if (!item.can_edit || item.status !== 'pending') return <>{DASH}</>;

  return (
    <div className='flex flex-wrap gap-2'>
      <Button color='primary' variant='outlined' size={size} type='button' onClick={() => onEdit(item)}>
        {t('admin:payroll.adjustments.actionEdit')}
      </Button>
      <Button color='alert' variant='text' size={size} type='button' onClick={() => onDelete(item)}>
        {t('admin:payroll.adjustments.actionDelete')}
      </Button>
    </div>
  );
}

export function AdjustmentsTable({ items, onEdit, onDelete, onOpenDocument }: AdjustmentRowsProps) {
  const { t } = useTranslation();
  const format = useAdjustmentFormatters();

  return (
    <div className='hidden overflow-hidden rounded-xl border border-border bg-background-paper @3xl:block'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:payroll.adjustments.table.person')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.type')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.concept')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.month')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.amount')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.paymentDate')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.discounted')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.status')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.document')}</TableHead>
            <TableHead>{t('admin:payroll.adjustments.table.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <PersonCell item={item} />
              </TableCell>
              <TableCell>
                <TypeBadge type={item.type} />
              </TableCell>
              <TableCell>
                <ConceptCell item={item} />
              </TableCell>
              <TableCell>
                <MonthCell item={item} />
              </TableCell>
              <TableCell>{formatPrice(item.amount, 'COP')}</TableCell>
              <TableCell>{format.day(item.payment_date)}</TableCell>
              <TableCell>
                <DiscountedCell item={item} />
              </TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <DocumentButton item={item} onOpenDocument={onOpenDocument} size='small' />
              </TableCell>
              <TableCell>
                <Actions item={item} onEdit={onEdit} onDelete={onDelete} size='small' />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function CardRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className='grid gap-0.5'>
      <span className='text-muted-foreground'>{label}</span>
      <div>{children}</div>
    </div>
  );
}

export function AdjustmentsCards({ items, onEdit, onDelete, onOpenDocument }: AdjustmentRowsProps) {
  const { t } = useTranslation();
  const format = useAdjustmentFormatters();

  return (
    <div className='grid gap-3 @3xl:hidden'>
      {items.map(item => (
        <Card key={item.id} className='gap-3 border-border bg-background-paper p-4'>
          <div className='flex items-start justify-between gap-3'>
            <PersonCell item={item} />
            <StatusBadge status={item.status} />
          </div>
          <div className='grid grid-cols-2 gap-2 text-sm'>
            <CardRow label={t('admin:payroll.adjustments.table.type')}>
              <TypeBadge type={item.type} />
            </CardRow>
            <CardRow label={t('admin:payroll.adjustments.table.amount')}>{formatPrice(item.amount, 'COP')}</CardRow>
            <div className='col-span-2'>
              <CardRow label={t('admin:payroll.adjustments.table.concept')}>
                <ConceptCell item={item} />
              </CardRow>
            </div>
            {item.type === 'extra' ? (
              <CardRow label={t('admin:payroll.adjustments.table.month')}>
                <MonthCell item={item} />
              </CardRow>
            ) : (
              <>
                <CardRow label={t('admin:payroll.adjustments.table.paymentDate')}>
                  {format.day(item.payment_date)}
                </CardRow>
                <CardRow label={t('admin:payroll.adjustments.table.discounted')}>
                  <DiscountedCell item={item} />
                </CardRow>
              </>
            )}
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <DocumentButton item={item} onOpenDocument={onOpenDocument} size='regular' />
            <Actions item={item} onEdit={onEdit} onDelete={onDelete} size='regular' />
          </div>
        </Card>
      ))}
    </div>
  );
}
