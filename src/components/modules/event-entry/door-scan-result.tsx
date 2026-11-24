import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { DoorMinors } from './door-minors';

import { entryReasonKey, type EntryMinor, type EntryScanResult } from '@core/api';
import { cn } from '@helpers';

interface DoorScanResultProps {
  result: EntryScanResult;
  disabled?: boolean;
  busyId?: string | null;
  onEnterMinor: (minor: EntryMinor) => void;
  onNext: () => void;
}

const TONE = {
  valid: 'border-active-500 bg-active-50 text-active-800',
  already_used: 'border-warning-500 bg-warning-50 text-warning-900',
  invalid: 'border-alert-500 bg-alert-50 text-alert-800',
} as const;

/** VÁLIDO / YA USADO / INVÁLIDO, big enough to read at arm's length. */
export function DoorScanResult({ result, disabled = false, busyId = null, onEnterMinor, onNext }: DoorScanResultProps) {
  const { t } = useTranslation();
  const person = result.person;

  return (
    <section
      className={cn('grid gap-3 rounded-2xl border-2 p-4', TONE[result.status])}
      role='status'
      aria-live='assertive'
    >
      <p className='m-0 font-title text-3xl font-bold tracking-wide'>{t(`eventos:door.result.${result.status}`)}</p>
      {result.status === 'invalid' ? <p className='m-0 text-sm'>{t(entryReasonKey(result.reason))}</p> : null}
      {person ? (
        <div className='grid gap-1 text-foreground'>
          <p className='m-0 font-title text-xl font-bold break-words'>{person.full_name}</p>
          <p className='m-0 text-sm text-muted-foreground'>{person.type_name}</p>
          {result.status === 'already_used' && person.entered_at ? (
            <p className='m-0 text-sm'>
              {t('eventos:door.usedAt', {
                time: format(new Date(person.entered_at), 'HH:mm'),
                name: person.validated_by_name ?? '',
              })}
            </p>
          ) : null}
        </div>
      ) : null}
      {person && result.status !== 'invalid' ? (
        <DoorMinors minors={person.minors} disabled={disabled} busyId={busyId} onEnter={onEnterMinor} />
      ) : null}
      <Button type='button' color='primary' variant='solid' fullWidth onClick={onNext}>
        {t('eventos:door.next')}
      </Button>
    </section>
  );
}
