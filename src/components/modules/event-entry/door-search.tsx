import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { DoorMinors } from './door-minors';

import { Input } from '@components/ui';
import { entryReasonKey, type DoorSearchRow, type EntryMinor } from '@core/api';

interface DoorSearchProps {
  rows: Array<DoorSearchRow>;
  isLoading: boolean;
  disabled?: boolean;
  busyId?: string | null;
  onQuery: (query: string) => void;
  onEnter: (row: DoorSearchRow) => void;
  onEnterMinor: (minor: EntryMinor) => void;
  onDonation: (row: DoorSearchRow) => void;
}

/** "Buscar": by name or email, "Marcar ingreso", minors and "Donación recibida". */
export function DoorSearch({
  rows,
  isLoading,
  disabled = false,
  busyId = null,
  onQuery,
  onEnter,
  onEnterMinor,
  onDonation,
}: DoorSearchProps) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handle = window.setTimeout(() => onQuery(search.trim()), 300);

    return () => window.clearTimeout(handle);
  }, [search, onQuery]);

  return (
    <div className='grid gap-3'>
      <Input
        type='search'
        value={search}
        autoComplete='off'
        placeholder={t('eventos:door.searchPlaceholder')}
        aria-label={t('eventos:door.searchPlaceholder')}
        onChange={change => setSearch(change.target.value)}
      />
      {search.trim().length < 2 ? (
        <p className='m-0 text-sm text-muted-foreground'>{t('eventos:door.searchHint')}</p>
      ) : !isLoading && rows.length === 0 ? (
        <p className='m-0 text-sm text-muted-foreground'>{t('eventos:door.searchEmpty')}</p>
      ) : null}
      <ul className='m-0 grid list-none gap-2 p-0'>
        {rows.map(row => (
          <li key={row.person_id} className='grid gap-2 rounded-2xl border border-border bg-white p-3'>
            <div className='grid gap-0.5'>
              <p className='m-0 font-semibold break-words'>{row.full_name}</p>
              <p className='m-0 text-xs break-all text-muted-foreground'>
                {[row.type_name, row.email].filter(Boolean).join(' · ')}
              </p>
            </div>
            {row.entered_at ? (
              <p className='m-0 text-sm font-semibold text-active-700'>
                {t('eventos:door.enteredAt', {
                  time: format(new Date(row.entered_at), 'HH:mm'),
                  name: row.validated_by_name ?? '',
                })}
              </p>
            ) : row.can_enter ? (
              <Button
                type='button'
                color='primary'
                variant='solid'
                size='small'
                disabled={disabled}
                isLoading={busyId === row.person_id}
                onClick={() => onEnter(row)}
              >
                {t('eventos:door.markEntry')}
              </Button>
            ) : (
              <div className='grid gap-1'>
                <p className='m-0 text-sm font-semibold text-warning-800'>{t(entryReasonKey(row.reason))}</p>
                <Button type='button' color='primary' variant='solid' size='small' disabled>
                  {t('eventos:door.markEntry')}
                </Button>
              </div>
            )}
            {row.can_enter ? (
              <DoorMinors minors={row.minors} disabled={disabled} busyId={busyId} onEnter={onEnterMinor} />
            ) : null}
            {row.donation ? (
              <div className='flex flex-wrap items-center justify-between gap-2 rounded-xl bg-secondary/40 px-3 py-2'>
                <p className='m-0 text-xs'>{t('eventos:door.donation', { labels: row.donation.labels.join(', ') })}</p>
                <Button
                  type='button'
                  size='small'
                  color='primary'
                  variant={row.donation.received_at ? 'outlined' : 'solid'}
                  disabled={disabled || Boolean(row.donation.received_at)}
                  isLoading={busyId === row.donation.signup_id}
                  onClick={() => onDonation(row)}
                >
                  {row.donation.received_at ? t('eventos:door.donationReceived') : t('eventos:door.markDonation')}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
