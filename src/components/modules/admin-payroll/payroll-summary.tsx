import { useTranslation } from 'react-i18next';

import { Card } from '@components/ui';
import { formatPrice } from '@helpers';

import type { PayrollSummary as PayrollSummaryData } from '@core/api';

const CARD = 'border-border bg-background-paper';

function Tile({
  label,
  value,
  detail,
  className,
}: {
  label: string;
  value: string;
  detail?: string;
  className?: string;
}) {
  return (
    <Card className={`gap-1 ${CARD} p-4 ${className ?? ''}`}>
      <span className='text-sm text-muted-foreground'>{label}</span>
      <span className='text-xl font-semibold text-primary'>{value}</span>
      {detail ? <span className='text-sm text-muted-foreground'>{detail}</span> : null}
    </Card>
  );
}

export function PayrollSummary({ summary }: { summary: PayrollSummaryData | undefined }) {
  const { t } = useTranslation();

  return (
    <div className='grid grid-cols-2 gap-3 @3xl:grid-cols-3'>
      <Tile
        label={t('admin:payroll.summary.paid')}
        value={formatPrice(summary?.paid_amount ?? 0, 'COP')}
        detail={t('admin:payroll.summary.paidDocuments', {
          count: summary?.paid_count ?? 0,
        })}
      />
      <Tile
        label={t('admin:payroll.summary.pending')}
        value={formatPrice(summary?.pending_amount ?? 0, 'COP')}
        detail={t('admin:payroll.summary.pendingDocuments', {
          count: summary?.pending_count ?? 0,
        })}
      />
      <Tile
        className='hidden @3xl:flex'
        label={t('admin:payroll.summary.count')}
        value={String(summary?.total_count ?? 0)}
        detail={t('admin:payroll.summary.countDetail')}
      />
    </div>
  );
}
