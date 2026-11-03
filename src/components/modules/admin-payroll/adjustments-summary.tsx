import { useTranslation } from 'react-i18next';

import { Tile } from './payroll-summary';

import { formatPrice } from '@helpers';

import type { PayrollAdjustmentsSummary } from '@core/api';

export function AdjustmentsSummary({ summary }: { summary: PayrollAdjustmentsSummary | undefined }) {
  const { t } = useTranslation();

  return (
    <div className='grid grid-cols-2 gap-3'>
      <Tile
        label={t('admin:payroll.adjustments.summary.extras')}
        value={formatPrice(summary?.pending_extras_amount ?? 0, 'COP')}
        detail={t('admin:payroll.adjustments.summary.extrasCount', { count: summary?.pending_extras_count ?? 0 })}
      />
      <Tile
        label={t('admin:payroll.adjustments.summary.advances')}
        value={formatPrice(summary?.advances_balance_amount ?? 0, 'COP')}
        detail={t('admin:payroll.adjustments.summary.advancesCount', { count: summary?.advances_balance_count ?? 0 })}
      />
    </div>
  );
}
