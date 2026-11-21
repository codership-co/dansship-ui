import { useTranslation } from 'react-i18next';

interface CountdownRingProps {
  fraction: number;
}

const RADIUS = 15.9155;

/** Small ring that empties until the next code. */
export function CountdownRing({ fraction }: CountdownRingProps) {
  const { t } = useTranslation();
  const dash = Math.round(Math.min(1, Math.max(0, fraction)) * 100);

  return (
    <svg viewBox='0 0 36 36' className='size-6 -rotate-90' role='img' aria-label={t('eventos:entry.refreshing')}>
      <circle cx='18' cy='18' r={RADIUS} fill='none' className='stroke-border' strokeWidth='4' />
      <circle
        cx='18'
        cy='18'
        r={RADIUS}
        fill='none'
        className='stroke-primary transition-[stroke-dasharray] duration-200'
        strokeWidth='4'
        strokeDasharray={`${dash} 100`}
        strokeLinecap='round'
      />
    </svg>
  );
}
