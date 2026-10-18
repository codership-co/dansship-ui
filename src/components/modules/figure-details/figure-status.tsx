import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuActivity } from 'react-icons/lu';

interface FigureStatusProps {
  onTrackProgress: () => void;
}

export function FigureStatus({ onTrackProgress }: FigureStatusProps) {
  const { t } = useTranslation();

  return (
    <Button color='primary' variant='solid' onClick={onTrackProgress} className='w-full sm:w-auto'>
      <LuActivity className='w-5 h-5' />
      {t('figure:progress.trackProgress')}
    </Button>
  );
}
