import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

interface PayrollPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function PayrollPagination({ page, pageSize, total, onPageChange }: PayrollPaginationProps) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= pageSize) return null;

  return (
    <nav className='flex items-center justify-between gap-3' aria-label='pagination'>
      <Button
        color='primary'
        variant='outlined'
        size='small'
        type='button'
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t('admin:payroll.pagination.previous')}
      </Button>
      <span className='text-sm text-muted-foreground'>{t('admin:payroll.pagination.page', { page, pages })}</span>
      <Button
        color='primary'
        variant='outlined'
        size='small'
        type='button'
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('admin:payroll.pagination.next')}
      </Button>
    </nav>
  );
}
