import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PersonGate } from './person-gate';

import { InstallmentPaymentDialog } from '@components/modules/admin-eventos/installment-payment-dialog';
import { Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { DansshipAPI, type PersonSearchResult } from '@core/api';
import { usePromise } from '@hooks';

function EventForm({ person }: { person: PersonSearchResult }) {
  const { t } = useTranslation('assisted');
  const { response } = usePromise(() => DansshipAPI.eventosAdmin.list());
  const [eventId, setEventId] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const events = (response?.data ?? []).filter(event => event.kind === 'event');

  return (
    <div className='grid max-w-xl gap-4'>
      <p className='text-sm text-muted-foreground'>{t('event.help')}</p>
      <div className='grid gap-2'>
        <Label htmlFor='assisted-event'>{t('event.choose')}</Label>
        <Select value={eventId} onValueChange={setEventId}>
          <SelectTrigger id='assisted-event'>
            <SelectValue placeholder={t('event.placeholder')} />
          </SelectTrigger>
          <SelectContent>
            {events.map(event => (
              <SelectItem key={event.id} value={event.id}>
                {event.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {registered ? <p className='text-sm text-active'>{t('event.registered')}</p> : null}
      <div>
        <Button color='primary' variant='solid' disabled={!eventId} onClick={() => setIsOpen(true)}>
          {t('event.approveAndEnroll')}
        </Button>
      </div>
      {eventId ? (
        <InstallmentPaymentDialog
          eventId={eventId}
          open={isOpen}
          onOpenChange={setIsOpen}
          onRegistered={() => setRegistered(true)}
          presetUser={{
            id: person.id,
            email: person.email ?? person.full_name,
          }}
        />
      ) : null}
    </div>
  );
}

export function EventTab() {
  return <PersonGate>{person => <EventForm key={person.id} person={person} />}</PersonGate>;
}
