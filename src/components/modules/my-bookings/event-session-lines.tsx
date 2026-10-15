import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { useDateLocale } from '@hooks';

import type { RegistrationSession } from '@core/api';

export function EventSessionLines({
  sessions,
  className,
}: {
  sessions?: Array<RegistrationSession>;
  className?: string;
}) {
  const { t } = useTranslation();
  const locale = useDateLocale();

  if (!sessions?.length) {
    return null;
  }

  return (
    <ul className={className}>
      {sessions.map(session => (
        <li key={session.id} className={session.status === 'cancelled' ? 'line-through opacity-70' : undefined}>
          {t('bookings:sessionLine', {
            when: format(new Date(session.starts_at), 'EEE d MMM HH:mm', { locale }),
            place:
              session.room_name || session.external_location
                ? ` · ${session.room_name || session.external_location}`
                : '',
          })}
          {session.status === 'cancelled' ? ` · ${t('bookings:sessionCancelled')}` : ''}
        </li>
      ))}
    </ul>
  );
}
