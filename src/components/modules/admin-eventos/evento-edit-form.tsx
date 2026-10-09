import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { EventoRoster } from './evento-roster';
import { PriceTiersEditor } from './price-tiers-editor';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { SpinnerLoader } from '@components/loaders';
import { DirectRegistrationForm } from '@components/modules/eventos/direct-registration-form';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Switch,
  Textarea,
  Badge,
} from '@components/ui';
import {
  DansshipAPI,
  DansshipAPIError,
  PaymentProofContentType,
  type EventAdmin,
  type EventPriceTierInput,
  type EventStatus,
  type EventType,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise, usePromise } from '@hooks';

function colombiaParts(iso: string) {
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

function toIso(date: string, time: string) {
  return new Date(`${date}T${time}:00-05:00`).toISOString();
}

function defaultStart() {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  now.setHours(10, 0, 0, 0);

  return now.toISOString();
}

interface EventoEditFormProps {
  event?: EventAdmin;
}

export function EventoEditForm({ event }: EventoEditFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locked = Boolean(event?.fields_locked);
  const startParts = colombiaParts(event?.starts_at ?? defaultStart());
  const endParts = colombiaParts(event?.ends_at ?? defaultStart());
  const [name, setName] = useState(event?.name ?? '');
  const [description, setDescription] = useState(event?.description ?? '');
  const [date, setDate] = useState(startParts.date);
  const [startTime, setStartTime] = useState(startParts.time);
  const [endTime, setEndTime] = useState(endParts.time === startParts.time ? '12:00' : endParts.time);
  const [capacity, setCapacity] = useState(String(event?.capacity ?? 24));
  const [roomId, setRoomId] = useState(event?.room_id ?? '');
  const [instructorId, setInstructorId] = useState(event?.instructor_id ?? '');
  const [requiresPartner, setRequiresPartner] = useState(event?.requires_partner ?? false);
  const [isCollaboration, setIsCollaboration] = useState(event?.is_collaboration ?? false);
  const [collaboratorEmail, setCollaboratorEmail] = useState(event?.collaborator_email ?? '');
  const [collaboratorName, setCollaboratorName] = useState<string | null>(event?.collaborator_display_name ?? null);
  const [collaboratorError, setCollaboratorError] = useState<string | null>(null);
  const [participation, setParticipation] = useState(String(event?.collaborator_participation_percentage ?? 0));
  const [status, setStatus] = useState<EventStatus>(event?.status ?? 'draft');
  const [eventType, setEventType] = useState<EventType>(event?.type ?? 'taller');
  const [basePrice, setBasePrice] = useState(String(event?.base_price ?? ''));
  const [tiers, setTiers] = useState<Array<EventPriceTierInput>>(
    event?.price_tiers.map(tier => ({
      condition_type: tier.condition_type,
      condition_params: tier.condition_params,
      price: tier.price,
    })) ?? [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(event?.image_url ?? null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(event?.payment_qr_url ?? null);
  const [saving, setSaving] = useState(false);

  const { response: roomsResponse } = usePromise(() => DansshipAPI.inventoryAdmin.getRooms({ is_active: true }));
  const { response: instructorsResponse } = usePromise(() => DansshipAPI.instructorsAdmin.getInstructors());
  const { response: conditionsResponse } = usePromise(() => DansshipAPI.eventosAdmin.listPriceConditions());
  const { response: rosterResponse, reFetch: reFetchRoster } = usePromise(
    () => DansshipAPI.eventosAdmin.listRoster(event?.id ?? ''),
    Boolean(event?.id && (event.is_collaboration || isCollaboration)),
    [event?.id, isCollaboration],
  );
  const { call: lookupCollaborator } = useCallablePromise((email: string) =>
    DansshipAPI.eventosAdmin.lookupCollaborator(email),
  );

  const rooms = roomsResponse?.data ?? [];
  const instructors = useMemo(
    () => (instructorsResponse?.data ?? []).filter(item => Boolean(item.id)),
    [instructorsResponse],
  );
  const conditions = Array.isArray(conditionsResponse?.data) ? conditionsResponse.data : [];

  useEffect(() => {
    const email = collaboratorEmail.trim();

    if (!isCollaboration || !email || !email.includes('@')) {
      setCollaboratorName(null);
      setCollaboratorError(null);

      return;
    }

    const handle = window.setTimeout(() => {
      void lookupCollaborator(email)
        .then(result => {
          const data = result.data;

          if (data?.found) {
            setCollaboratorName(data.display_name);
            setCollaboratorError(null);
          } else {
            setCollaboratorName(null);
            setCollaboratorError(data?.error_code ?? 'COLLABORATOR_NOT_FOUND');
          }
        })
        .catch(() => {
          setCollaboratorName(null);
          setCollaboratorError('COLLABORATOR_NOT_FOUND');
        });
    }, 400);

    return () => window.clearTimeout(handle);
  }, [collaboratorEmail, isCollaboration, lookupCollaborator]);

  const save = async (formEvent: FormEvent) => {
    formEvent.preventDefault();

    if (isCollaboration && collaboratorEmail.trim() && !collaboratorName) {
      toast.error(t('eventos:admin.collaboratorNotFound'));

      return;
    }

    setSaving(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      starts_at: toIso(date, startTime),
      ends_at: toIso(date, endTime),
      room_id: roomId,
      instructor_id: instructorId,
      capacity: Number(capacity),
      requires_partner: requiresPartner,
      is_collaboration: isCollaboration,
      collaborator_email: isCollaboration && collaboratorEmail.trim() ? collaboratorEmail.trim() : null,
      clear_collaborator: isCollaboration && !collaboratorEmail.trim(),
      collaborator_participation_percentage: Number(participation || 0),
      base_price: Number(basePrice),
      price_tiers: tiers,
      ...(locked ? {} : { type: eventType }),
    };

    try {
      if (event) {
        const { data, ok } = await DansshipAPI.eventosAdmin.updateEvent(event.id, {
          ...payload,
          status,
        });

        if (!ok || !data) {
          toast.error(t('eventos:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.eventosAdmin.uploadImage(event.id, imageFile);

          if (!upload.data) {
            toast.error(t('eventos:admin.imageUploadFailed'));
          } else {
            setPreviewUrl(upload.data.image_url);
            setImageFile(null);
          }
        }

        if (qrFile) {
          const upload = await DansshipAPI.eventosAdmin.uploadPaymentQr(event.id, qrFile);

          if (!upload.data) {
            toast.error(t('eventos:admin.qrUploadFailed'));
          } else {
            setQrPreviewUrl(upload.data.payment_qr_url);
            setQrFile(null);
          }
        }

        toast.success(t('eventos:admin.updateSuccess'));
      } else {
        const { data, ok } = await DansshipAPI.eventosAdmin.createEvent(payload);

        if (!ok || !data) {
          toast.error(t('eventos:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.eventosAdmin.uploadImage(data.id, imageFile);

          if (!upload.data) {
            toast.error(t('eventos:admin.imageUploadFailed'));
          }
        }

        if (qrFile) {
          const upload = await DansshipAPI.eventosAdmin.uploadPaymentQr(data.id, qrFile);

          if (!upload.data) {
            toast.error(t('eventos:admin.qrUploadFailed'));
          }
        }

        toast.success(t('eventos:admin.createSuccess'));
        navigate(PageURLS.admin.eventoEdit(data.id));
      }
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      toast.error(
        code === 'AGENDA_ROOM_OCCUPANCY_CONFLICT'
          ? t('eventos:admin.occupancyConflict')
          : t('eventos:admin.saveFailed'),
      );
    } finally {
      setSaving(false);
    }
  };

  if (!roomsResponse || !instructorsResponse || !conditionsResponse) {
    return <SpinnerLoader />;
  }

  return (
    <form className='grid gap-6' onSubmit={save}>
      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='grid gap-1'>
          <Link className='text-sm font-semibold text-primary' to={PageURLS.admin.eventos}>
            {t('eventos:admin.backToList')}
          </Link>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='m-0 text-2xl font-bold text-foreground'>
              {event ? t('eventos:admin.editEvent') : t('eventos:admin.newEvent')}
            </h1>
            <Badge variant={status === 'published' ? 'default' : 'outline'}>
              {status === 'published' ? t('eventos:admin.published') : t('eventos:admin.draft')}
            </Badge>
          </div>
          {event?.name ? <p className='m-0 text-sm text-muted-foreground'>{event.name}</p> : null}
        </div>
        <div className='flex flex-wrap items-center gap-2.5'>
          <label className='flex cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-1.5'>
            <span className='text-sm font-semibold'>
              {status === 'published' ? t('eventos:admin.published') : t('eventos:admin.draft')}
            </span>
            <Switch
              checked={status === 'published'}
              onCheckedChange={checked => setStatus(checked ? 'published' : 'draft')}
              className='data-[state=unchecked]:border-border data-[state=unchecked]:bg-gray-300'
            />
          </label>
          {event ? (
            <Button asChild variant='outline'>
              <Link to={`${PageURLS.eventoLanding(event.slug)}?preview=1`} target='_blank' rel='noreferrer'>
                {t('eventos:admin.preview')}
              </Link>
            </Button>
          ) : null}
          <Button type='submit' disabled={saving}>
            {saving ? t('eventos:admin.saving') : t('eventos:admin.save')}
          </Button>
        </div>
      </div>

      {locked ? (
        <p className='rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm'>{t('eventos:admin.lockBanner')}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:admin.general')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='event-name'>{t('eventos:admin.name')}</Label>
            <Input id='event-name' value={name} onChange={event => setName(event.target.value)} required />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='event-description'>{t('eventos:admin.description')}</Label>
            <Textarea
              id='event-description'
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='grid gap-2'>
              <Label>{t('eventos:admin.date')}</Label>
              <Input
                type='date'
                disabled={locked}
                value={date}
                onChange={event => setDate(event.target.value)}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label>{t('eventos:admin.startTime')}</Label>
              <Input
                type='time'
                disabled={locked}
                value={startTime}
                onChange={event => setStartTime(event.target.value)}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label>{t('eventos:admin.endTime')}</Label>
              <Input
                type='time'
                disabled={locked}
                value={endTime}
                onChange={event => setEndTime(event.target.value)}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label>{t('eventos:admin.type')}</Label>
              <select
                className='h-10 rounded-md border border-input bg-background px-3 text-sm'
                disabled={locked}
                value={eventType}
                onChange={change => setEventType(change.target.value as EventType)}
              >
                <option value='taller'>{t('eventos:types.taller')}</option>
                <option value='clase_especial'>{t('eventos:types.clase_especial')}</option>
              </select>
            </div>
            <div className='grid gap-2'>
              <Label>{t('eventos:admin.capacity')}</Label>
              <Input
                type='number'
                min={1}
                disabled={locked}
                value={capacity}
                onChange={event => setCapacity(event.target.value)}
                required
              />
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <div className='grid gap-2'>
              <Label htmlFor='event-room'>{t('eventos:admin.room')}</Label>
              <select
                id='event-room'
                className='rounded-2xl bg-gray-200/50 px-6 py-4'
                value={roomId}
                onChange={event => setRoomId(event.target.value)}
                required
              >
                <option value='' />
                {rooms.map(room => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='event-instructor'>{t('eventos:admin.instructor')}</Label>
              <select
                id='event-instructor'
                className='rounded-2xl bg-gray-200/50 px-6 py-4'
                value={instructorId}
                onChange={event => setInstructorId(event.target.value)}
                required
              >
                <option value='' />
                {instructors.map(instructor => (
                  <option key={instructor.id ?? instructor.user_id} value={instructor.id ?? ''}>
                    {instructor.full_name || instructor.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:admin.image')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3'>
          <OptionalFileUpload
            value={imageFile}
            previewUrl={previewUrl}
            acceptedTypes={Object.values(PaymentProofContentType)}
            isUploading={saving}
            helperText={t('eventos:admin.imageHint')}
            onChange={(file, nextPreviewUrl) => {
              setImageFile(file);
              setPreviewUrl(nextPreviewUrl ?? event?.image_url ?? null);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:admin.collaboration')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <span>{t('eventos:admin.isCollaboration')}</span>
            <Switch checked={isCollaboration} onCheckedChange={checked => setIsCollaboration(checked)} />
          </div>
          {isCollaboration ? (
            <>
              <div className='grid gap-2'>
                <Label htmlFor='collaborator-email'>{t('eventos:admin.collaboratorEmail')}</Label>
                <Input
                  id='collaborator-email'
                  type='email'
                  value={collaboratorEmail}
                  onChange={event => setCollaboratorEmail(event.target.value)}
                />
                {collaboratorName ? (
                  <p className='m-0 text-sm text-primary'>{collaboratorName}</p>
                ) : collaboratorError ? (
                  <p className='m-0 text-sm text-destructive'>{t('eventos:admin.collaboratorNotFound')}</p>
                ) : null}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='participation'>{t('eventos:admin.participation')}</Label>
                <Input
                  id='participation'
                  type='number'
                  min={0}
                  max={100}
                  value={participation}
                  onChange={event => setParticipation(event.target.value)}
                />
                <p className='m-0 text-xs text-muted-foreground'>{t('eventos:admin.participationHint')}</p>
              </div>
              <OptionalFileUpload
                value={qrFile}
                previewUrl={qrPreviewUrl}
                acceptedTypes={Object.values(PaymentProofContentType)}
                isUploading={saving}
                helperText={t('eventos:admin.qrHint')}
                onChange={(file, nextPreviewUrl) => {
                  setQrFile(file);
                  setQrPreviewUrl(nextPreviewUrl ?? event?.payment_qr_url ?? null);
                }}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='flex items-center justify-between gap-4 pt-6'>
          <span>{t('eventos:admin.requiresPartner')}</span>
          <Switch
            checked={requiresPartner}
            disabled={locked}
            onCheckedChange={checked => setRequiresPartner(checked)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('eventos:admin.priceRules')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceTiersEditor
            conditions={conditions}
            tiers={tiers}
            basePrice={basePrice}
            baseLabel={requiresPartner ? t('eventos:admin.basePricePair') : t('eventos:admin.basePrice')}
            locked={locked}
            onChange={setTiers}
            onBasePriceChange={setBasePrice}
          />
        </CardContent>
      </Card>
      {event && isCollaboration ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('eventos:admin.roster')}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <DirectRegistrationForm
              onSubmit={async payload => {
                const { ok } = await DansshipAPI.eventosAdmin.registerDirectly(event.id, payload);

                if (ok) {
                  await reFetchRoster();
                }

                return ok;
              }}
            />
            <EventoRoster rows={rosterResponse?.data ?? []} />
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
}
