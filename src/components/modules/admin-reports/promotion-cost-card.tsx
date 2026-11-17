import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { formatMoney } from '@components/modules/admin-reports/report-date-range';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { DansshipAPI, type PromotionCostReport } from '@core/api';

interface PromotionCostCardProps {
  report: PromotionCostReport;
  startDate: string;
  endDate: string;
}

/** Cost of a discount campaign: counts and amounts only, built from the snapshot on each payment. */
export function PromotionCostCard({ report, startDate, endDate }: PromotionCostCardProps) {
  const { t } = useTranslation();
  const [isExporting, setIsExporting] = useState(false);
  const { totals, rows, refunded_gifts: refunded, without_discount: withoutDiscount } = report;

  const handleExport = async () => {
    setIsExporting(true);

    try {
      await DansshipAPI.reportsAdmin.exportPromotionCostCsv(startDate, endDate);
    } catch {
      toast.error(t('reports:promotionCost.exportFailed'));
    } finally {
      setIsExporting(false);
    }
  };

  const kpis = [
    {
      label: t('reports:promotionCost.kpis.purchases'),
      value: String(totals.purchases),
      danger: false,
    },
    {
      label: t('reports:promotionCost.kpis.collected'),
      value: formatMoney(totals.collected),
      danger: false,
    },
    {
      label: t('reports:promotionCost.kpis.givenUp'),
      value: formatMoney(totals.given_up),
      danger: true,
    },
    {
      label: t('reports:promotionCost.kpis.refundedGifts'),
      value: t('reports:promotionCost.refundedValue', {
        count: refunded.gift_count,
        amount: formatMoney(refunded.amount),
      }),
      danger: false,
    },
  ];

  return (
    <Card className='border-input shadow-sm'>
      <CardHeader className='flex flex-row flex-wrap items-center justify-between gap-3 border-b border-gray-100 bg-gray-50/50 pb-4'>
        <CardTitle className='text-lg text-gray-800'>{t('reports:promotionCost.title')}</CardTitle>
        <Button
          type='button'
          color='primary'
          variant='outlined'
          isLoading={isExporting}
          onClick={() => void handleExport()}
        >
          {t('reports:promotionCost.export')}
        </Button>
      </CardHeader>
      <CardContent className='space-y-6 p-4'>
        <div className='grid grid-cols-2 gap-5 md:grid-cols-4'>
          {kpis.map(kpi => (
            <div key={kpi.label} className='grid gap-1'>
              <small className='text-gray-500'>{kpi.label}</small>
              <span className={kpi.danger ? 'text-2xl font-bold text-destructive' : 'text-2xl font-bold'}>
                {kpi.value}
              </span>
            </div>
          ))}
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('reports:promotionCost.table.plan')}</TableHead>
              <TableHead className='text-right'>{t('reports:promotionCost.table.purchases')}</TableHead>
              <TableHead className='text-right'>{t('reports:promotionCost.table.normalPrice')}</TableHead>
              <TableHead className='text-right'>{t('reports:promotionCost.table.collected')}</TableHead>
              <TableHead className='text-right'>{t('reports:promotionCost.table.givenUp')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(row => (
              <TableRow key={`${row.promotion_code}-${row.plan_id}`}>
                <TableCell>{row.plan_name}</TableCell>
                <TableCell className='text-right'>{row.purchases}</TableCell>
                <TableCell className='text-right'>{formatMoney(row.unit_normal_price)}</TableCell>
                <TableCell className='text-right'>{formatMoney(row.collected)}</TableCell>
                <TableCell className='text-right text-destructive'>-{formatMoney(row.given_up)}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell className='font-bold'>{t('reports:promotionCost.table.total')}</TableCell>
              <TableCell className='text-right font-bold'>{totals.purchases}</TableCell>
              <TableCell />
              <TableCell className='text-right font-bold'>{formatMoney(totals.collected)}</TableCell>
              <TableCell className='text-right font-bold text-destructive'>-{formatMoney(totals.given_up)}</TableCell>
            </TableRow>
            {withoutDiscount.purchase_count > 0 ? (
              <TableRow>
                <TableCell className='text-gray-500'>{t('reports:promotionCost.table.withoutDiscount')}</TableCell>
                <TableCell className='text-right'>{withoutDiscount.purchase_count}</TableCell>
                <TableCell />
                <TableCell className='text-right text-gray-500'>{t('reports:promotionCost.table.normal')}</TableCell>
                <TableCell className='text-right text-gray-500'>—</TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
        <p className='m-0 text-xs text-gray-500'>{t('reports:promotionCost.note')}</p>
      </CardContent>
    </Card>
  );
}
