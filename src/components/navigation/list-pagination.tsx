import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

interface ListPaginationProps {
  /** 1-based page. */
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

/** Previous / next for a paginated list; hidden when everything fits in one page. */
export function ListPagination({ page, pageSize, total, onPageChange }: ListPaginationProps) {
  const { t } = useTranslation();
  const pages = Math.max(1, Math.ceil(total / pageSize));

  if (total <= pageSize) return null;

  return (
    <nav className='flex items-center justify-between gap-3' aria-label={t('common:pagination.label')}>
      <Button
        color='primary'
        variant='outlined'
        size='small'
        type='button'
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {t('common:pagination.previous')}
      </Button>
      <span className='text-sm text-muted-foreground'>{t('common:pagination.page', { page, pages })}</span>
      <Button
        color='primary'
        variant='outlined'
        size='small'
        type='button'
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        {t('common:pagination.next')}
      </Button>
    </nav>
  );
}
