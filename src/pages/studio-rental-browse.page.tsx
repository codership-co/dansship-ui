import { addDays, format, getDay, parseISO, startOfWeek } from 'date-fns';
import { Checkbox as PolpoCheckbox } from 'polpo/components';
import { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { GridEvent, HourRangeSelection, ScheduleGrid } from '@components/modules';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import {
  AgendaEvent,
  CreateRentalRequestPayload,
  CreateRentalSeriesPayload,
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  DayOfWeek,
  GetCalendarParams,
  PaymentPreviewMappedResponse,
  PaymentPreviewRequest,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise, usePromise } from '@hooks';

const DAY_OF_WEEK_VALUES: Array<DayOfWeek> = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const SERIES_DAY_OPTIONS: Array<DayOfWeek> = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const WHOLE_ROOM = '__whole_room__';
const BOGOTA_OFFSET = '-05:00';

function resolveStudioRentalMutationError(error: unknown, t: (key: string) => string, fallbackKey: string): string {
  const apiError =
    error instanceof DansshipAPIError
      ? error
      : error && typeof error === 'object' && 'body' in error && (error as DansshipAPIError).body
        ? (error as DansshipAPIError)
        : null;

  if (apiError?.body) {
    const code = String(apiError.body.error_code ?? '');
    const message = String(apiError.body.message ?? '');

    if (
      code === DANSSHIP_ERROR_CODE.STUDIO_RENTAL_LEAD_TIME_REQUIRED ||
      message.toLowerCase().includes('at least 24 hours')
    ) {
      return t('studioRental:toast.leadTimeRequired');
    }

    if (code === DANSSHIP_ERROR_CODE.STUDIO_RENTAL_SLOT_CONFLICT || code === 'AGENDA_ROOM_OCCUPANCY_CONFLICT') {
      return t('studioRental:toast.slotConflict');
    }

    if (message.toLowerCase().includes('has not been configured')) {
      return t('studioRental:toast.priceNotConfigured');
    }
  }

  return t(fallbackKey);
}

function formatDateInput(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function toBogotaBoundary(dateValue: string, endOfDay: boolean): string {
  return endOfDay ? `${dateValue}T23:59:59.999${BOGOTA_OFFSET}` : `${dateValue}T00:00:00.000${BOGOTA_OFFSET}`;
}

function padHour(hour: number): string {
  return String(hour).padStart(2, '0');
}

function selectionToIso(selection: HourRangeSelection): { start_time: string; end_time: string } {
  return {
    start_time: `${selection.date}T${padHour(selection.startHour)}:00:00${BOGOTA_OFFSET}`,
    end_time: `${selection.date}T${padHour(selection.endHour)}:00:00${BOGOTA_OFFSET}`,
  };
}

function hoursBetween(startIso: string, endIso: string): number {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();

  return Math.max(ms / (1000 * 60 * 60), 0);
}

function StudioRentalBrowsePage() {
  const { t } = useTranslation();
  const today = new Date();
  const weekStartDefault = startOfWeek(today, { weekStartsOn: 1 });

  const [roomId, setRoomId] = useState('');
  const [resourceMode, setResourceMode] = useState<string>(WHOLE_ROOM);
  const [weekStart, setWeekStart] = useState(formatDateInput(weekStartDefault));
  const [rangeSelection, setRangeSelection] = useState<HourRangeSelection | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [requestMode, setRequestMode] = useState<'one_off' | 'series'>('one_off');
  const [seriesDayOfWeek, setSeriesDayOfWeek] = useState<DayOfWeek>('monday');
  const [seriesStartTime, setSeriesStartTime] = useState('09:00');
  const [seriesEndTime, setSeriesEndTime] = useState('10:00');
  const [seriesStartDate, setSeriesStartDate] = useState(formatDateInput(today));
  const [seriesTermination, setSeriesTermination] = useState<'end_date' | 'count'>('end_date');
  const [seriesEndDate, setSeriesEndDate] = useState(formatDateInput(addDays(today, 28)));
  const [occurrenceCount, setOccurrenceCount] = useState('4');
  const [preview, setPreview] = useState<PaymentPreviewMappedResponse | null>(null);

  const {
    response: rooms,
    isLoading: isLoadingRooms,
    error: roomsError,
  } = usePromise(() => DansshipAPI.studioRental.getRooms());

  const weekEnd = useMemo(() => formatDateInput(addDays(parseISO(weekStart), 6)), [weekStart]);
  const startAt = useMemo(() => toBogotaBoundary(weekStart, false), [weekStart]);
  const endAt = useMemo(() => toBogotaBoundary(weekEnd, true), [weekEnd]);

  const {
    call: getCalendar,
    response: calendar,
    isLoading: isLoadingCalendar,
    error: calendarError,
  } = useCallablePromise((room: string, payload: GetCalendarParams) =>
    DansshipAPI.studioRental.getRoomCalendar(room, payload),
  );

  const { call: createRental, isLoading: isLoadingCreateRental } = useCallablePromise(
    (payload: CreateRentalRequestPayload) => DansshipAPI.studioRental.createRequest(payload),
  );

  const { call: createSeries, isLoading: isLoadingCreateSeries } = useCallablePromise(
    (payload: CreateRentalSeriesPayload) => DansshipAPI.studioRental.createSeries(payload),
  );

  const { call: previewPayment, isLoading: isLoadingPreview } = useCallablePromise((payload: PaymentPreviewRequest) =>
    DansshipAPI.payments.previewPayment(payload),
  );

  const selectedRoom = useMemo(
    () => (rooms?.data ?? []).find(room => room.id === roomId) ?? null,
    [rooms?.data, roomId],
  );

  const activeResources = useMemo(
    () => (selectedRoom?.resources ?? []).filter(resource => resource.is_active),
    [selectedRoom],
  );

  const roomPricingConfigured = Boolean(
    selectedRoom?.hourly_rental_price && Number(selectedRoom.hourly_rental_price) > 0 && selectedRoom.tax_type_id,
  );

  const resourceId = resourceMode === WHOLE_ROOM ? null : resourceMode;

  const selectionPricingConfigured = resourceId
    ? Boolean(activeResources.find(item => item.id === resourceId)?.hourly_rental_price)
    : roomPricingConfigured;

  useEffect(() => {
    if (!roomId) {
      return;
    }

    void getCalendar(roomId, { start_at: startAt, end_at: endAt });
    setRangeSelection(null);
  }, [endAt, getCalendar, roomId, startAt]);

  useEffect(() => {
    setResourceMode(WHOLE_ROOM);
  }, [roomId]);

  useEffect(() => {
    if (!selectedRoom) {
      return;
    }

    if (!roomPricingConfigured && activeResources.length > 0 && resourceMode === WHOLE_ROOM) {
      setResourceMode(activeResources[0].id);
    }
  }, [activeResources, resourceMode, roomPricingConfigured, selectedRoom]);

  const calendarEvents = useMemo((): Array<AgendaEvent> => {
    return (calendar?.data ?? [])
      .filter(block => block.kind === 'occupied')
      .map(block => ({
        event_type: 'blocked_space',
        source_id: `${block.start_time}-${block.end_time}`,
        room_id: roomId,
        start_time: block.start_time,
        end_time: block.end_time,
        status: block.kind,
        metadata: {
          kind: 'occupied',
          title: t('studioRental:browse.blockOccupied'),
        },
      }));
  }, [calendar?.data, roomId, t]);

  const selectedRangeIso = useMemo(() => {
    if (!rangeSelection) {
      return null;
    }

    return selectionToIso(rangeSelection);
  }, [rangeSelection]);

  useEffect(() => {
    if (!rangeSelection) {
      return;
    }

    setSeriesStartTime(`${padHour(rangeSelection.startHour)}:00`);
    setSeriesEndTime(`${padHour(rangeSelection.endHour)}:00`);
    setSeriesStartDate(rangeSelection.date);
    setSeriesDayOfWeek(DAY_OF_WEEK_VALUES[getDay(parseISO(rangeSelection.date))]);
  }, [rangeSelection]);

  useEffect(() => {
    const runPreview = async () => {
      if (!selectionPricingConfigured) {
        setPreview(null);

        return;
      }

      if (!roomId || !selectedRangeIso || requestMode !== 'one_off') {
        if (requestMode === 'series' && roomId && seriesStartTime && seriesEndTime) {
          const duration = hoursBetween(
            `${seriesStartDate}T${seriesStartTime}:00${BOGOTA_OFFSET}`,
            `${seriesStartDate}T${seriesEndTime}:00${BOGOTA_OFFSET}`,
          );
          const count =
            seriesTermination === 'count'
              ? Number(occurrenceCount) || 0
              : Math.max(
                  1,
                  Math.ceil(
                    (new Date(seriesEndDate).getTime() - new Date(seriesStartDate).getTime()) /
                      (7 * 24 * 60 * 60 * 1000),
                  ) + 1,
                );

          if (duration <= 0 || count <= 0) {
            setPreview(null);

            return;
          }

          const { data, ok } = await previewPayment({
            purchase_type: 'studio_rental',
            room_id: roomId,
            resource_id: resourceId,
            duration_hours: duration * count,
          });

          setPreview(ok && data ? data : null);

          return;
        }

        setPreview(null);

        return;
      }

      const { data, ok } = await previewPayment({
        purchase_type: 'studio_rental',
        room_id: roomId,
        resource_id: resourceId,
        start_time: selectedRangeIso.start_time,
        end_time: selectedRangeIso.end_time,
      });

      setPreview(ok && data ? data : null);
    };

    void runPreview();
  }, [
    occurrenceCount,
    previewPayment,
    requestMode,
    resourceId,
    roomId,
    selectedRangeIso,
    selectionPricingConfigured,
    seriesEndDate,
    seriesEndTime,
    seriesStartDate,
    seriesStartTime,
    seriesTermination,
  ]);

  const hourlyRateLabel = useMemo(() => {
    if (!selectedRoom || !selectionPricingConfigured) {
      return null;
    }

    if (resourceId) {
      const resource = activeResources.find(item => item.id === resourceId);

      return resource?.hourly_rental_price ?? null;
    }

    return selectedRoom.hourly_rental_price ?? null;
  }, [activeResources, resourceId, selectedRoom, selectionPricingConfigured]);

  const submitOneOff = async () => {
    if (!selectedRangeIso || !roomId || !termsAccepted || !selectionPricingConfigured) {
      return;
    }

    const { error } = await createRental({
      type: 'studio_rental',
      purpose: 'self_practice',
      terms_accepted: true,
      slots: [
        {
          room_id: roomId,
          resource_id: resourceId,
          start_time: selectedRangeIso.start_time,
          end_time: selectedRangeIso.end_time,
        },
      ],
    });

    if (error) {
      toast.error(resolveStudioRentalMutationError(error, t, 'studioRental:toast.requestFailed'));

      return;
    }

    toast.success(t('studioRental:toast.requestCreated'));
    setRangeSelection(null);
    setTermsAccepted(false);
    void getCalendar(roomId, { start_at: startAt, end_at: endAt });
  };

  const submitSeries = async () => {
    if (!roomId || !termsAccepted || !selectionPricingConfigured) {
      return;
    }

    const payload: CreateRentalSeriesPayload = {
      room_id: roomId,
      resource_id: resourceId,
      day_of_week: seriesDayOfWeek,
      start_time: `${seriesStartTime}:00`,
      end_time: `${seriesEndTime}:00`,
      series_start_date: seriesStartDate,
      terms_accepted: true,
      ...(seriesTermination === 'end_date'
        ? { series_end_date: seriesEndDate, occurrence_count: null }
        : { occurrence_count: Number(occurrenceCount), series_end_date: null }),
    };

    const { error } = await createSeries(payload);

    if (error) {
      toast.error(resolveStudioRentalMutationError(error, t, 'studioRental:toast.seriesFailed'));

      return;
    }

    toast.success(t('studioRental:toast.seriesCreated'));
    setTermsAccepted(false);
    void getCalendar(roomId, { start_at: startAt, end_at: endAt });
  };

  const shiftWeek = (delta: number) => {
    setWeekStart(formatDateInput(addDays(parseISO(weekStart), delta * 7)));
  };

  return (
    <div className='mx-auto max-w-7xl space-y-4 px-4 py-8 pt-20'>
      <header className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-5'>
        <h1 className='text-primary'>{t('studioRental:browse.title')}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('studioRental:browse.subtitle')}</p>
      </header>

      <section className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
        <div className='grid gap-3 lg:grid-cols-4'>
          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('studioRental:browse.room')}
            </label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue placeholder={t('studioRental:browse.roomPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {(rooms?.data ?? []).map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                    {room.room_type ? ` (${room.room_type})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isLoadingRooms ? (
              <p className='mt-2 text-xs text-muted-foreground'>{t('studioRental:browse.roomsLoading')}</p>
            ) : null}
            {rooms?.error || roomsError ? (
              <p className='mt-2 text-xs text-alert'>{t('studioRental:browse.roomsLoadError')}</p>
            ) : null}
          </div>

          {activeResources.length > 0 || roomPricingConfigured ? (
            <div>
              <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
                {t('studioRental:browse.resource')}
              </label>
              <Select value={resourceMode} onValueChange={setResourceMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roomPricingConfigured ? (
                    <SelectItem value={WHOLE_ROOM}>{t('studioRental:browse.wholeRoom')}</SelectItem>
                  ) : null}
                  {activeResources.map(resource => (
                    <SelectItem key={resource.id} value={resource.id}>
                      {resource.label?.trim()
                        ? `${t(`studioRental:resourceTypes.${resource.resource_type}`)} · ${resource.label}`
                        : t('studioRental:browse.resourceFallback', {
                            type: t(`studioRental:resourceTypes.${resource.resource_type}`),
                            position: resource.position,
                          })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}

          <div>
            <label className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
              {t('studioRental:browse.weekStart')}
            </label>
            <Input type='date' value={weekStart} onChange={event => setWeekStart(event.target.value)} />
          </div>

          <div className='flex items-end gap-2'>
            <Button type='button' variant='outline' size='sm' onClick={() => shiftWeek(-1)}>
              {t('studioRental:browse.prevWeek')}
            </Button>
            <Button type='button' variant='outline' size='sm' onClick={() => shiftWeek(1)}>
              {t('studioRental:browse.nextWeek')}
            </Button>
          </div>
        </div>

        {selectedRoom ? (
          <div className='mt-4 space-y-2'>
            <div className='grid gap-2 text-sm text-muted-foreground md:grid-cols-3'>
              <p>
                <span className='font-semibold text-foreground'>{t('studioRental:browse.selectedRoom')}</span>{' '}
                {selectedRoom.name}
              </p>
              <p>
                <span className='font-semibold text-foreground'>{t('studioRental:browse.hourlyRate')}</span>{' '}
                {hourlyRateLabel ?? t('studioRental:browse.priceNotConfigured')}
              </p>
              <p>
                <span className='font-semibold text-foreground'>{t('studioRental:browse.capacity')}</span>{' '}
                {selectedRoom.capacity}
              </p>
            </div>
            {!selectionPricingConfigured ? (
              <p className='text-sm text-alert'>{t('studioRental:browse.pricingBlocked')}</p>
            ) : null}
          </div>
        ) : null}
      </section>

      <div className='grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]'>
        <section className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <div>
              <h2 className='text-primary'>{t('studioRental:browse.timelineTitle')}</h2>
              <p className='mt-1 text-sm text-muted-foreground'>{t('studioRental:browse.timelineSubtitle')}</p>
            </div>
            <div className='flex gap-3 text-xs'>
              <span className='inline-flex items-center gap-1.5'>
                <span className='h-2.5 w-2.5 rounded-sm bg-emerald-200 border border-emerald-400' />
                {t('studioRental:browse.legendFree')}
              </span>
              <span className='inline-flex items-center gap-1.5'>
                <span className='h-2.5 w-2.5 rounded-sm bg-red-300' />
                {t('studioRental:browse.legendOccupied')}
              </span>
            </div>
          </div>

          <div className='mt-4'>
            {!roomId ? (
              <div className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] px-4 py-3 text-sm text-muted-foreground'>
                {t('studioRental:browse.roomHint')}
              </div>
            ) : isLoadingCalendar ? (
              <SpinnerLoader message={t('studioRental:browse.loading')} />
            ) : calendar?.error || calendarError ? (
              <div className='rounded-(--radius) bg-[hsl(var(--error-container))] px-3 py-2 text-sm text-destructive'>
                {t('studioRental:browse.loadError')}
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <ScheduleGrid
                  weekDate={weekStart}
                  events={calendarEvents as Array<GridEvent>}
                  scheduleStatus='published'
                  enableRangeSelect
                  rangeSelection={rangeSelection}
                  onRangeSelect={selection => {
                    setRangeSelection(selection);
                    setRequestMode('one_off');
                  }}
                />
              </div>
            )}
          </div>
        </section>

        <aside className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4 space-y-4'>
          <h2 className='text-primary'>{t('studioRental:browse.requestTitle')}</h2>

          <div className='flex flex-wrap gap-2'>
            <Button
              type='button'
              size='sm'
              variant={requestMode === 'one_off' ? 'default' : 'outline'}
              onClick={() => setRequestMode('one_off')}
            >
              {t('studioRental:browse.oneOff')}
            </Button>
            <Button
              type='button'
              size='sm'
              variant={requestMode === 'series' ? 'default' : 'outline'}
              onClick={() => setRequestMode('series')}
            >
              {t('studioRental:browse.series')}
            </Button>
          </div>

          {requestMode === 'one_off' ? (
            selectedRangeIso && rangeSelection ? (
              <div className='space-y-2 rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-3 text-sm'>
                <p>
                  <span className='font-semibold text-foreground'>{t('studioRental:browse.selectedSlot')}</span>
                </p>
                <p>
                  {format(parseISO(rangeSelection.date), 'PPP')} · {padHour(rangeSelection.startHour)}:00 –{' '}
                  {padHour(rangeSelection.endHour)}:00
                </p>
              </div>
            ) : (
              <p className='text-sm text-muted-foreground'>{t('studioRental:browse.selectFreeBlock')}</p>
            )
          ) : (
            <div className='space-y-3'>
              <div>
                <Label>{t('studioRental:browse.dayOfWeek')}</Label>
                <Select value={seriesDayOfWeek} onValueChange={value => setSeriesDayOfWeek(value as DayOfWeek)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SERIES_DAY_OPTIONS.map(day => (
                      <SelectItem key={day} value={day}>
                        {t(`common:days.${day}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className='grid grid-cols-2 gap-2'>
                <div>
                  <Label>{t('studioRental:browse.startTime')}</Label>
                  <Input
                    type='time'
                    value={seriesStartTime}
                    onChange={event => setSeriesStartTime(event.target.value)}
                  />
                </div>
                <div>
                  <Label>{t('studioRental:browse.endTime')}</Label>
                  <Input type='time' value={seriesEndTime} onChange={event => setSeriesEndTime(event.target.value)} />
                </div>
              </div>
              <div>
                <Label>{t('studioRental:browse.seriesStartDate')}</Label>
                <Input type='date' value={seriesStartDate} onChange={event => setSeriesStartDate(event.target.value)} />
              </div>
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  size='sm'
                  variant={seriesTermination === 'end_date' ? 'default' : 'outline'}
                  onClick={() => setSeriesTermination('end_date')}
                >
                  {t('studioRental:browse.byEndDate')}
                </Button>
                <Button
                  type='button'
                  size='sm'
                  variant={seriesTermination === 'count' ? 'default' : 'outline'}
                  onClick={() => setSeriesTermination('count')}
                >
                  {t('studioRental:browse.byCount')}
                </Button>
              </div>
              {seriesTermination === 'end_date' ? (
                <div>
                  <Label>{t('studioRental:browse.seriesEndDate')}</Label>
                  <Input type='date' value={seriesEndDate} onChange={event => setSeriesEndDate(event.target.value)} />
                </div>
              ) : (
                <div>
                  <Label>{t('studioRental:browse.occurrenceCount')}</Label>
                  <Input
                    type='number'
                    min={1}
                    value={occurrenceCount}
                    onChange={event => setOccurrenceCount(event.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {preview ? (
            <div className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-3 text-sm space-y-1'>
              <p className='font-semibold text-foreground'>{t('studioRental:browse.pricePreview')}</p>
              {isLoadingPreview ? (
                <p className='text-muted-foreground'>{t('studioRental:browse.previewLoading')}</p>
              ) : (
                <>
                  <p>
                    {t('studioRental:browse.baseAmount')}: {preview.base_amount}
                  </p>
                  <p>
                    {t('studioRental:browse.taxAmount')}: {preview.tax_amount} ({preview.tax_type_name})
                  </p>
                  <p className='font-medium'>
                    {t('studioRental:browse.finalPrice')}: {preview.final_price}
                  </p>
                </>
              )}
            </div>
          ) : null}

          <section className='w-full text-label'>
            <PolpoCheckbox
              label={
                <Trans
                  i18nKey='studioRental:browse.terms'
                  components={{
                    LinkTerms: (
                      <a
                        target='_blank'
                        rel='noreferrer'
                        href='/assets/legal/terminos-y-condiciones-para-compras.pdf'
                        className='text-info underline'
                      />
                    ),
                  }}
                />
              }
              name='terms_and_conditions'
              value={termsAccepted}
              setValue={() => setTermsAccepted(prev => !prev)}
            />
          </section>

          {requestMode === 'one_off' ? (
            <Button
              type='button'
              disabled={
                !selectedRangeIso || !termsAccepted || isLoadingCreateRental || !roomId || !selectionPricingConfigured
              }
              onClick={() => void submitOneOff()}
            >
              {isLoadingCreateRental ? t('studioRental:browse.creating') : t('studioRental:browse.createRequest')}
            </Button>
          ) : (
            <Button
              type='button'
              disabled={!termsAccepted || isLoadingCreateSeries || !roomId || !selectionPricingConfigured}
              onClick={() => void submitSeries()}
            >
              {isLoadingCreateSeries ? t('studioRental:browse.creatingSeries') : t('studioRental:browse.createSeries')}
            </Button>
          )}
        </aside>
      </div>
    </div>
  );
}

export const SecureStudioRentalBrowsePage = SecurityGuard(StudioRentalBrowsePage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isStudioRentalBrowsePageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
