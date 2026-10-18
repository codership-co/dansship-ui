import { Button } from 'polpo/components';
import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { Input, Label } from '@components/ui';
import { DansshipAPI, type EventAdmin, type EventInvite, type EventSession, type RecurrencePreview } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

interface EventSessionsPanelProps {
  event: EventAdmin;
  rooms: Array<{ id: string; name: string }>;
}

export function EventSessionsPanel({ event, rooms }: EventSessionsPanelProps) {
  const { t } = useTranslation();
  const { response, reFetch } = usePromise(() => DansshipAPI.eventosAdmin.listSessions(event.id), true, [event.id]);
  const { response: invitesResponse, reFetch: reFetchInvites } = usePromise(
    () => DansshipAPI.eventosAdmin.listInvites(event.id),
    true,
    [event.id],
  );
  const [visibility, setVisibility] = useState(event.visibility ?? 'public');
  const [token, setToken] = useState(event.access_token ?? '');
  const [starts, setStarts] = useState('');
  const [ends, setEnds] = useState('');
  const [label, setLabel] = useState('');
  const [roomId, setRoomId] = useState(event.room_id ?? rooms[0]?.id ?? '');
  const [externalLocation, setExternalLocation] = useState('');
  const [weekday, setWeekday] = useState('5');
  const [startTime, setStartTime] = useState('17:00');
  const [endTime, setEndTime] = useState('19:00');
  const [firstDate, setFirstDate] = useState('');
  const [lastDate, setLastDate] = useState('');
  const [preview, setPreview] = useState<RecurrencePreview | null>(null);
  const [inviteQuery, setInviteQuery] = useState('');
  const [matches, setMatches] = useState<Array<{ id: string; email: string; full_name: string }>>([]);
  const sessions = response?.data ?? event.sessions ?? [];
  const invites = invitesResponse?.data ?? [];

  const placePayload = () =>
    event.type === 'recital' && externalLocation.trim()
      ? { external_location: externalLocation.trim(), room_id: null }
      : { room_id: roomId || null, external_location: null };

  const addSession = async (formEvent: FormEvent) => {
    formEvent.preventDefault();
    const { ok } = await DansshipAPI.eventosAdmin.addSession(event.id, {
      starts_at: new Date(starts).toISOString(),
      ends_at: new Date(ends).toISOString(),
      label: label.trim() || null,
      ...placePayload(),
    });

    if (!ok) {
      toast.error(t('eventos:admin.sessionSaveFailed'));

      return;
    }

    setStarts('');
    setEnds('');
    setLabel('');
    await reFetch();
  };

  const recurrencePayload = () => ({
    weekday: Number(weekday),
    start_time: startTime.length === 5 ? `${startTime}:00` : startTime,
    end_time: endTime.length === 5 ? `${endTime}:00` : endTime,
    first_date: firstDate,
    last_date: lastDate,
    label: label.trim() || null,
    ...placePayload(),
  });

  const previewSeries = async () => {
    const { data, ok } = await DansshipAPI.eventosAdmin.previewRecurrence(event.id, recurrencePayload());

    if (!ok || !data) {
      toast.error(t('eventos:admin.sessionSaveFailed'));

      return;
    }

    setPreview(data);
  };

  const applySeries = async () => {
    const { ok } = await DansshipAPI.eventosAdmin.applyRecurrence(event.id, recurrencePayload());

    if (!ok) {
      toast.error(t('eventos:admin.sessionSeriesConflict'));

      return;
    }

    setPreview(null);
    await reFetch();
  };

  const saveVisibility = async (next: 'public' | 'link_only' | 'invite_only') => {
    const { data, ok } = await DansshipAPI.eventosAdmin.setVisibility(event.id, next);

    if (!ok || !data) {
      toast.error(t('eventos:admin.sessionSaveFailed'));

      return;
    }

    setVisibility(data.visibility ?? next);
    setToken(data.access_token ?? '');
  };

  const rotate = async () => {
    const { data, ok } = await DansshipAPI.eventosAdmin.rotateAccessToken(event.id);

    if (!ok || !data) {
      toast.error(t('eventos:admin.sessionSaveFailed'));

      return;
    }

    setToken(data.access_token ?? '');
  };

  const searchInvites = async () => {
    const { data } = await DansshipAPI.usersAdmin.search({ search: inviteQuery.trim(), limit: 8 });

    setMatches(data?.items ?? []);
  };

  const inviteUser = async (userId: string) => {
    const { ok } = await DansshipAPI.eventosAdmin.invite(event.id, userId);

    if (!ok) {
      toast.error(t('eventos:admin.sessionSaveFailed'));

      return;
    }

    setMatches([]);
    setInviteQuery('');
    await reFetchInvites();
  };

  return (
    <section className='grid gap-4 rounded-2xl border p-4'>
      <h2 className='m-0 text-lg font-semibold'>{t('eventos:admin.sessionsTitle')}</h2>
      <ul className='grid gap-2'>
        {sessions.map(session => (
          <SessionRow key={session.id} eventId={event.id} session={session} onChanged={() => void reFetch()} />
        ))}
      </ul>
      <form className='grid gap-3 md:grid-cols-2' onSubmit={addSession}>
        <Label className='grid gap-1'>
          {t('eventos:admin.sessionStarts')}
          <Input required type='datetime-local' value={starts} onChange={event => setStarts(event.target.value)} />
        </Label>
        <Label className='grid gap-1'>
          {t('eventos:admin.sessionEnds')}
          <Input required type='datetime-local' value={ends} onChange={event => setEnds(event.target.value)} />
        </Label>
        <Label className='grid gap-1'>
          {t('eventos:admin.sessionLabel')}
          <Input value={label} onChange={event => setLabel(event.target.value)} />
        </Label>
        {event.type === 'recital' ? (
          <Label className='grid gap-1'>
            {t('eventos:admin.externalLocation')}
            <Input value={externalLocation} onChange={event => setExternalLocation(event.target.value)} />
          </Label>
        ) : null}
        <Label className='grid gap-1'>
          {t('eventos:admin.room')}
          <select
            className='h-10 rounded-md border px-3'
            value={roomId}
            onChange={event => setRoomId(event.target.value)}
          >
            <option value=''>{t('eventos:admin.noRoom')}</option>
            {rooms.map(room => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </Label>
        <div className='md:col-span-2'>
          <Button color='primary' variant='solid' type='submit'>
            {t('eventos:admin.addSession')}
          </Button>
        </div>
      </form>
      <div className='grid gap-3 md:grid-cols-3'>
        <Label className='grid gap-1'>
          {t('eventos:admin.weekday')}
          <select
            className='h-10 rounded-md border px-3'
            value={weekday}
            onChange={event => setWeekday(event.target.value)}
          >
            {WEEKDAY_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Label>
        <Label className='grid gap-1'>
          {t('eventos:admin.sessionStartClock')}
          <Input type='time' value={startTime} onChange={event => setStartTime(event.target.value)} />
        </Label>
        <Label className='grid gap-1'>
          {t('eventos:admin.sessionEndClock')}
          <Input type='time' value={endTime} onChange={event => setEndTime(event.target.value)} />
        </Label>
        <Label className='grid gap-1'>
          {t('eventos:admin.firstDate')}
          <Input required type='date' value={firstDate} onChange={event => setFirstDate(event.target.value)} />
        </Label>
        <Label className='grid gap-1'>
          {t('eventos:admin.lastDate')}
          <Input required type='date' value={lastDate} onChange={event => setLastDate(event.target.value)} />
        </Label>
        <div className='flex items-end gap-2'>
          <Button color='primary' variant='outlined' type='button' onClick={() => void previewSeries()}>
            {t('eventos:admin.previewSeries')}
          </Button>
          <Button color='primary' variant='solid' type='button' onClick={() => void applySeries()}>
            {t('eventos:admin.applySeries')}
          </Button>
        </div>
      </div>
      {preview ? (
        <div className='grid gap-1 text-sm'>
          <p className='m-0'>
            {t('eventos:admin.seriesPreview', {
              count: preview.occurrences.filter(item => !item.skipped).length,
            })}
          </p>
          {preview.conflicts.map(conflict => (
            <p key={`${conflict.occurrence_date}-${conflict.source_id}`} className='m-0 text-destructive'>
              {conflict.occurrence_date}: {conflict.label}
            </p>
          ))}
        </div>
      ) : null}
      <Label className='grid gap-1'>
        {t('eventos:admin.visibility')}
        <select
          className='h-10 rounded-md border px-3'
          value={visibility}
          onChange={event => void saveVisibility(event.target.value as 'public' | 'link_only' | 'invite_only')}
        >
          <option value='public'>{t('eventos:admin.visibilityPublic')}</option>
          <option value='link_only'>{t('eventos:admin.visibilityLink')}</option>
          <option value='invite_only'>{t('eventos:admin.visibilityInvite')}</option>
        </select>
      </Label>
      {visibility === 'link_only' && token ? (
        <div className='flex flex-wrap items-center gap-2'>
          <Input readOnly value={`${window.location.origin}${PageURLS.eventoAccess(token)}`} />
          <Button color='primary' variant='outlined' type='button' onClick={() => void rotate()}>
            {t('eventos:admin.rotateLink')}
          </Button>
        </div>
      ) : null}
      <div className='grid gap-2'>
        <Label className='grid gap-1'>
          {t('eventos:admin.inviteSearch')}
          <Input value={inviteQuery} onChange={event => setInviteQuery(event.target.value)} />
        </Label>
        <Button color='primary' variant='outlined' type='button' onClick={() => void searchInvites()}>
          {t('eventos:admin.searchPeople')}
        </Button>
        {matches.map(person => (
          <button
            key={person.id}
            type='button'
            className='text-left text-sm'
            onClick={() => void inviteUser(person.id)}
          >
            {person.full_name} · {person.email}
          </button>
        ))}
        <ul className='grid gap-1 text-sm'>
          {invites.map((invite: EventInvite) => (
            <li key={invite.id} className='flex items-center justify-between gap-2'>
              <span>
                {invite.display_name} · {invite.email}
              </span>
              <Button
                color='primary'
                variant='outlined'
                type='button'
                onClick={() =>
                  void DansshipAPI.eventosAdmin.uninvite(event.id, invite.user_id).then(() => reFetchInvites())
                }
              >
                {t('eventos:admin.removeInvite')}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function SessionRow({
  eventId,
  session,
  onChanged,
}: {
  eventId: string;
  session: EventSession;
  onChanged: () => void;
}) {
  const { t } = useTranslation();

  return (
    <li className='flex flex-wrap items-center justify-between gap-2 text-sm'>
      <span className={session.status === 'cancelled' ? 'line-through' : undefined}>
        {new Date(session.starts_at).toLocaleString('es-CO')}
        {session.label ? ` · ${session.label}` : ''}
        {session.is_main ? ` · ${t('eventos:admin.mainSession')}` : ''}
      </span>
      {!session.is_main && session.status === 'active' ? (
        <Button
          color='primary'
          variant='outlined'
          type='button'
          onClick={() => void DansshipAPI.eventosAdmin.cancelSession(eventId, session.id).then(() => onChanged())}
        >
          {t('eventos:admin.cancelSession')}
        </Button>
      ) : null}
    </li>
  );
}

const WEEKDAY_OPTIONS = [
  { value: '0', label: 'Lunes' },
  { value: '1', label: 'Martes' },
  { value: '2', label: 'Miércoles' },
  { value: '3', label: 'Jueves' },
  { value: '4', label: 'Viernes' },
  { value: '5', label: 'Sábado' },
  { value: '6', label: 'Domingo' },
];
