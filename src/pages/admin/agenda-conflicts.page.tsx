import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { buildAgendaConflicts, DansshipAPI } from '@core/api';
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

function AdminAgendaConflictsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const [startDate, setStartDate] = useState(formatDateInput(today));
  const [endDate, setEndDate] = useState(formatDateInput(nextWeek));
  const [roomId, setRoomId] = useState('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'resolved'>('open');
  const [resolvedConflictIds, setResolvedConflictIds] = useState<Array<string>>([]);
  const [selectedConflictId, setSelectedConflictId] = useState<string | null>(null);

  const {
    response: agendaEventsList,
    isLoading: isLoadingAgendaEvents,
    reFetch: getAgendaEvents,
  } = usePromise(() =>
    DansshipAPI.schedulesAdmin.getAgendaEvents({
      start_at: toIsoBoundary(startDate, false),
      end_at: toIsoBoundary(endDate, true),
      room_id: roomId === 'all' ? undefined : roomId,
    }),
  );
  const { response: rooms } = usePromise(() => DansshipAPI.studioRental.getRooms());

  const conflicts = useMemo(() => buildAgendaConflicts(agendaEventsList?.data ?? []), [agendaEventsList?.data]);

  const filteredConflicts = useMemo(
    () =>
      conflicts.filter(conflict => {
        const matchesSeverity = severityFilter === 'all' || conflict.severity === severityFilter;
        const isResolved = resolvedConflictIds.includes(conflict.id);
        const matchesStatus =
          statusFilter === 'all' ||
          (statusFilter === 'resolved' && isResolved) ||
          (statusFilter === 'open' && !isResolved);

        return matchesSeverity && matchesStatus;
      }),
    [conflicts, severityFilter, statusFilter, resolvedConflictIds],
  );

  useEffect(() => {
    if (filteredConflicts.length === 0) {
      setSelectedConflictId(null);

      return;
    }

    const stillExists = filteredConflicts.some(conflict => conflict.id === selectedConflictId);

    if (!stillExists) {
      setSelectedConflictId(filteredConflicts[0].id);
    }
  }, [filteredConflicts, selectedConflictId]);

  const selectedConflict = filteredConflicts.find(conflict => conflict.id === selectedConflictId) ?? null;

  const openConflicts = conflicts.filter(conflict => !resolvedConflictIds.includes(conflict.id));
  const highCount = openConflicts.filter(conflict => conflict.severity === 'high').length;
  const mediumCount = openConflicts.filter(conflict => conflict.severity === 'medium').length;
  const lowCount = openConflicts.filter(conflict => conflict.severity === 'low').length;

  const roomNameById = useMemo(() => {
    const dictionary: Record<string, string> = {};
    (rooms?.data ?? []).forEach(room => {
      dictionary[room.id] = room.name;
    });

    return dictionary;
  }, [rooms?.data]);

  const toggleResolved = (conflictId: string) => {
    setResolvedConflictIds(previous =>
      previous.includes(conflictId) ? previous.filter(id => id !== conflictId) : [...previous, conflictId],
    );
  };

  const openSource = () => {
    if (!selectedConflict) {
      return;
    }

    const hasStudioClass = selectedConflict.events.some(event => event.event_type === 'studio_class');

    if (hasStudioClass) {
      navigate('/admin/schedule-builder');

      return;
    }

    navigate('/admin/studio-rental');
  };

  const selectedIsResolved = selectedConflict ? resolvedConflictIds.includes(selectedConflict.id) : false;

  return (
    <div className='mx-auto max-w-7xl px-4 py-8 space-y-4 pt-20'>
      <header className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-5'>
        <h1 className='text-primary'>{t('admin.conflicts.title', { defaultValue: 'Occupancy Conflict Queue' })}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {t('admin.conflicts.subtitle', {
            defaultValue: 'Review overlapping room occupancy and resolve operational collisions.',
          })}
        </p>

        <div className='mt-4 grid gap-2 sm:grid-cols-3'>
          <div className='rounded-[var(--radius)] bg-[hsl(var(--surface-container-highest))] px-3 py-2'>
            <p className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
              {t('admin.conflicts.metrics.high', { defaultValue: 'High' })}
            </p>
            <p className='text-xl font-semibold text-foreground'>{highCount}</p>
          </div>
          <div className='rounded-[var(--radius)] bg-[hsl(var(--surface-container-highest))] px-3 py-2'>
            <p className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
              {t('admin.conflicts.metrics.medium', { defaultValue: 'Medium' })}
            </p>
            <p className='text-xl font-semibold text-foreground'>{mediumCount}</p>
          </div>
          <div className='rounded-[var(--radius)] bg-[hsl(var(--surface-container-highest))] px-3 py-2'>
            <p className='text-xs uppercase tracking-[0.06em] text-muted-foreground'>
              {t('admin.conflicts.metrics.low', { defaultValue: 'Low' })}
            </p>
            <p className='text-xl font-semibold text-foreground'>{lowCount}</p>
          </div>
        </div>
      </header>

      <section className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
        <div className='grid gap-3 lg:grid-cols-5'>
          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin.conflicts.filters.startDate', { defaultValue: 'Start Date' })}
            </label>
            <Input type='date' value={startDate} onChange={event => setStartDate(event.target.value)} />
          </div>

          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin.conflicts.filters.endDate', { defaultValue: 'End Date' })}
            </label>
            <Input type='date' value={endDate} onChange={event => setEndDate(event.target.value)} />
          </div>

          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin.conflicts.filters.room', { defaultValue: 'Room' })}
            </label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>
                  {t('admin.conflicts.filters.allRooms', { defaultValue: 'All rooms' })}
                </SelectItem>
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
              {t('admin.conflicts.filters.severity', { defaultValue: 'Severity' })}
            </label>
            <Select
              value={severityFilter}
              onValueChange={value => setSeverityFilter(value as 'all' | 'high' | 'medium' | 'low')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('admin.conflicts.filters.all', { defaultValue: 'All' })}</SelectItem>
                <SelectItem value='high'>{t('admin.conflicts.filters.high', { defaultValue: 'High' })}</SelectItem>
                <SelectItem value='medium'>
                  {t('admin.conflicts.filters.medium', { defaultValue: 'Medium' })}
                </SelectItem>
                <SelectItem value='low'>{t('admin.conflicts.filters.low', { defaultValue: 'Low' })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('admin.conflicts.filters.status', { defaultValue: 'Status' })}
            </label>
            <Select value={statusFilter} onValueChange={value => setStatusFilter(value as 'all' | 'open' | 'resolved')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>{t('admin.conflicts.filters.all', { defaultValue: 'All' })}</SelectItem>
                <SelectItem value='open'>{t('admin.conflicts.filters.open', { defaultValue: 'Open' })}</SelectItem>
                <SelectItem value='resolved'>
                  {t('admin.conflicts.filters.resolved', { defaultValue: 'Resolved' })}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <section className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
          <h2 className='text-primary'>{t('admin.conflicts.list.title', { defaultValue: 'Conflict List' })}</h2>

          <div className='mt-3 space-y-2'>
            {isLoadingAgendaEvents ? (
              <SpinnerLoader
                message={t('admin.conflicts.list.loading', {
                  defaultValue: 'Loading conflict candidates...',
                })}
              />
            ) : !agendaEventsList?.ok ? (
              <div className='rounded-[var(--radius)] bg-[hsl(var(--error-container))] px-3 py-2 text-sm text-destructive'>
                <p>
                  {t('admin.conflicts.list.error', {
                    defaultValue: 'Unable to evaluate occupancy conflicts.',
                  })}
                </p>
                <Button className='mt-2' size='sm' variant='outline' onClick={() => void getAgendaEvents()}>
                  {t('admin.conflicts.list.retry', { defaultValue: 'Retry' })}
                </Button>
              </div>
            ) : filteredConflicts.length === 0 ? (
              <p className='text-sm text-muted-foreground'>
                {t('admin.conflicts.list.empty', {
                  defaultValue: 'No conflicts match the current filters.',
                })}
              </p>
            ) : (
              filteredConflicts.map(conflict => {
                const isResolved = resolvedConflictIds.includes(conflict.id);
                const isSelected = selectedConflictId === conflict.id;

                return (
                  <button
                    key={conflict.id}
                    type='button'
                    onClick={() => setSelectedConflictId(conflict.id)}
                    className={`w-full rounded-(--radius) px-3 py-2 text-left transition ${
                      isSelected
                        ? 'bg-[hsl(var(--primary-container))] text-[hsl(var(--primary-foreground))]'
                        : 'bg-[hsl(var(--surface-container-highest))] hover:bg-[hsl(var(--surface-container))]'
                    }`}
                  >
                    <p className='text-xs uppercase tracking-[0.06em]'>
                      {conflict.severity} ·{' '}
                      {isResolved
                        ? t('admin.conflicts.status.resolved', { defaultValue: 'Resolved' })
                        : t('admin.conflicts.status.open', { defaultValue: 'Open' })}
                    </p>
                    <p className='text-sm font-semibold'>{roomNameById[conflict.roomId] ?? conflict.roomId}</p>
                    <p className='text-xs'>
                      {new Date(conflict.overlapStart).toLocaleString()} -{' '}
                      {new Date(conflict.overlapEnd).toLocaleString()}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <aside className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
          <h2 className='text-primary'>{t('admin.conflicts.detail.title', { defaultValue: 'Conflict Detail' })}</h2>

          {!selectedConflict ? (
            <p className='mt-3 text-sm text-muted-foreground'>
              {t('admin.conflicts.detail.empty', {
                defaultValue: 'Select a conflict row to inspect event overlap details.',
              })}
            </p>
          ) : (
            <div className='mt-3 space-y-3'>
              <div className='rounded-[var(--radius)] bg-[hsl(var(--surface-container-highest))] p-3 text-sm'>
                <p>
                  <span className='font-semibold text-primary'>
                    {t('admin.conflicts.detail.room', { defaultValue: 'Room' })}:
                  </span>{' '}
                  {roomNameById[selectedConflict.roomId] ?? selectedConflict.roomId}
                </p>
                <p>
                  <span className='font-semibold text-primary'>
                    {t('admin.conflicts.detail.overlap', { defaultValue: 'Overlap' })}:
                  </span>{' '}
                  {new Date(selectedConflict.overlapStart).toLocaleString()} -{' '}
                  {new Date(selectedConflict.overlapEnd).toLocaleString()}
                </p>
                <p>
                  <span className='font-semibold text-primary'>
                    {t('admin.conflicts.detail.severity', { defaultValue: 'Severity' })}:
                  </span>{' '}
                  {selectedConflict.severity}
                </p>
              </div>

              <div className='space-y-2 rounded-[var(--radius)] bg-[hsl(var(--surface-container-highest))] p-3 text-sm'>
                {selectedConflict.events.map(event => (
                  <div key={`${event.source_id}-${event.start_time}`}>
                    <p className='font-semibold text-primary'>{event.event_type}</p>
                    <p className='text-xs text-muted-foreground'>{event.source_id}</p>
                    <p className='text-xs text-muted-foreground'>
                      {new Date(event.start_time).toLocaleString()} - {new Date(event.end_time).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>

              <div className='flex flex-wrap gap-2'>
                <Button
                  size='sm'
                  variant={selectedIsResolved ? 'outline' : 'default'}
                  onClick={() => toggleResolved(selectedConflict.id)}
                >
                  {selectedIsResolved
                    ? t('admin.conflicts.actions.markOpen', { defaultValue: 'Mark Open' })
                    : t('admin.conflicts.actions.resolve', { defaultValue: 'Resolve' })}
                </Button>
                <Button size='sm' variant='outline' onClick={openSource}>
                  {t('admin.conflicts.actions.openSource', { defaultValue: 'Open Event Source' })}
                </Button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export const SecureAdminAgendaConflictsPage = SecurityGuard(AdminAgendaConflictsPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.scheduleBuilder,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
