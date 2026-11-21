import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { Badge } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { useDateLocale, usePromise } from '@hooks';

/** "Validar entradas": events whose entry window is open or opens today. */
export function DoorEventList() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading } = usePromise(() => DansshipAPI.entry.listDoorEvents(), true, []);
  const events = response?.data ?? [];

  return (
    <div className='mx-auto grid w-full max-w-md gap-4'>
      <SectionHeading className='mb-0' title={t('eventos:door.title')} subtitle={t('eventos:door.subtitle')} />
      {isLoading && !response ? (
        <SpinnerLoader />
      ) : events.length === 0 ? (
        <p className='m-0 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
          {t('eventos:door.noEvents')}
        </p>
      ) : (
        <ul className='m-0 grid list-none gap-3 p-0'>
          {events.map(event => (
            <li key={event.id}>
              <Link
                to={PageURLS.admin.entryDoorEvent(event.id)}
                viewTransition
                className='grid gap-1 rounded-2xl border border-border bg-white p-4 text-foreground no-underline focus-visible:outline-2 focus-visible:outline-primary'
              >
                <div className='flex items-start justify-between gap-2'>
                  <p className='m-0 font-title text-lg font-bold'>{event.name}</p>
                  <Badge variant={event.is_open ? 'outlineActive' : 'outlineNeutral'} size='small'>
                    {event.is_open ? t('eventos:door.open') : t('eventos:door.notOpen')}
                  </Badge>
                </div>
                <p className='m-0 text-sm text-muted-foreground'>
                  {[format(new Date(event.starts_at), t('eventos:entry.dateFormat'), { locale }), event.place]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <p className='m-0 text-sm'>
                  {t('eventos:door.listCounters', {
                    guests: `${event.counters.guests.entered}/${event.counters.guests.expected}`,
                    artists: `${event.counters.artists.entered}/${event.counters.artists.expected}`,
                  })}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
