import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { formatPrice } from '@helpers';

interface RecoverySummaryBarProps {
  total: number;
  selectedCount: number;
  onContinue: () => void;
  isBusy?: boolean;
}

/** One-line sticky bar: always reachable, takes as little room as it can. */
export function RecoverySummaryBar({ total, selectedCount, onContinue, isBusy = false }: RecoverySummaryBarProps) {
  const { t } = useTranslation();

  return (
    <aside
      aria-label={t('recovery:summary.continue')}
      // Leaves room on small screens for the floating WhatsApp bubble.
      className='sticky bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-10 flex items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-white px-4 py-2.5 shadow-md max-sm:mr-16 sm:max-w-md'
    >
      <p className='m-0 grid min-w-0 leading-tight'>
        <span className='text-xs text-muted-foreground'>{t('recovery:summary.classes', { count: selectedCount })}</span>
        <strong className='text-lg'>{formatPrice(total, 'COP')}</strong>
      </p>
      <Button
        color='primary'
        variant='solid'
        size='small'
        type='button'
        className='shrink-0'
        disabled={selectedCount === 0 || isBusy}
        onClick={onContinue}
      >
        {t('recovery:summary.continue')}
      </Button>
    </aside>
  );
}
