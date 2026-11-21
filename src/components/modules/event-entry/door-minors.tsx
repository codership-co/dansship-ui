import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { type EntryMinor } from '@core/api';

interface DoorMinorsProps {
  minors: Array<EntryMinor>;
  disabled?: boolean;
  busyId?: string | null;
  onEnter: (minor: EntryMinor) => void;
}

/** "+ N menor": each minor is marked through the adult. */
export function DoorMinors({ minors, disabled = false, busyId = null, onEnter }: DoorMinorsProps) {
  const { t } = useTranslation();

  if (minors.length === 0) {
    return null;
  }

  return (
    <div className='grid gap-2'>
      <p className='m-0 text-sm font-semibold'>{t('eventos:door.minorsCount', { count: minors.length })}</p>
      {minors.map(minor =>
        minor.entered_at ? (
          <p key={minor.person_id} className='m-0 text-sm text-muted-foreground'>
            {t('eventos:door.minorEntered', {
              name: minor.full_name,
              time: format(new Date(minor.entered_at), 'HH:mm'),
            })}
          </p>
        ) : (
          <Button
            key={minor.person_id}
            type='button'
            variant='outlined'
            color='primary'
            size='small'
            disabled={disabled}
            isLoading={busyId === minor.person_id}
            onClick={() => onEnter(minor)}
          >
            {t('eventos:door.enterMinor', { name: minor.full_name })}
          </Button>
        ),
      )}
    </div>
  );
}
