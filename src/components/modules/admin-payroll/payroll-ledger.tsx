import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { formatMonthLabel } from './adjustment-months';
import { PayrollBreakdownDialog } from './payroll-breakdown-dialog';
import { PayrollFilters, getDefaultPayrollFilters, type PayrollFilterValues } from './payroll-filters';
import { PayrollPagination } from './payroll-pagination';
import { PayrollSummary } from './payroll-summary';
import { PayrollCards, PayrollTable, type PayrollDownloadKind } from './payroll-table';

import { SectionEmpty } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { DansshipAPI, type PayrollDocument, type PayrollQuery } from '@core/api';
import { useCallablePromise, useDateLocale, usePromise } from '@hooks';

const PAGE_SIZE = 20;

function toQuery(filters: PayrollFilterValues): PayrollQuery {
  return {
    q: filters.q.trim() || undefined,
    status: filters.status === 'all' ? undefined : filters.status,
    date_field: filters.dateField,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };
}

export function PayrollLedger() {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<PayrollFilterValues>(() => getDefaultPayrollFilters());
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);
  const [breakdown, setBreakdown] = useState<PayrollDocument | null>(null);
  const locale = useDateLocale();
  const query = useMemo(() => toQuery(filters), [filters]);
  const queryKey = JSON.stringify(query);

  const { response: listResponse, isLoading } = usePromise(
    () => DansshipAPI.instructorPaymentsAdmin.listPayrollDocuments(query, page, PAGE_SIZE),
    true,
    [queryKey, page],
  );
  const { response: summaryResponse } = usePromise(
    () => DansshipAPI.instructorPaymentsAdmin.getPayrollSummary(query),
    true,
    [queryKey],
  );
  const { call: getDocumentUrl } = useCallablePromise((documentId: string) =>
    DansshipAPI.instructorPaymentsAdmin.getPayrollDocumentViewUrl(documentId),
  );
  const { call: getReceiptUrl } = useCallablePromise((documentId: string) =>
    DansshipAPI.instructorPaymentsAdmin.getPayrollReceiptViewUrl(documentId),
  );

  const data = listResponse?.data;
  const documents = data?.items ?? [];
  const total = data?.total ?? 0;

  const handleFiltersChange = useCallback((next: PayrollFilterValues) => {
    setFilters(next);
    setPage(1);
  }, []);

  const handleDownload = async (documentId: string, kind: PayrollDownloadKind) => {
    const { ok, data: view } = kind === 'invoice' ? await getDocumentUrl(documentId) : await getReceiptUrl(documentId);
    const url = ok ? view?.view_url : undefined;

    if (!url) {
      toast.error(t('admin:payroll.downloads.openFailed'));

      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExport = async () => {
    setIsExporting(true);

    try {
      await DansshipAPI.instructorPaymentsAdmin.exportPayrollCsv(query);
      toast.success(t('admin:payroll.export.success'));
    } catch {
      toast.error(t('admin:payroll.export.failed'));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className='@container grid gap-4'>
      <PayrollFilters
        values={filters}
        onChange={handleFiltersChange}
        onExport={handleExport}
        canExport={total > 0}
        isExporting={isExporting}
      />
      <PayrollSummary summary={summaryResponse?.data ?? undefined} />

      {isLoading && !data ? (
        <SpinnerLoader />
      ) : documents.length === 0 ? (
        <SectionEmpty message={t('admin:payroll.empty')} />
      ) : (
        <>
          <PayrollTable documents={documents} onDownload={handleDownload} onShowBreakdown={setBreakdown} />
          <PayrollCards documents={documents} onDownload={handleDownload} onShowBreakdown={setBreakdown} />
          <PayrollPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
      <PayrollBreakdownDialog
        document={breakdown}
        period={breakdown ? formatMonthLabel(breakdown.period_year, breakdown.period_month, locale) : ''}
        onClose={() => setBreakdown(null)}
      />
    </div>
  );
}
