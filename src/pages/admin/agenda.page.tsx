import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { GridEvent, ScheduleGrid } from '@components/modules';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { AgendaEventType, buildAgendaConflicts, DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { usePromise } from '@hooks';

function formatDateInput(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function toIsoBoundary(dateValue: string, endOfDay: boolean): string {
  const date = new Date(`${dateValue}T00:00:00`);

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date.toISOString();
}

function eventKey(sourceId: string, startTime: string): string {
  return `${sourceId}-${startTime}`;
}

function AdminAgendaPage() {
  const { t } = useTranslation();
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [startDate, setStartDate] = useState(formatDateInput(today));
  const [endDate, setEndDate] = useState(formatDateInput(nextWeek));
  const [roomId, setRoomId] = useState('all');
  const [eventTypeFilter, setEventTypeFilter] = useState<'all' | AgendaEventType>('all');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  const startAt = useMemo(() => toIsoBoundary(startDate, false), [startDate]);
  const endAt = useMemo(() => toIsoBoundary(endDate, true), [endDate]);

  const {
    response: eventsData,
    isLoading: isLoadingEvents,
    reFetch: getAgendaEvents,
  } = usePromise(() =>
    DansshipAPI.schedulesAdmin.getAgendaEvents({
      start_at: startAt,
      end_at: endAt,
      room_id: roomId === 'all' ? undefined : roomId,
    }),
  );

  const { response: rooms } = usePromise(() => DansshipAPI.studioRental.getRooms());

  const events = useMemo(() => eventsData?.data ?? [], [eventsData?.data]);
  const conflicts = useMemo(() => buildAgendaConflicts(events), [events]);

  const roomNameById = useMemo(() => {
    const dictionary: Record<string, string> = {};
    (rooms?.data ?? []).forEach(room => {
      dictionary[room.id] = room.name;
    });

    return dictionary;
  }, [rooms?.data]);

  const filteredEvents = useMemo(
    () =>
      events
        .filter(event => eventTypeFilter === 'all' || event.event_type === eventTypeFilter)
        .sort((left, right) => new Date(left.start_time).getTime() - new Date(right.start_time).getTime()),
    [events, eventTypeFilter],
  );

  useEffect(() => {
    if (filteredEvents.length === 0) {
      setSelectedEventId(null);

      return;
    }

    if (!selectedEventId) {
      setSelectedEventId(eventKey(filteredEvents[0].source_id, filteredEvents[0].start_time));

      return;
    }

    const found = filteredEvents.some(event => eventKey(event.source_id, event.start_time) === selectedEventId);

    if (!found) {
      setSelectedEventId(eventKey(filteredEvents[0].source_id, filteredEvents[0].start_time));
    }
  }, [filteredEvents, selectedEventId]);

  const selectedEvent =
    filteredEvents.find(event => eventKey(event.source_id, event.start_time) === selectedEventId) ?? null;

  const typeOptions: Array<{ value: 'all' | AgendaEventType; label: string }> = [
    { value: 'all', label: t('admin:agenda.filters.all', { defaultValue: 'All' }) },
    {
      value: 'studio_class',
      label: t('admin:agenda.filters.studioClass', { defaultValue: 'Studio Class' }),
    },
    {
      value: 'space_rental_external',
      label: t('admin:agenda.filters.externalRental', { defaultValue: 'External Rental' }),
    },
    {
      value: 'internal_reserved_use',
      label: t('admin:agenda.filters.internalReservedUse', { defaultValue: 'Internal Reserved Use' }),
    },
    {
      value: 'blocked_space',
      label: t('admin:agenda.filters.blockedSpace', { defaultValue: 'Blocked Space' }),
    },
  ];

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 space-y-4 pt-20'>
      <header className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-5'>
        <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
          <div>
            <h1 className='text-primary'>{t('admin:agenda.title', { defaultValue: 'Unified Agenda' })}</h1>
            <p className='mt-1 text-sm text-muted-foreground'>
              {t('admin:agenda.subtitle', {
                defaultValue: 'Track classes, rentals, reserved use, and blocked-space occupancy in one timeline.',
              })}
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            <Button asChild size='sm' variant='outline'>
              <Link to='/admin/studio-rental?tab=reserved-use'>
                {t('admin:agenda.actions.addReservedUse', { defaultValue: 'Add Internal Reserved Use' })}
              </Link>
            </Button>
            <Button asChild size='sm' variant='outline'>
              <Link to='/admin/agenda/conflicts'>
                {t('admin:agenda.actions.openConflictQueue', { defaultValue: 'Open Conflict Queue' })}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {conflicts.length > 0 ? (
        <div className='flex flex-col gap-2 rounded-(--radius) bg-[hsl(var(--error-container))] px-4 py-3 text-sm md:flex-row md:items-center md:justify-between'>
          <span className='text-destructive'>
            {t('admin:agenda.conflictBanner', {
              count: conflicts.length,
              defaultValue: `${conflicts.length} occupancy conflict(s) detected for this range.`,
            })}
          </span>
          <Button asChild size='sm' variant='outline'>
            <Link to='/admin/agenda/conflicts'>
              {t('admin:agenda.conflictBannerAction', { defaultValue: 'Review conflicts' })}
            </Link>
          </Button>
        </div>
      ) : null}

      <section className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
        <div className='grid gap-3 lg:grid-cols-4'>
          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin:agenda.filters.startDate', { defaultValue: 'Start Date' })}
            </label>
            <Input type='date' value={startDate} onChange={event => setStartDate(event.target.value)} />
          </div>

          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin:agenda.filters.endDate', { defaultValue: 'End Date' })}
            </label>
            <Input type='date' value={endDate} onChange={event => setEndDate(event.target.value)} />
          </div>

          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin:agenda.filters.room', { defaultValue: 'Room' })}
            </label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('admin:agenda.filters.allRooms', { defaultValue: 'All rooms' })}</SelectItem>
                {(rooms?.data ?? []).map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin:agenda.filters.eventType', { defaultValue: 'Usage Type' })}
            </label>
            <div className='mt-1 flex flex-wrap gap-1.5'>
              {typeOptions.map(option => (
                <Button
                  key={option.value}
                  size='sm'
                  variant={eventTypeFilter === option.value ? 'default' : 'outline'}
                  onClick={() => setEventTypeFilter(option.value)}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <section className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
          <h2 className='text-primary'>{t('admin:agenda.timeline.title', { defaultValue: 'Timeline' })}</h2>
          <p className='mt-1 text-sm text-muted-foreground'>
            {t('admin:agenda.timeline.subtitle', {
              defaultValue: 'Select an event to inspect details and source metadata.',
            })}
          </p>

          <div className='mt-4 space-y-2'>
            {isLoadingEvents ? (
              <SpinnerLoader
                message={t('admin:agenda.timeline.loading', {
                  defaultValue: 'Loading agenda events...',
                })}
              />
            ) : !eventsData?.ok ? (
              <div className='rounded-(--radius) bg-[hsl(var(--error-container))] px-3 py-2 text-sm text-destructive'>
                <p>
                  {t('admin:agenda.timeline.error', {
                    defaultValue: 'Unable to load agenda events for this range.',
                  })}
                </p>
                <Button className='mt-2' size='sm' variant='outline' onClick={() => void getAgendaEvents()}>
                  {t('admin:agenda.timeline.retry', { defaultValue: 'Retry' })}
                </Button>
              </div>
            ) : filteredEvents.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {t('admin:agenda.timeline.empty', {
                  defaultValue: 'No events found with the current filters.',
                })}
              </p>
            ) : (
              <div className='overflow-x-auto'>
                <ScheduleGrid
                  weekDate={startDate}
                  events={filteredEvents as Array<GridEvent>}
                  onClassClick={event => {
                    if ('source_id' in event) {
                      setSelectedEventId(eventKey(event.source_id, event.start_time));
                    }
                  }}
                  scheduleStatus='published'
                />
              </div>
            )}
          </div>
        </section>

        <aside className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
          <h2 className='text-primary'>{t('admin:agenda.inspector.title', { defaultValue: 'Event Inspector' })}</h2>

          {!selectedEvent ? (
            <p className='mt-3 text-sm text-muted-foreground'>
              {t('admin:agenda.inspector.empty', {
                defaultValue: 'Pick an event from the timeline to inspect details.',
              })}
            </p>
          ) : (
            <div className='mt-3 space-y-2 rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-3 text-sm'>
              <p>
                <span className='font-semibold text-primary'>
                  {t('admin:agenda.inspector.type', { defaultValue: 'Type' })}:
                </span>{' '}
                {selectedEvent.event_type}
              </p>
              <p>
                <span className='font-semibold text-primary'>
                  {t('admin:agenda.inspector.room', { defaultValue: 'Room' })}:
                </span>{' '}
                {roomNameById[selectedEvent.room_id] ?? selectedEvent.room_id}
              </p>
              <p>
                <span className='font-semibold text-primary'>
                  {t('admin:agenda.inspector.status', { defaultValue: 'Status' })}:
                </span>{' '}
                {selectedEvent.status ?? t('admin:agenda.inspector.none', { defaultValue: 'N/A' })}
              </p>
              <p>
                <span className='font-semibold text-primary'>
                  {t('admin:agenda.inspector.sourceId', { defaultValue: 'Source ID' })}:
                </span>{' '}
                {selectedEvent.source_id}
              </p>
              <p>
                <span className='font-semibold text-primary'>
                  {t('admin:agenda.inspector.time', { defaultValue: 'Time' })}:
                </span>{' '}
                {new Date(selectedEvent.start_time).toLocaleString()} -{' '}
                {new Date(selectedEvent.end_time).toLocaleString()}
              </p>

              {Object.entries(selectedEvent.metadata ?? {}).length > 0 ? (
                <div>
                  <p className='font-semibold text-primary'>
                    {t('admin:agenda.inspector.metadata', { defaultValue: 'Metadata' })}
                  </p>
                  <div className='mt-1 space-y-1 text-xs text-muted-foreground'>
                    {Object.entries(selectedEvent.metadata).map(([key, value]) => (
                      <p key={key}>
                        {key}: {value}
                      </p>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export const SecureAdminAgendaPage = SecurityGuard(AdminAgendaPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.scheduleManage,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
