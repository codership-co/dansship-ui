import { useTranslation } from 'react-i18next';

import { type EntryCounters } from '@core/api';

/** Entered / expected for guests, minors and artists. */
export function DoorCounters({ counters }: { counters: EntryCounters | null }) {
  const { t } = useTranslation();
  const groups = ['guests', 'minors', 'artists'] as const;

  return (
    <dl className='m-0 grid grid-cols-3 gap-2'>
      {groups.map(group => (
        <div key={group} className='grid gap-0.5 rounded-xl border border-border bg-white px-2 py-2 text-center'>
          <dt className='text-[11px] font-semibold tracking-[0.06em] text-muted-foreground uppercase'>
            {t(`eventos:door.counters.${group}`)}
          </dt>
          <dd className='m-0 font-title text-lg font-bold'>
            {counters ? `${counters[group].entered} / ${counters[group].expected}` : '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}
