import { Button } from 'polpo/components';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { AdjustmentDialog } from './adjustment-dialog';
import { AdjustmentsFilters, getDefaultAdjustmentFilters, type AdjustmentFilterValues } from './adjustments-filters';
import { AdjustmentsSummary } from './adjustments-summary';
import { AdjustmentsCards, AdjustmentsTable } from './adjustments-table';
import { PayrollPagination } from './payroll-pagination';

import { SectionEmpty } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import {
  DansshipAPI,
  type PayrollAdjustment,
  type PayrollAdjustmentQuery,
  type PayrollAdjustmentType,
} from '@core/api';
import { formatPrice } from '@helpers';
import { usePromise } from '@hooks';

const PAGE_SIZE = 20;

function toQuery(filters: AdjustmentFilterValues): PayrollAdjustmentQuery {
  return {
    q: filters.q.trim() || undefined,
    type: filters.type === 'all' ? undefined : filters.type,
    status: filters.status === 'all' ? undefined : filters.status,
    month: filters.month === 'all' ? undefined : filters.month,
  };
}

interface DialogState {
  kind: PayrollAdjustmentType;
  editing: PayrollAdjustment | null;
}

export function PayrollAdjustmentsPanel({ onOpenAssignments }: { onOpenAssignments: () => void }) {
  const { t } = useTranslation();
  const [filters, setFilters] = useState<AdjustmentFilterValues>(() => getDefaultAdjustmentFilters());
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogState | null>(null);
  const [toDelete, setToDelete] = useState<PayrollAdjustment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const query = useMemo(() => toQuery(filters), [filters]);
  const queryKey = JSON.stringify(query);

  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.instructorPaymentsAdmin.listPayrollAdjustments(query, page, PAGE_SIZE),
    true,
    [queryKey, page],
  );

  const failed = response !== null && response !== undefined && !response.ok;
  const data = response?.ok ? response.data : undefined;
  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const isFiltered = JSON.stringify(query) !== JSON.stringify(toQuery(getDefaultAdjustmentFilters()));

  const handleFiltersChange = useCallback((next: AdjustmentFilterValues) => {
    setFilters(next);
    setPage(1);
  }, []);

  const handleOpenDocument = async (documentId: string) => {
    const result = await DansshipAPI.instructorPaymentsAdmin.getAdjustmentDocumentViewUrl(documentId);
    const url = result.ok ? result.data?.view_url : undefined;

    if (!url) {
      toast.error(t('admin:payroll.adjustments.openFailed'));

      return;
    }

    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSaved = () => {
    setDialog(null);
    void reFetch();
  };

  const handleDelete = async () => {
    if (!toDelete) return;

    setIsDeleting(true);

    try {
      const api = DansshipAPI.instructorPaymentsAdmin;
      const result = await (toDelete.type === 'extra' ? api.deleteExtra(toDelete.id) : api.deleteAdvance(toDelete.id));

      if (!result.ok) {
        toast.error(t('admin:payroll.adjustments.delete.failed'));

        return;
      }

      toast.success(t('admin:payroll.adjustments.delete.success'));
      setToDelete(null);
      void reFetch();
    } finally {
      setIsDeleting(false);
    }
  };

  const openAssignments = () => {
    setDialog(null);
    onOpenAssignments();
  };

  return (
    <div className='@container grid gap-4'>
      <div className='flex flex-col gap-3 @3xl:flex-row @3xl:items-center @3xl:justify-between'>
        <p className='m-0 text-sm text-muted-foreground'>{t('admin:payroll.adjustmentsSubtitle')}</p>
        <div className='flex flex-col gap-2 @3xl:flex-row'>
          <Button
            color='primary'
            variant='solid'
            type='button'
            className='order-first w-full @3xl:order-last @3xl:w-auto'
            onClick={() => setDialog({ kind: 'extra', editing: null })}
          >
            {t('admin:payroll.adjustments.newExtra')}
          </Button>
          <Button
            color='primary'
            variant='outlined'
            type='button'
            className='w-full @3xl:w-auto'
            onClick={() => setDialog({ kind: 'advance', editing: null })}
          >
            {t('admin:payroll.adjustments.newAdvance')}
          </Button>
        </div>
      </div>

      <AdjustmentsFilters values={filters} onChange={handleFiltersChange} />
      <AdjustmentsSummary summary={data?.summary} />

      {failed ? (
        <div role='alert' className='grid justify-items-center gap-3 py-6 text-center'>
          <p className='m-0 text-sm text-muted-foreground'>{t('admin:payroll.adjustments.loadFailed')}</p>
          <Button color='primary' variant='outlined' type='button' onClick={() => void reFetch()}>
            {t('admin:payroll.adjustments.retry')}
          </Button>
        </div>
      ) : isLoading && !data ? (
        <SpinnerLoader />
      ) : items.length === 0 ? (
        <SectionEmpty
          message={isFiltered ? t('admin:payroll.adjustments.empty') : t('admin:payroll.adjustments.emptyFirst')}
        />
      ) : (
        <>
          <AdjustmentsTable
            items={items}
            onEdit={item => setDialog({ kind: item.type, editing: item })}
            onDelete={setToDelete}
            onOpenDocument={documentId => void handleOpenDocument(documentId)}
          />
          <AdjustmentsCards
            items={items}
            onEdit={item => setDialog({ kind: item.type, editing: item })}
            onDelete={setToDelete}
            onOpenDocument={documentId => void handleOpenDocument(documentId)}
          />
          <PayrollPagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}

      {dialog ? (
        <AdjustmentDialog
          kind={dialog.kind}
          editing={dialog.editing}
          onClose={() => setDialog(null)}
          onSaved={handleSaved}
          onOpenAssignments={openAssignments}
        />
      ) : null}

      <ConfirmDialog
        open={toDelete !== null}
        onOpenChange={open => (open ? undefined : setToDelete(null))}
        onConfirm={handleDelete}
        title={t(`admin:payroll.adjustments.delete.${toDelete?.type ?? 'extra'}Title`)}
        description={
          toDelete
            ? t(`admin:payroll.adjustments.delete.${toDelete.type}Message`, {
                name: toDelete.full_name,
                amount: formatPrice(toDelete.amount, 'COP'),
              })
            : undefined
        }
        confirmLabel={t('admin:payroll.adjustments.delete.confirm')}
        cancelLabel={t('admin:payroll.adjustments.dialog.cancel')}
        confirmVariant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
}
