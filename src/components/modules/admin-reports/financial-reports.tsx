import { format, subDays } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { formatMoney, ReportDateRange } from '@components/modules/admin-reports/report-date-range';
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
import { DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

const purchaseTypeLabel = (value: string, t: (key: string) => string) => {
  if (value === 'plan') return t('reports:cash.purchaseTypes.plan');

  if (value === 'merch') return t('reports:cash.purchaseTypes.merch');

  if (value === 'studio_rental') return t('reports:cash.purchaseTypes.studioRental');

  return value;
};

export function FinancialReports() {
  const { t } = useTranslation();
  const initialDateRange = {
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd'),
  };
  const [dateRange, setDateRange] = useState(initialDateRange);
  const [appliedDateRange, setAppliedDateRange] = useState(initialDateRange);
  const deps = [appliedDateRange.start, appliedDateRange.end];

  const { response: cashData, isLoading: cashLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getRevenueReport(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: taxData, isLoading: taxLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getTaxCollected(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: walletData, isLoading: walletLoading } = usePromise(() =>
    DansshipAPI.reportsAdmin.getWalletLiability(),
  );
  const { response: giftData, isLoading: giftLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getGiftValue(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: benefitData, isLoading: benefitLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getBenefitCost(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );
  const { response: pricingData, isLoading: pricingLoading } = usePromise(
    () => DansshipAPI.reportsAdmin.getRevenueIndicators(appliedDateRange.start, appliedDateRange.end),
    true,
    deps,
  );

  const cash = cashData?.data;
  const tax = taxData?.data;
  const wallet = walletData?.data;
  const gifts = giftData?.data;
  const benefits = benefitData?.data?.counts;
  const pricing = pricingData?.data;
  const isLoading = cashLoading || taxLoading || walletLoading || giftLoading || benefitLoading || pricingLoading;

  const giftRows = useMemo(() => (gifts ? [gifts.pending_claim, gifts.claimed, gifts.expired] : []), [gifts]);

  return (
    <div className='space-y-8'>
      <ReportDateRange
        dateRange={dateRange}
        appliedDateRange={appliedDateRange}
        onDateRangeChange={setDateRange}
        onApply={() => setAppliedDateRange(dateRange)}
      />

      {isLoading ? (
        <div className='flex justify-center p-12'>
          <SpinnerLoader />
        </div>
      ) : (
        <div className='grid grid-cols-1 gap-8'>
          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:cash.title')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 p-4'>
              <p className='text-sm text-gray-600'>{t('reports:cash.description')}</p>
              <div className='grid grid-cols-2 md:grid-cols-5 gap-2'>
                <Metric label={t('reports:cash.intents')} value={String(cash?.totals.intent_count ?? 0)} />
                <Metric label={t('reports:cash.cashCollected')} value={formatMoney(cash?.totals.cash_collected)} />
                <Metric label={t('reports:cash.walletApplied')} value={formatMoney(cash?.totals.wallet_applied)} />
                <Metric label={t('reports:cash.recognized')} value={formatMoney(cash?.totals.recognized_total)} />
                <Metric label={t('reports:cash.tax')} value={formatMoney(cash?.totals.tax_collected)} />
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:cash.purchaseType')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.intents')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.cashCollected')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.walletApplied')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.recognized')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cash?.by_purchase_type ?? []).length === 0 ? (
                    <EmptyRow cols={5} />
                  ) : (
                    cash?.by_purchase_type.map(row => (
                      <TableRow key={row.purchase_type}>
                        <TableCell>{purchaseTypeLabel(row.purchase_type, t)}</TableCell>
                        <TableCell className='text-right'>{row.intent_count}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.cash_collected)}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.wallet_applied)}</TableCell>
                        <TableCell className='text-right font-semibold'>{formatMoney(row.recognized_total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <h3 className='text-sm font-medium text-gray-800'>{t('reports:cash.trendTitle')}</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:attendance.week')}</TableHead>
                    <TableHead>{t('reports:cash.purchaseType')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.recognized')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(cash?.trend ?? []).length === 0 ? (
                    <EmptyRow cols={3} />
                  ) : (
                    cash?.trend.map(row => (
                      <TableRow key={`${row.week}-${row.purchase_type}`}>
                        <TableCell>{row.week}</TableCell>
                        <TableCell>{purchaseTypeLabel(row.purchase_type, t)}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.recognized_total)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:tax.title')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 p-4'>
              <Metric label={t('reports:tax.total')} value={formatMoney(tax?.total_tax_collected)} />
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:tax.type')}</TableHead>
                    <TableHead className='text-right'>{t('reports:cash.intents')}</TableHead>
                    <TableHead className='text-right'>{t('reports:tax.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tax?.by_tax_type ?? []).length === 0 ? (
                    <EmptyRow cols={3} />
                  ) : (
                    tax?.by_tax_type.map(row => (
                      <TableRow key={row.tax_type_name ?? 'none'}>
                        <TableCell>{row.tax_type_name ?? t('reports:tax.none')}</TableCell>
                        <TableCell className='text-right'>{row.intent_count}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.tax_collected)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:attendance.week')}</TableHead>
                    <TableHead className='text-right'>{t('reports:tax.total')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(tax?.trend ?? []).length === 0 ? (
                    <EmptyRow cols={2} />
                  ) : (
                    tax?.trend.map(row => (
                      <TableRow key={row.week}>
                        <TableCell>{row.week}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.tax_collected)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:wallet.title')}</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 gap-2 p-4'>
              <Metric label={t('reports:wallet.outstanding')} value={formatMoney(wallet?.outstanding_liability)} />
              <Metric label={t('reports:wallet.users')} value={String(wallet?.positive_balance_users ?? 0)} />
              <p className='col-span-2 text-sm text-gray-500'>{t('reports:wallet.asOfToday')}</p>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:gifts.title')}</CardTitle>
            </CardHeader>
            <CardContent className='p-0'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:gifts.status')}</TableHead>
                    <TableHead className='text-right'>{t('reports:gifts.count')}</TableHead>
                    <TableHead className='text-right'>{t('reports:gifts.value')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {giftRows.map(row => (
                    <TableRow key={row.status}>
                      <TableCell>{t(`reports:gifts.statuses.${row.status}`)}</TableCell>
                      <TableCell className='text-right'>{row.gift_count}</TableCell>
                      <TableCell className='text-right'>{formatMoney(row.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:benefits.title')}</CardTitle>
            </CardHeader>
            <CardContent className='grid grid-cols-2 md:grid-cols-3 gap-2 p-4'>
              <Metric label={t('reports:benefits.trials')} value={String(benefits?.trial_classes_granted ?? 0)} />
              <Metric
                label={t('reports:benefits.bonusAllowances')}
                value={String(benefits?.bonus_allowances_granted ?? 0)}
              />
              <Metric label={t('reports:benefits.bonusClasses')} value={String(benefits?.bonus_classes_granted ?? 0)} />
              <Metric
                label={t('reports:benefits.monetaryCount')}
                value={String(benefits?.monetary_benefits_applied ?? 0)}
              />
              <Metric
                label={t('reports:benefits.monetaryTotal')}
                value={formatMoney(benefits?.monetary_discount_total)}
              />
            </CardContent>
          </Card>

          <Card className='border-input shadow-sm'>
            <CardHeader className='border-b border-gray-100 bg-gray-50/50 pb-4'>
              <CardTitle className='text-lg text-gray-800'>{t('reports:pricing.title')}</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4 p-4'>
              <p className='text-sm text-gray-600'>{t('reports:pricing.description')}</p>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:revenue.plan')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.sold')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.gross')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.discounts')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.netRevenue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pricing?.by_plan ?? []).length === 0 ? (
                    <EmptyRow cols={5} />
                  ) : (
                    pricing?.by_plan.map(row => (
                      <TableRow key={row.plan_name}>
                        <TableCell className='font-medium'>{row.plan_name}</TableCell>
                        <TableCell className='text-right'>{row.subscription_count}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.gross_revenue)}</TableCell>
                        <TableCell className='text-right text-alert-500'>-{formatMoney(row.discount_impact)}</TableCell>
                        <TableCell className='text-right font-bold'>{formatMoney(row.net_revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('reports:attendance.week')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.sold')}</TableHead>
                    <TableHead className='text-right'>{t('reports:revenue.netRevenue')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(pricing?.trend ?? []).length === 0 ? (
                    <EmptyRow cols={3} />
                  ) : (
                    pricing?.trend.map(row => (
                      <TableRow key={row.week}>
                        <TableCell>{row.week}</TableCell>
                        <TableCell className='text-right'>{row.subscription_count}</TableCell>
                        <TableCell className='text-right'>{formatMoney(row.net_revenue)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2'>
      <p className='text-xs text-gray-500'>{label}</p>
      <p className='text-sm font-semibold text-gray-900'>{value}</p>
    </div>
  );
}

function EmptyRow({ cols }: { cols: number }) {
  const { t } = useTranslation();

  return (
    <TableRow>
      <TableCell colSpan={cols} className='py-4 text-center text-gray-500'>
        {t('common:noData')}
      </TableCell>
    </TableRow>
  );
}
