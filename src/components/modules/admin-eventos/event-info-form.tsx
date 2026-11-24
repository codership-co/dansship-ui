import { zodResolver } from '@hookform/resolvers/zod';
import { type TFunction } from 'i18next';
import { Button } from 'polpo/components';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { z } from 'zod';

import { EditorField, EditorSelect, InfoTooltip, SwitchRow } from './editor-field';
import { EntryWindowEditor } from './entry-window-editor';
import { ADMIN_CARD } from './event-admin-styles';
import {
  EXTERNAL_PLACE,
  EventSessionRows,
  TIME_REGEX,
  emptyRepeat,
  sortSessions,
  type RepeatDraft,
  type SessionDraft,
} from './event-session-rows';
import { EventSessionsPanel, conflictMessage } from './event-sessions-panel';
import { EventTermsEditor } from './event-terms-editor';
import { EventTypeLabelsDialog } from './event-type-labels-dialog';
import { UndatedSessionTemplates } from './undated-session-templates';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { SpinnerLoader } from '@components/loaders';
import { Card, CardContent, CardHeader, CardTitle, Input, Switch, Textarea } from '@components/ui';
import {
  DansshipAPI,
  PaymentProofContentType,
  bogotaDateTimeToIso,
  participationErrorMessage,
  type AdminEventListItem,
  type EventAdmin,
  type EventCreatePayload,
  type EventUpdatePayload,
  type EventVisibility,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn } from '@helpers';
import { useEventTypeLabels, usePromise } from '@hooks';

const NO_INSTRUCTOR = 'none';
const TERMS_TYPES = ['application/pdf'];

export interface EventInfoValues {
  start_from: 'blank' | 'duplicate';
  duplicate_source_id: string;
  name: string;
  type_label_id: string;
  description: string;
  instructor_id: string;
  capacity: string;
  /** Asked while the event has no dates (new or an undated copy); the earliest row is the main session. */
  sessions: Array<SessionDraft>;
  repeat: RepeatDraft;
  /** Off: the end is kept for the room booking, people only see the start. */
  shows_end_time: boolean;
  visibility: EventVisibility;
  is_collaboration: boolean;
  collaborator_email: string;
  collaborator_percentage: string;
}

/** Bogotá date and clock of an instant. */
function bogotaParts(iso: string | null | undefined) {
  if (!iso) return { date: '', time: '' };

  const date = new Date(iso);

  return {
    date: date.toLocaleDateString('en-CA', { timeZone: 'America/Bogota' }),
    time: date.toLocaleTimeString('en-GB', {
      timeZone: 'America/Bogota',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }),
  };
}

function initialValues(event: EventAdmin | undefined): EventInfoValues {
  const main = event?.session_templates?.find(item => item.is_main) ?? null;
  const start = bogotaParts(event?.starts_at);
  const end = bogotaParts(event?.ends_at);
  const roomId = event?.room_id ?? main?.room_id ?? null;
  const external = event?.external_location ?? main?.external_location ?? null;

  return {
    start_from: 'blank',
    duplicate_source_id: '',
    name: event?.name ?? '',
    type_label_id: event?.type_label_id ?? '',
    description: event?.description ?? '',
    instructor_id: event?.instructor_id ?? NO_INSTRUCTOR,
    capacity: String(event?.capacity ?? 24),
    sessions: [
      {
        date: start.date,
        start: start.time || main?.start_time?.slice(0, 5) || '19:00',
        end: end.time || main?.end_time?.slice(0, 5) || '21:00',
        place: external ? EXTERNAL_PLACE : (roomId ?? ''),
        external_location: external ?? '',
      },
    ],
    repeat: emptyRepeat(roomId ?? ''),
    shows_end_time: event?.shows_end_time ?? true,
    visibility: event?.visibility ?? 'public',
    is_collaboration: event?.is_collaboration ?? false,
    collaborator_email: event?.collaborator_email ?? '',
    collaborator_percentage: String(event?.collaborator_participation_percentage ?? 0),
  };
}

/** Client checks; the API keeps every other rule (room conflicts, locked fields…). */
export const createEventInfoSchema = (t: TFunction, asksSession: boolean) =>
  z.custom<EventInfoValues>().superRefine((values, ctx) => {
    const issueAt = (path: Array<string | number>, key: string) =>
      ctx.addIssue({ code: 'custom', path, message: t(`eventos:info.errors.${key}`) });
    const issue = (path: keyof EventInfoValues, key: string) => issueAt([path], key);

    if (values.start_from === 'duplicate') {
      if (!values.duplicate_source_id) issue('duplicate_source_id', 'duplicateSource');

      return;
    }

    if (!values.name.trim()) issue('name', 'name');

    if (!values.type_label_id) issue('type_label_id', 'label');

    if (!(Number(values.capacity) > 0)) issue('capacity', 'capacity');

    if (asksSession) {
      values.sessions.forEach((row, index) => {
        const at = (field: keyof SessionDraft, key: string) => issueAt(['sessions', index, field], key);

        if (!row.date) at('date', 'date');

        if (!TIME_REGEX.test(row.start)) at('start', 'time');

        if (!TIME_REGEX.test(row.end) || row.end <= row.start) at('end', 'endAfterStart');

        if (!row.place) at('place', 'place');

        if (row.place === EXTERNAL_PLACE && !row.external_location.trim()) at('external_location', 'externalLocation');
      });
    }

    if (values.is_collaboration) {
      if (!values.collaborator_email.includes('@')) issue('collaborator_email', 'collaboratorEmail');

      const percent = Number(values.collaborator_percentage);

      if (!(percent >= 0 && percent <= 100)) issue('collaborator_percentage', 'percentage');
    }
  });

interface EventInfoFormProps {
  /** Undefined = "+ Crear evento". */
  event?: EventAdmin;
  onSaved?: (event: EventAdmin) => void;
}

/** Información of an event configured by participant types: the one form for every event. */
export function EventInfoForm({ event, onSaved }: EventInfoFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isNew = !event;
  const asksSession = isNew || !event.starts_at;
  const locked = Boolean(event?.fields_locked);
  const { labels, createLabel, updateLabel } = useEventTypeLabels();
  const { response: roomsResponse } = usePromise(() => DansshipAPI.inventoryAdmin.getRooms({ is_active: true }));
  const { response: instructorsResponse } = usePromise(() => DansshipAPI.instructorsAdmin.getInstructors());
  const { response: eventsResponse } = usePromise(() => DansshipAPI.eventosAdmin.list(), isNew);
  const [labelsOpen, setLabelsOpen] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(event?.image_url ?? null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreview, setQrPreview] = useState<string | null>(event?.payment_qr_url ?? null);
  const [hasOwnQr, setHasOwnQr] = useState(Boolean(event?.payment_qr_url));
  const [termsFile, setTermsFile] = useState<File | null>(null);
  const schema = useMemo(() => createEventInfoSchema(t, asksSession), [t, asksSession]);
  const form = useForm<EventInfoValues>({ defaultValues: initialValues(event), resolver: zodResolver(schema) });
  const { control, register, handleSubmit, formState } = form;
  const [startFrom, isCollaboration] = useWatch({ control, name: ['start_from', 'is_collaboration'] });
  const errors = formState.errors;

  const rooms = roomsResponse?.data ?? [];
  const instructors = (instructorsResponse?.data ?? []).filter(item => Boolean(item.id));
  // The list carries `type: "configured"` for events configured by participant types (no `configuration_model`).
  const duplicable = (eventsResponse?.data ?? []).filter(
    (item: AdminEventListItem) => item.kind === 'event' && item.type === 'configured',
  );
  const labelOptions = labels.filter(label => label.is_offered || label.id === event?.type_label_id);

  if (!roomsResponse || !instructorsResponse) {
    return <SpinnerLoader />;
  }

  const placePayload = (row: SessionDraft) =>
    row.place === EXTERNAL_PLACE
      ? { room_id: null, external_location: row.external_location.trim() }
      : { room_id: row.place, external_location: null };

  const sessionTimes = (row: SessionDraft) => ({
    starts_at: bogotaDateTimeToIso(row.date, row.start),
    ends_at: bogotaDateTimeToIso(row.date, row.end),
  });

  /** Rows after the main one become extra sessions once the event exists; a conflict skips only that row. */
  const addExtraSessions = async (eventId: string, rows: Array<SessionDraft>) => {
    const failures: Array<unknown> = [];

    for (const row of rows) {
      const { ok, error } = await DansshipAPI.eventosAdmin.addSession(eventId, {
        ...sessionTimes(row),
        label: null,
        ...placePayload(row),
      });

      if (!ok) failures.push(error);
    }

    if (failures.length > 0) {
      toast.error(
        t('eventos:info.sessionsAddFailed', { count: failures.length, reason: conflictOrError(failures[0], t) }),
      );
    }
  };

  const uploadTerms = async (eventId: string, eventName: string) => {
    if (!termsFile) return;

    try {
      const fileKey = await DansshipAPI.participationAdmin.uploadEventTermsPdf(eventId, termsFile);
      const saved = await DansshipAPI.participationAdmin.saveEventTerms(eventId, {
        title: t('eventos:participation.terms.documentTitle', { name: eventName }),
        file_key: fileKey,
      });

      if (!saved.ok) {
        toast.error(participationErrorMessage(saved.error, t, 'eventos:participation.terms.saveFailed'));
      } else setTermsFile(null);
    } catch (error) {
      toast.error(participationErrorMessage(error, t, 'eventos:participation.terms.saveFailed'));
    }
  };

  const collaborationPayload = (values: EventInfoValues) => ({
    is_collaboration: values.is_collaboration,
    collaborator_email: values.is_collaboration ? values.collaborator_email.trim() : null,
    collaborator_participation_percentage: values.is_collaboration ? Number(values.collaborator_percentage) : 0,
  });

  const uploadFiles = async (eventId: string) => {
    if (imageFile) {
      const upload = await DansshipAPI.eventosAdmin.uploadImage(eventId, imageFile);

      if (!upload.data) toast.error(t('eventos:admin.imageUploadFailed'));
      else setImageFile(null);
    }

    if (qrFile) {
      const upload = await DansshipAPI.eventosAdmin.uploadPaymentQr(eventId, qrFile);

      if (!upload.data) toast.error(t('eventos:admin.qrUploadFailed'));
      else {
        setQrFile(null);
        setHasOwnQr(true);
      }
    }
  };

  const duplicate = async (sourceId: string) => {
    const { ok, data, error } = await DansshipAPI.eventosAdmin.duplicate(sourceId);

    if (!ok || !data) {
      toast.error(participationErrorMessage(error, t, 'eventos:info.duplicateFailed'));

      return;
    }

    toast.success(t('eventos:info.duplicated'));
    navigate(PageURLS.admin.eventoEdit(data.id), { viewTransition: true });
  };

  const create = async (values: EventInfoValues) => {
    const [main, ...extra] = sortSessions(values.sessions);
    const payload: EventCreatePayload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      ...sessionTimes(main),
      ...placePayload(main),
      shows_end_time: values.shows_end_time,
      instructor_id: values.instructor_id === NO_INSTRUCTOR ? null : values.instructor_id,
      capacity: Number(values.capacity),
      configuration_model: 'participant_types',
      type_label_id: values.type_label_id,
      ...collaborationPayload(values),
    };
    const { ok, data, error } = await DansshipAPI.eventosAdmin.createEvent(payload);

    if (!ok || !data) {
      toast.error(conflictOrError(error, t));

      return;
    }

    await addExtraSessions(data.id, extra);
    await uploadFiles(data.id);
    await uploadTerms(data.id, data.name);

    if (values.visibility !== 'public') {
      await DansshipAPI.eventosAdmin.setVisibility(data.id, values.visibility);
    }

    // "Empezar desde: en blanco": Tipos de participante opens with a draft «General» to review and save.
    toast.success(t('eventos:info.created'));
    navigate(`${PageURLS.admin.eventoEdit(data.id)}?tab=types`, { viewTransition: true });
  };

  const update = async (current: EventAdmin, values: EventInfoValues) => {
    const [main, ...extra] = sortSessions(values.sessions);
    const instructor = values.instructor_id === NO_INSTRUCTOR ? null : values.instructor_id;
    const payload: EventUpdatePayload = {
      name: values.name.trim(),
      description: values.description.trim() || null,
      type_label_id: values.type_label_id,
      ...(instructor ? { instructor_id: instructor } : current.instructor_id ? { clear_instructor: true } : {}),
      ...(locked ? {} : { capacity: Number(values.capacity) }),
      ...(asksSession ? { ...sessionTimes(main), ...placePayload(main) } : {}),
      shows_end_time: values.shows_end_time,
      ...collaborationPayload(values),
      clear_collaborator: !values.is_collaboration && current.is_collaboration,
    };
    const { ok, data, error } = await DansshipAPI.eventosAdmin.updateEvent(current.id, payload);

    if (!ok || !data) {
      toast.error(conflictOrError(error, t));

      return;
    }

    if (asksSession) await addExtraSessions(current.id, extra);

    await uploadFiles(current.id);

    let saved = data;

    if (values.visibility !== (current.visibility ?? 'public')) {
      const visibility = await DansshipAPI.eventosAdmin.setVisibility(current.id, values.visibility);

      if (visibility.ok) saved = visibility.data;
      else toast.error(participationErrorMessage(visibility.error, t, 'eventos:admin.saveFailed'));
    }

    toast.success(t('eventos:admin.updateSuccess'));
    onSaved?.(saved);
  };

  const submit = handleSubmit(async values => {
    if (!event) {
      await (values.start_from === 'duplicate' ? duplicate(values.duplicate_source_id) : create(values));

      return;
    }

    await update(event, values);
  });

  const removeQr = async () => {
    if (!event) {
      setQrFile(null);
      setQrPreview(null);

      return;
    }

    const { ok, error } = await DansshipAPI.eventosAdmin.removePaymentQr(event.id);

    if (!ok) {
      toast.error(participationErrorMessage(error, t, 'eventos:admin.saveFailed'));

      return;
    }

    setHasOwnQr(false);
    setQrPreview(null);
    toast.success(t('eventos:info.qrRemoved'));
  };

  const duplicating = isNew && startFrom === 'duplicate';

  return (
    <form className='grid gap-6' noValidate onSubmit={change => void submit(change)}>
      {isNew ? (
        <Card className={ADMIN_CARD}>
          <CardHeader>
            <CardTitle>{t('eventos:info.startFrom')}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <Controller
              control={control}
              name='start_from'
              render={({ field }) => (
                <div role='radiogroup' aria-label={t('eventos:info.startFrom')} className='grid gap-3 md:grid-cols-2'>
                  {(['blank', 'duplicate'] as const).map(option => (
                    <label
                      key={option}
                      className={cn(
                        'grid cursor-pointer gap-1 rounded-xl border p-4 focus-within:outline-2 focus-within:outline-primary',
                        field.value === option ? 'border-primary bg-primary/5' : 'border-border',
                      )}
                    >
                      <span className='flex items-center gap-2'>
                        <input
                          type='radio'
                          name='start_from'
                          value={option}
                          checked={field.value === option}
                          onChange={() => field.onChange(option)}
                          className='size-[18px] flex-none accent-primary'
                        />
                        <span className='font-semibold'>{t(`eventos:info.startOptions.${option}.title`)}</span>
                      </span>
                      <span className='text-sm text-muted-foreground'>
                        {t(`eventos:info.startOptions.${option}.text`)}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
            {duplicating ? (
              <EditorSelect
                control={control}
                name='duplicate_source_id'
                label={t('eventos:info.duplicateSource')}
                required
                tooltip={t('eventos:info.duplicateSourceTooltip')}
                placeholder={t('eventos:info.duplicatePlaceholder')}
                disabled={duplicable.length === 0}
                options={duplicable.map(item => ({ value: item.id, label: item.name }))}
              />
            ) : null}
            {duplicating && duplicable.length === 0 ? (
              <p className='m-0 text-sm text-muted-foreground'>{t('eventos:info.duplicateEmpty')}</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {event && !event.starts_at ? (
        <p className='m-0 rounded-xl bg-secondary px-3.5 py-3 text-sm font-medium'>{t('eventos:info.undatedNotice')}</p>
      ) : null}
      {locked ? (
        <p className='m-0 rounded-xl border border-destructive/35 bg-destructive/10 px-3.5 py-3 text-sm font-medium'>
          {t('eventos:info.lockedNotice')}
        </p>
      ) : null}

      {duplicating ? null : (
        <>
          <Card className={ADMIN_CARD}>
            <CardHeader>
              <CardTitle>{t('eventos:info.general')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-5'>
              <div className='grid gap-5 md:grid-cols-2'>
                <EditorField label={t('eventos:info.name')} required htmlFor='event-name' error={errors.name?.message}>
                  <Input
                    id='event-name'
                    maxLength={200}
                    placeholder={t('eventos:info.namePlaceholder')}
                    {...register('name')}
                  />
                </EditorField>
                <div className='grid grid-cols-[minmax(0,1fr)_auto] items-end gap-2'>
                  <EditorSelect
                    control={control}
                    name='type_label_id'
                    label={t('eventos:info.label')}
                    required
                    tooltip={t('eventos:info.labelTooltip')}
                    placeholder={t('eventos:info.labelPlaceholder')}
                    options={labelOptions.map(label => ({ value: label.id, label: label.name }))}
                  />
                  <Button
                    type='button'
                    variant='text'
                    color='primary'
                    size='small'
                    className='min-h-11'
                    onClick={() => setLabelsOpen(true)}
                  >
                    {t('eventos:labels.edit')}
                  </Button>
                </div>
              </div>
              <EditorField label={t('eventos:info.description')} optional htmlFor='event-description'>
                <Textarea
                  id='event-description'
                  rows={4}
                  placeholder={t('eventos:info.descriptionPlaceholder')}
                  {...register('description')}
                />
              </EditorField>
              <div className='grid gap-5 md:grid-cols-2'>
                <EditorSelect
                  control={control}
                  name='instructor_id'
                  label={t('eventos:info.instructor')}
                  optional
                  options={[
                    { value: NO_INSTRUCTOR, label: t('eventos:info.noInstructor') },
                    ...instructors.map(item => ({ value: item.id ?? '', label: item.full_name || item.email })),
                  ]}
                />
                <EditorField
                  label={t('eventos:info.capacity')}
                  required
                  htmlFor='event-capacity'
                  tooltip={t('eventos:info.capacityTooltip')}
                  error={errors.capacity?.message}
                >
                  <Input id='event-capacity' type='number' min={1} disabled={locked} {...register('capacity')} />
                </EditorField>
              </div>
              <EditorField label={t('eventos:info.image')} optional>
                <OptionalFileUpload
                  value={imageFile}
                  previewUrl={imagePreview}
                  acceptedTypes={Object.values(PaymentProofContentType)}
                  isUploading={formState.isSubmitting}
                  helperText={t('eventos:admin.imageHint')}
                  onChange={(file, preview) => {
                    setImageFile(file);
                    setImagePreview(preview ?? event?.image_url ?? null);
                  }}
                />
              </EditorField>
            </CardContent>
          </Card>

          <Card className={ADMIN_CARD}>
            <CardHeader>
              <CardTitle className='flex items-center gap-1.5'>
                {t('eventos:info.datesAndPlace')}
                <InfoTooltip content={t('eventos:info.datesTooltip')} />
              </CardTitle>
            </CardHeader>
            <CardContent className='grid gap-5'>
              {asksSession ? <EventSessionRows form={form} rooms={rooms} disabled={locked} /> : null}
              <Controller
                control={control}
                name='shows_end_time'
                render={({ field }) => (
                  <SwitchRow label={t('eventos:info.showsEndTime')} tooltip={t('eventos:info.showsEndTimeTooltip')}>
                    <Switch
                      aria-label={t('eventos:info.showsEndTime')}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </SwitchRow>
                )}
              />
              {event && event.starts_at ? <EventSessionsPanel event={event} rooms={rooms} /> : null}
              {event && event.starts_at ? <UndatedSessionTemplates event={event} /> : null}
              {event && event.starts_at ? <EntryWindowEditor eventId={event.id} /> : null}
            </CardContent>
          </Card>

          <Card className={ADMIN_CARD}>
            <CardHeader>
              <CardTitle>{t('eventos:info.visibilityAndPayment')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-5'>
              <EditorSelect
                control={control}
                name='visibility'
                label={t('eventos:info.visibility')}
                required
                tooltip={t('eventos:info.visibilityTooltip')}
                options={[
                  { value: 'public', label: t('eventos:info.visibilityPublic') },
                  { value: 'invite_only', label: t('eventos:info.visibilityPrivate') },
                ]}
              />
              <EditorField label={t('eventos:info.paymentQr')} optional tooltip={t('eventos:info.paymentQrTooltip')}>
                <OptionalFileUpload
                  value={qrFile}
                  previewUrl={qrPreview}
                  acceptedTypes={Object.values(PaymentProofContentType)}
                  isUploading={formState.isSubmitting}
                  helperText={hasOwnQr || qrFile ? t('eventos:admin.qrHint') : t('eventos:info.dansshipQr')}
                  onChange={(file, preview) => {
                    setQrFile(file);
                    setQrPreview(preview ?? (hasOwnQr ? (event?.payment_qr_url ?? null) : null));
                  }}
                />
                {hasOwnQr ? (
                  <div>
                    <Button type='button' variant='flat' color='secondary' size='small' onClick={() => void removeQr()}>
                      {t('eventos:info.removeQr')}
                    </Button>
                  </div>
                ) : null}
              </EditorField>
              <Controller
                control={control}
                name='is_collaboration'
                render={({ field }) => (
                  <SwitchRow label={t('eventos:info.collaboration')} tooltip={t('eventos:info.collaborationTooltip')}>
                    <Switch
                      aria-label={t('eventos:info.collaboration')}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </SwitchRow>
                )}
              />
              {isCollaboration ? (
                <div className='grid gap-5 md:grid-cols-2'>
                  <EditorField
                    label={t('eventos:admin.collaboratorEmail')}
                    required
                    htmlFor='collaborator-email'
                    error={errors.collaborator_email?.message}
                  >
                    <Input id='collaborator-email' type='email' {...register('collaborator_email')} />
                  </EditorField>
                  <EditorField
                    label={t('eventos:admin.participation')}
                    required
                    htmlFor='collaborator-percentage'
                    tooltip={t('eventos:admin.participationHint')}
                    error={errors.collaborator_percentage?.message}
                  >
                    <Input
                      id='collaborator-percentage'
                      type='number'
                      min={0}
                      max={100}
                      {...register('collaborator_percentage')}
                    />
                  </EditorField>
                </div>
              ) : null}
            </CardContent>
          </Card>

          <Card className={ADMIN_CARD}>
            <CardHeader>
              <CardTitle className='flex items-center gap-1.5'>
                {t('eventos:info.terms')}
                <InfoTooltip content={t('eventos:info.termsTooltip')} />
              </CardTitle>
            </CardHeader>
            <CardContent>
              {event ? (
                <EventTermsEditor eventId={event.id} eventName={event.name} />
              ) : (
                <EditorField label={t('eventos:info.termsFile')} optional tooltip={t('eventos:info.termsFileTooltip')}>
                  <OptionalFileUpload
                    value={termsFile}
                    acceptedTypes={TERMS_TYPES}
                    showPreview={false}
                    isUploading={formState.isSubmitting}
                    label={t('eventos:participation.terms.chooseFile')}
                    helperText={t('eventos:participation.terms.fileHint')}
                    invalidTypeMessage={t('eventos:participation.terms.invalidType')}
                    onChange={file => setTermsFile(file)}
                  />
                </EditorField>
              )}
            </CardContent>
          </Card>
        </>
      )}

      <div className='flex flex-wrap justify-end gap-3'>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          disabled={formState.isSubmitting}
          onClick={() =>
            isNew ? navigate(PageURLS.admin.eventos, { viewTransition: true }) : form.reset(initialValues(event))
          }
        >
          {t('eventos:participation.cancel')}
        </Button>
        <Button type='submit' variant='solid' color='primary' isLoading={formState.isSubmitting}>
          {isNew ? t('eventos:info.saveNew') : t('eventos:participation.editor.save')}
        </Button>
      </div>

      <EventTypeLabelsDialog
        open={labelsOpen}
        labels={labels}
        onOpenChange={setLabelsOpen}
        onCreate={createLabel}
        onUpdate={updateLabel}
      />
    </form>
  );
}

/** Room and instructor conflicts name what collides; other codes use their mapped copy. */
function conflictOrError(error: unknown, t: TFunction) {
  const conflict = conflictMessage(error, t);

  return conflict === t('eventos:admin.sessionSaveFailed')
    ? participationErrorMessage(error, t, 'eventos:admin.saveFailed')
    : conflict;
}
