import { addDays, getDay, parseISO, startOfWeek } from 'date-fns';
import { ActionModal, Button as PolpoButton, Checkbox } from 'polpo/components';
import { useEffect, useMemo, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import {
  LuArrowLeft,
  LuArrowRight,
  LuCalendar,
  LuClock,
  LuCreditCard,
  LuLayers,
  LuList,
  LuReceipt,
} from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import {
  BOGOTA_OFFSET,
  formatDateInput,
  hoursBetween,
  padHour,
  resolveStudioRentalMutationError,
  selectionToIso,
  toBogotaBoundary,
  WHOLE_ROOM,
} from './studio-rental-helpers';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { FormStepperLayout } from '@components/layouts';
import { SpinnerLoader } from '@components/loaders';
import { PaymentMethodSelector } from '@components/modules/payments/payment-method-selector';
import { GridEvent, HourRangeSelection, ScheduleGrid } from '@components/modules/schedules/schedule-grid';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import {
  AgendaEvent,
  CreateRentalRequestPayload,
  CreateRentalSeriesPayload,
  DansshipAPI,
  DayOfWeek,
  GetCalendarParams,
  PaymentMethod,
  PaymentPreviewMappedResponse,
  PaymentPreviewRequest,
  type RentalPaymentOption,
  type StudioRentalRoomOption,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatPrice } from '@helpers';
import { useCallablePromise } from '@hooks';

enum WizardStep {
  RESOURCE = 'RESOURCE',
  CALENDAR = 'CALENDAR',
  MODE = 'MODE',
  CONFIG = 'CONFIG',
  PRICE = 'PRICE',
  METHOD = 'METHOD',
  PAYMENT = 'PAYMENT',
}

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

interface StudioRentalBookingWizardProps {
  room: StudioRentalRoomOption;
  isOpen: boolean;
  onClose: () => void;
}

export function StudioRentalBookingWizard({ room, isOpen, onClose }: StudioRentalBookingWizardProps) {
  return (
    <ActionModal
      closeOnClickOutside={false}
      backCard
      lineOnTop
      icon={LuCalendar}
      isOpen={isOpen}
      onClose={onClose}
      className='w-dvw max-w-[100dvw] overflow-x-clip p-0 rounded-none sm:w-[96dvw] sm:max-w-[96dvw] sm:rounded-xl xl:max-w-7xl'
    >
      <WizardContent room={room} onClose={onClose} />
    </ActionModal>
  );
}

function WizardContent({ room, onClose }: { room: StudioRentalRoomOption; onClose: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const today = new Date();
  const weekStartDefault = startOfWeek(today, { weekStartsOn: 1 });
  const activeResources = useMemo(
    () => (room.resources ?? []).filter(resource => resource.is_active),
    [room.resources],
  );
  const hasResources = activeResources.length > 0;
  const roomPricingConfigured = Boolean(
    room.hourly_rental_price && Number(room.hourly_rental_price) > 0 && room.tax_type_id,
  );

  const [step, setStep] = useState(hasResources ? WizardStep.RESOURCE : WizardStep.CALENDAR);
  const [resourceMode, setResourceMode] = useState<string>(
    roomPricingConfigured || !hasResources ? WHOLE_ROOM : (activeResources[0]?.id ?? WHOLE_ROOM),
  );
  const [weekStart, setWeekStart] = useState(formatDateInput(weekStartDefault));
  const [rangeSelection, setRangeSelection] = useState<HourRangeSelection | null>(null);
  const [requestMode, setRequestMode] = useState<'one_off' | 'series'>('one_off');
  const [seriesDayOfWeek, setSeriesDayOfWeek] = useState<DayOfWeek>('monday');
  const [seriesStartTime, setSeriesStartTime] = useState('09:00');
  const [seriesEndTime, setSeriesEndTime] = useState('10:00');
  const [seriesStartDate, setSeriesStartDate] = useState(formatDateInput(today));
  const [seriesTermination, setSeriesTermination] = useState<'end_date' | 'count'>('end_date');
  const [seriesEndDate, setSeriesEndDate] = useState(formatDateInput(addDays(today, 28)));
  const [occurrenceCount, setOccurrenceCount] = useState('4');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentOption, setPaymentOption] = useState<RentalPaymentOption>('full');
  const [preview, setPreview] = useState<PaymentPreviewMappedResponse | null>(null);
  const [createdIntentId, setCreatedIntentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const resourceId = resourceMode === WHOLE_ROOM ? null : resourceMode;
  const selectionPricingConfigured = resourceId
    ? Boolean(activeResources.find(item => item.id === resourceId)?.hourly_rental_price)
    : roomPricingConfigured;
  const walletCovered = Boolean(preview && preview.amount_to_charge === 0 && preview.wallet_amount_applied > 0);

  const weekEnd = useMemo(() => formatDateInput(addDays(parseISO(weekStart), 6)), [weekStart]);
  const startAt = useMemo(() => toBogotaBoundary(weekStart, false), [weekStart]);
  const endAt = useMemo(() => toBogotaBoundary(weekEnd, true), [weekEnd]);

  const {
    call: getCalendar,
    response: calendar,
    isLoading: isLoadingCalendar,
    error: calendarError,
  } = useCallablePromise((roomId: string, payload: GetCalendarParams) =>
    DansshipAPI.studioRental.getRoomCalendar(roomId, payload),
  );
  const { call: createRental } = useCallablePromise((payload: CreateRentalRequestPayload) =>
    DansshipAPI.studioRental.createRequest(payload),
  );
  const { call: createSeries } = useCallablePromise((payload: CreateRentalSeriesPayload) =>
    DansshipAPI.studioRental.createSeries(payload),
  );
  const { call: previewPayment, isLoading: isLoadingPreview } = useCallablePromise((payload: PaymentPreviewRequest) =>
    DansshipAPI.payments.previewPayment(payload),
  );

  useEffect(() => {
    void getCalendar(room.id, { start_at: startAt, end_at: endAt });
    setRangeSelection(null);
  }, [endAt, getCalendar, room.id, startAt]);

  useEffect(() => {
    if (!rangeSelection) {
      return;
    }

    setSeriesStartTime(`${padHour(rangeSelection.startHour)}:00`);
    setSeriesEndTime(`${padHour(rangeSelection.endHour)}:00`);
    setSeriesStartDate(rangeSelection.date);
    setSeriesDayOfWeek(DAY_OF_WEEK_VALUES[getDay(parseISO(rangeSelection.date))]);
  }, [rangeSelection]);

  const selectedRangeIso = useMemo(() => (rangeSelection ? selectionToIso(rangeSelection) : null), [rangeSelection]);

  useEffect(() => {
    const runPreview = async () => {
      if (!selectionPricingConfigured) {
        setPreview(null);

        return;
      }

      if (requestMode === 'series') {
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
                  (new Date(seriesEndDate).getTime() - new Date(seriesStartDate).getTime()) / (7 * 24 * 60 * 60 * 1000),
                ) + 1,
              );

        if (duration <= 0 || count <= 0) {
          setPreview(null);

          return;
        }

        const { data, ok } = await previewPayment({
          purchase_type: 'studio_rental',
          room_id: room.id,
          resource_id: resourceId,
          duration_hours: duration * count,
          payment_option: paymentOption,
        });
        setPreview(ok && data ? data : null);

        return;
      }

      if (!selectedRangeIso) {
        setPreview(null);

        return;
      }

      const { data, ok } = await previewPayment({
        purchase_type: 'studio_rental',
        room_id: room.id,
        resource_id: resourceId,
        start_time: selectedRangeIso.start_time,
        end_time: selectedRangeIso.end_time,
        payment_option: paymentOption,
      });
      setPreview(ok && data ? data : null);
    };

    void runPreview();
  }, [
    occurrenceCount,
    paymentOption,
    previewPayment,
    requestMode,
    resourceId,
    room.id,
    selectedRangeIso,
    selectionPricingConfigured,
    seriesEndDate,
    seriesEndTime,
    seriesStartDate,
    seriesStartTime,
    seriesTermination,
  ]);

  const calendarEvents = useMemo((): Array<AgendaEvent> => {
    return (calendar?.data ?? [])
      .filter(block => block.kind === 'occupied')
      .map(block => ({
        event_type: 'blocked_space',
        source_id: `${block.start_time}-${block.end_time}`,
        room_id: room.id,
        start_time: block.start_time,
        end_time: block.end_time,
        status: block.kind,
        metadata: {
          kind: 'occupied',
          title: t('studioRental:browse.blockOccupied'),
        },
      }));
  }, [calendar?.data, room.id, t]);

  const submitBooking = async (): Promise<string | null> => {
    if (createdIntentId) {
      return createdIntentId;
    }

    if (!termsAccepted || !selectionPricingConfigured) {
      return null;
    }

    if (requestMode === 'one_off') {
      if (!selectedRangeIso) {
        return null;
      }

      const { data, error } = await createRental({
        type: 'studio_rental',
        purpose: 'self_practice',
        terms_accepted: true,
        payment_method_type: paymentMethod === PaymentMethod.CARD ? 'card' : 'transfer',
        payment_option: paymentOption,
        slots: [
          {
            room_id: room.id,
            resource_id: resourceId,
            start_time: selectedRangeIso.start_time,
            end_time: selectedRangeIso.end_time,
          },
        ],
      });

      if (error || !data) {
        toast.error(resolveStudioRentalMutationError(error, t, 'studioRental:toast.requestFailed'));

        return null;
      }

      const intentId = data.payment_intent_id ?? null;
      setCreatedIntentId(intentId);

      return intentId;
    }

    const payload: CreateRentalSeriesPayload = {
      room_id: room.id,
      resource_id: resourceId,
      day_of_week: seriesDayOfWeek,
      start_time: `${seriesStartTime}:00`,
      end_time: `${seriesEndTime}:00`,
      series_start_date: seriesStartDate,
      terms_accepted: true,
      payment_method_type: paymentMethod === PaymentMethod.CARD ? 'card' : 'transfer',
      payment_option: paymentOption,
      ...(seriesTermination === 'end_date'
        ? { series_end_date: seriesEndDate, occurrence_count: null }
        : { occurrence_count: Number(occurrenceCount), series_end_date: null }),
    };
    const { data, error } = await createSeries(payload);

    if (error || !data) {
      toast.error(resolveStudioRentalMutationError(error, t, 'studioRental:toast.seriesFailed'));

      return null;
    }

    const intentId = data.payment_intent_id ?? null;
    setCreatedIntentId(intentId);

    return intentId;
  };

  const footer = (back: WizardStep | null, next: WizardStep | null, nextDisabled: boolean, nextLabel?: string) => (
    <div className='flex flex-wrap justify-end gap-2 pt-4'>
      {back ? (
        <Button type='button' variant='outline' onClick={() => setStep(back)}>
          {t('common:back')}
        </Button>
      ) : (
        <Button type='button' variant='outline' onClick={onClose}>
          {t('common:cancel')}
        </Button>
      )}
      {next ? (
        <Button type='button' disabled={nextDisabled} onClick={() => setStep(next)}>
          {nextLabel ?? t('common:next')}
        </Button>
      ) : null}
    </div>
  );

  const resourceForm = (
    <div className='grid gap-3 content-start'>
      {roomPricingConfigured ? (
        <button
          type='button'
          className={cn(
            'rounded-xl border p-4 text-left',
            resourceMode === WHOLE_ROOM ? 'border-primary bg-primary/5' : 'border-border',
          )}
          onClick={() => setResourceMode(WHOLE_ROOM)}
        >
          <p className='font-semibold'>{t('studioRental:browse.wholeRoom')}</p>
          <p className='text-sm text-muted-foreground'>
            {formatPrice(Number(room.hourly_rental_price), 'COP')} / {t('studioRental:wizard.hour')}
          </p>
        </button>
      ) : null}
      {activeResources.map(resource => (
        <button
          type='button'
          key={resource.id}
          className={cn(
            'rounded-xl border p-4 text-left',
            resourceMode === resource.id ? 'border-primary bg-primary/5' : 'border-border',
          )}
          onClick={() => setResourceMode(resource.id)}
        >
          <p className='font-semibold'>
            {resource.label ||
              t(`studioRental:resourceTypes.${resource.resource_type}`, { position: resource.position })}
          </p>
          <p className='text-sm text-muted-foreground'>
            {formatPrice(Number(resource.hourly_rental_price), 'COP')} / {t('studioRental:wizard.hour')}
          </p>
        </button>
      ))}
      {footer(null, WizardStep.CALENDAR, !selectionPricingConfigured)}
    </div>
  );

  const calendarForm = (
    <div className='grid gap-4 content-start'>
      <div className='flex flex-wrap items-center gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setWeekStart(formatDateInput(addDays(parseISO(weekStart), -7)))}
        >
          {t('studioRental:browse.prevWeek')}
        </Button>
        <p className='text-sm text-muted-foreground'>
          {weekStart} – {weekEnd}
        </p>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => setWeekStart(formatDateInput(addDays(parseISO(weekStart), 7)))}
        >
          {t('studioRental:browse.nextWeek')}
        </Button>
      </div>
      {isLoadingCalendar ? (
        <SpinnerLoader message={t('studioRental:browse.loading')} />
      ) : calendarError ? (
        <p className='text-sm text-alert'>{t('studioRental:browse.loadError')}</p>
      ) : (
        <ScheduleGrid
          weekDate={weekStart}
          events={calendarEvents as Array<GridEvent>}
          enableRangeSelect
          rangeSelection={rangeSelection}
          onRangeSelect={setRangeSelection}
        />
      )}
      {footer(hasResources ? WizardStep.RESOURCE : null, WizardStep.MODE, !rangeSelection)}
    </div>
  );

  const modeForm = (
    <div className='grid gap-3 content-start'>
      <button
        type='button'
        className={cn(
          'rounded-xl border p-4 text-left',
          requestMode === 'one_off' ? 'border-primary bg-primary/5' : 'border-border',
        )}
        onClick={() => setRequestMode('one_off')}
      >
        <p className='font-semibold'>{t('studioRental:browse.oneOff')}</p>
        <p className='text-sm text-muted-foreground'>{t('studioRental:wizard.oneOffHint')}</p>
      </button>
      <button
        type='button'
        className={cn(
          'rounded-xl border p-4 text-left',
          requestMode === 'series' ? 'border-primary bg-primary/5' : 'border-border',
        )}
        onClick={() => setRequestMode('series')}
      >
        <p className='font-semibold'>{t('studioRental:browse.series')}</p>
        <p className='text-sm text-muted-foreground'>{t('studioRental:wizard.seriesHint')}</p>
      </button>
      {footer(WizardStep.CALENDAR, WizardStep.CONFIG, false)}
    </div>
  );

  const configForm = (
    <div className='grid gap-4 content-start'>
      {requestMode === 'one_off' ? (
        <p className='text-sm text-muted-foreground'>
          {rangeSelection
            ? t('studioRental:wizard.selectedRange', {
                date: rangeSelection.date,
                start: `${padHour(rangeSelection.startHour)}:00`,
                end: `${padHour(rangeSelection.endHour)}:00`,
              })
            : t('studioRental:browse.selectFreeBlock')}
        </p>
      ) : (
        <>
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
          <div className='grid gap-3 sm:grid-cols-2'>
            <div>
              <Label>{t('studioRental:browse.startTime')}</Label>
              <Input type='time' value={seriesStartTime} onChange={event => setSeriesStartTime(event.target.value)} />
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
          <div className='flex gap-2'>
            <Button
              type='button'
              variant={seriesTermination === 'end_date' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setSeriesTermination('end_date')}
            >
              {t('studioRental:browse.byEndDate')}
            </Button>
            <Button
              type='button'
              variant={seriesTermination === 'count' ? 'default' : 'outline'}
              size='sm'
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
              <Input value={occurrenceCount} onChange={event => setOccurrenceCount(event.target.value)} />
            </div>
          )}
        </>
      )}
      {footer(WizardStep.MODE, WizardStep.PRICE, requestMode === 'one_off' && !rangeSelection)}
    </div>
  );

  const priceForm = (
    <div className='grid gap-4 content-start'>
      <div className='space-y-2'>
        <Label>{t('studioRental:browse.paymentOption')}</Label>
        <div className='flex flex-wrap gap-2'>
          <Button
            type='button'
            variant={paymentOption === 'full' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setPaymentOption('full')}
          >
            {t('studioRental:browse.paymentOptionFull')}
          </Button>
          <Button
            type='button'
            variant={paymentOption === 'fifty_fifty' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setPaymentOption('fifty_fifty')}
          >
            {t('studioRental:browse.paymentOptionFiftyFifty')}
          </Button>
        </div>
        <p className='text-xs text-muted-foreground'>
          {paymentOption === 'fifty_fifty'
            ? t('studioRental:browse.paymentOptionFiftyFiftyHint')
            : t('studioRental:browse.paymentOptionFullHint')}
        </p>
      </div>
      {isLoadingPreview ? (
        <SpinnerLoader message={t('studioRental:browse.previewLoading')} />
      ) : preview ? (
        <div className='space-y-2 rounded-xl bg-[hsl(var(--surface-container-highest))] p-4 text-sm'>
          <p>
            {t('studioRental:browse.baseAmount')}: {formatPrice(preview.base_amount, 'COP')}
          </p>
          <p>
            {t('studioRental:browse.taxAmount')}: {formatPrice(preview.tax_amount, 'COP')}
          </p>
          <p>
            {t('studioRental:browse.finalPrice')}: {formatPrice(preview.final_price, 'COP')}
          </p>
          {paymentOption === 'fifty_fifty' ? (
            <>
              <p className='pt-2 text-base font-semibold'>
                {t('studioRental:browse.dueNow')}:{' '}
                {formatPrice(
                  preview.amount_to_charge > 0
                    ? preview.amount_to_charge
                    : (preview.deposit_amount ?? preview.final_price / 2),
                  'COP',
                )}
              </p>
              <p>
                {t('studioRental:browse.balanceLater')}:{' '}
                {formatPrice(preview.balance_amount ?? preview.final_price / 2, 'COP')}
              </p>
              <p className='text-xs text-muted-foreground'>{t('studioRental:browse.balanceDueHint')}</p>
            </>
          ) : (
            <p className='pt-2 text-base font-semibold'>
              {t('studioRental:browse.dueNow')}: {formatPrice(preview.amount_to_charge, 'COP')}
            </p>
          )}
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>{t('studioRental:browse.pricingBlocked')}</p>
      )}
      <Checkbox
        name='terms_and_conditions'
        value={termsAccepted}
        setValue={() => setTermsAccepted(current => !current)}
        label={
          <Trans
            i18nKey='studioRental:browse.terms'
            components={{
              LinkTerms: <a href={PageURLS.legal} className='underline' target='_blank' rel='noreferrer' />,
            }}
          />
        }
      />
      {footer(WizardStep.CONFIG, walletCovered ? WizardStep.PAYMENT : WizardStep.METHOD, !termsAccepted || !preview)}
    </div>
  );

  const methodForm = (
    <section className='grid grid-rows-[1fr_auto] h-full'>
      <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

      <div className='flex flex-wrap justify-end gap-2 pt-4'>
        <PolpoButton
          type='button'
          color='primary'
          className='flex items-center'
          variant='outlined'
          onClick={() => setStep(WizardStep.PRICE)}
        >
          <LuArrowLeft />
          {t('common:back')}
        </PolpoButton>

        <PolpoButton
          type='button'
          color='primary'
          className='flex items-center'
          disabled={!paymentMethod}
          onClick={() => setStep(WizardStep.PAYMENT)}
        >
          {t('common:next')}
          <LuArrowRight />
        </PolpoButton>
      </div>
    </section>
  );

  const paymentForm = preview ? (
    <CheckoutPaymentProofForm
      summaryTitle={room.name}
      currency='COP'
      paymentMethod={paymentMethod ?? (walletCovered ? PaymentMethod.WALLET : PaymentMethod.CARD)}
      finalPrice={preview.final_price}
      amountToCharge={preview.amount_to_charge}
      walletAmountApplied={preview.wallet_amount_applied}
      onClose={onClose}
      onBack={() => setStep(walletCovered ? WizardStep.PRICE : WizardStep.METHOD)}
      onCreateIntent={submitBooking}
      onSubmit={intentId => {
        onClose();
        navigate(`${PageURLS.studioRentalResult}?intentId=${intentId}`);
      }}
    />
  ) : (
    <div className='grid gap-4 content-start'>
      <p className='text-sm text-muted-foreground'>{t('studioRental:browse.pricingBlocked')}</p>
      {footer(WizardStep.PRICE, null, true)}
    </div>
  );

  const steps = [
    ...(hasResources
      ? [
          {
            title: t('studioRental:wizard.steps.resource'),
            subtitle: t('studioRental:wizard.subtitles.resource'),
            step: WizardStep.RESOURCE,
            Icon: LuLayers,
            form: resourceForm,
          },
        ]
      : []),
    {
      title: t('studioRental:wizard.steps.calendar'),
      subtitle: t('studioRental:wizard.subtitles.calendar'),
      step: WizardStep.CALENDAR,
      Icon: LuCalendar,
      form: calendarForm,
    },
    {
      title: t('studioRental:wizard.steps.mode'),
      subtitle: t('studioRental:wizard.subtitles.mode'),
      step: WizardStep.MODE,
      Icon: LuList,
      form: modeForm,
    },
    {
      title: t('studioRental:wizard.steps.config'),
      subtitle: t('studioRental:wizard.subtitles.config'),
      step: WizardStep.CONFIG,
      Icon: LuClock,
      form: configForm,
    },
    {
      title: t('studioRental:wizard.steps.price'),
      subtitle: t('studioRental:wizard.subtitles.price'),
      step: WizardStep.PRICE,
      Icon: LuReceipt,
      form: priceForm,
    },
    ...(walletCovered
      ? []
      : [
          {
            title: t('payments:selectMethod'),
            subtitle: '',
            step: WizardStep.METHOD,
            Icon: LuCreditCard,
            form: methodForm,
          },
        ]),
    {
      title: t('payments:confirmationTitle'),
      subtitle: '',
      step: WizardStep.PAYMENT,
      Icon: LuReceipt,
      form: paymentForm,
    },
  ];

  return (
    <section className='m-auto h-auto max-w-[100dvw] w-dvw overflow-x-clip border-0 bg-transparent p-0 shadow-none sm:w-[96dvw] sm:max-w-[96dvw] xl:max-w-7xl'>
      <FormStepperLayout
        className={cn(
          'm-auto min-w-0 overflow-x-clip overflow-y-auto rounded-none sm:rounded-xl',
          'w-full max-w-full',
          'h-dvh md:h-[80dvh]',
          'max-h-dvh sm:max-h-[96dvh]',
        )}
        steps={steps}
        currentStep={step}
      />
    </section>
  );
}
