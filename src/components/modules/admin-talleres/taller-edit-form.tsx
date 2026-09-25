import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { PriceTiersEditor } from './price-tiers-editor';
import { TallerRoster } from './taller-roster';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import { SpinnerLoader } from '@components/loaders';
import { DirectRegistrationForm } from '@components/modules/talleres/direct-registration-form';
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
  type WorkshopAdmin,
  type WorkshopPriceTierInput,
  type WorkshopStatus,
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

interface TallerEditFormProps {
  workshop?: WorkshopAdmin;
}

export function TallerEditForm({ workshop }: TallerEditFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locked = Boolean(workshop?.fields_locked);
  const startParts = colombiaParts(workshop?.starts_at ?? defaultStart());
  const endParts = colombiaParts(workshop?.ends_at ?? defaultStart());
  const [name, setName] = useState(workshop?.name ?? '');
  const [description, setDescription] = useState(workshop?.description ?? '');
  const [date, setDate] = useState(startParts.date);
  const [startTime, setStartTime] = useState(startParts.time);
  const [endTime, setEndTime] = useState(endParts.time === startParts.time ? '12:00' : endParts.time);
  const [capacity, setCapacity] = useState(String(workshop?.capacity ?? 24));
  const [roomId, setRoomId] = useState(workshop?.room_id ?? '');
  const [instructorId, setInstructorId] = useState(workshop?.instructor_id ?? '');
  const [requiresPartner, setRequiresPartner] = useState(workshop?.requires_partner ?? false);
  const [isCollaboration, setIsCollaboration] = useState(workshop?.is_collaboration ?? false);
  const [collaboratorEmail, setCollaboratorEmail] = useState(workshop?.collaborator_email ?? '');
  const [collaboratorName, setCollaboratorName] = useState<string | null>(workshop?.collaborator_display_name ?? null);
  const [collaboratorError, setCollaboratorError] = useState<string | null>(null);
  const [participation, setParticipation] = useState(String(workshop?.collaborator_participation_percentage ?? 0));
  const [status, setStatus] = useState<WorkshopStatus>(workshop?.status ?? 'draft');
  const [basePrice, setBasePrice] = useState(String(workshop?.base_price ?? ''));
  const [tiers, setTiers] = useState<Array<WorkshopPriceTierInput>>(
    workshop?.price_tiers.map(tier => ({
      condition_type: tier.condition_type,
      condition_params: tier.condition_params,
      price: tier.price,
    })) ?? [],
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(workshop?.image_url ?? null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(workshop?.payment_qr_url ?? null);
  const [saving, setSaving] = useState(false);

  const { response: roomsResponse } = usePromise(() => DansshipAPI.inventoryAdmin.getRooms({ is_active: true }));
  const { response: instructorsResponse } = usePromise(() => DansshipAPI.instructorsAdmin.getInstructors());
  const { response: conditionsResponse } = usePromise(() => DansshipAPI.talleresAdmin.listPriceConditions());
  const { response: rosterResponse, reFetch: reFetchRoster } = usePromise(
    () => DansshipAPI.talleresAdmin.listRoster(workshop?.id ?? ''),
    Boolean(workshop?.id && (workshop.is_collaboration || isCollaboration)),
    [workshop?.id, isCollaboration],
  );
  const { call: lookupCollaborator } = useCallablePromise((email: string) =>
    DansshipAPI.talleresAdmin.lookupCollaborator(email),
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

  const save = async (event: FormEvent) => {
    event.preventDefault();

    if (isCollaboration && collaboratorEmail.trim() && !collaboratorName) {
      toast.error(t('talleres:admin.collaboratorNotFound'));

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
    };

    try {
      if (workshop) {
        const { data, ok } = await DansshipAPI.talleresAdmin.updateWorkshop(workshop.id, {
          ...payload,
          status,
        });

        if (!ok || !data) {
          toast.error(t('talleres:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.talleresAdmin.uploadImage(workshop.id, imageFile);

          if (!upload.data) {
            toast.error(t('talleres:admin.imageUploadFailed'));
          } else {
            setPreviewUrl(upload.data.image_url);
            setImageFile(null);
          }
        }

        if (qrFile) {
          const upload = await DansshipAPI.talleresAdmin.uploadPaymentQr(workshop.id, qrFile);

          if (!upload.data) {
            toast.error(t('talleres:admin.qrUploadFailed'));
          } else {
            setQrPreviewUrl(upload.data.payment_qr_url);
            setQrFile(null);
          }
        }

        toast.success(t('talleres:admin.updateSuccess'));
      } else {
        const { data, ok } = await DansshipAPI.talleresAdmin.createWorkshop(payload);

        if (!ok || !data) {
          toast.error(t('talleres:admin.saveFailed'));

          return;
        }

        if (imageFile) {
          const upload = await DansshipAPI.talleresAdmin.uploadImage(data.id, imageFile);

          if (!upload.data) {
            toast.error(t('talleres:admin.imageUploadFailed'));
          }
        }

        if (qrFile) {
          const upload = await DansshipAPI.talleresAdmin.uploadPaymentQr(data.id, qrFile);

          if (!upload.data) {
            toast.error(t('talleres:admin.qrUploadFailed'));
          }
        }

        toast.success(t('talleres:admin.createSuccess'));
        navigate(PageURLS.admin.tallerEdit(data.id));
      }
    } catch (error) {
      const code = error instanceof DansshipAPIError ? error.body.error_code : '';
      toast.error(
        code === 'AGENDA_ROOM_OCCUPANCY_CONFLICT'
          ? t('talleres:admin.occupancyConflict')
          : t('talleres:admin.saveFailed'),
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
          <Link className='text-sm font-semibold text-primary' to={PageURLS.admin.talleres}>
            {t('talleres:admin.backToList')}
          </Link>
          <div className='flex flex-wrap items-center gap-2.5'>
            <h1 className='m-0 text-2xl font-bold text-foreground'>
              {workshop ? t('talleres:admin.editWorkshop') : t('talleres:admin.newWorkshop')}
            </h1>
            <Badge variant={status === 'published' ? 'default' : 'outline'}>
              {status === 'published' ? t('talleres:admin.published') : t('talleres:admin.draft')}
            </Badge>
          </div>
          {workshop?.name ? <p className='m-0 text-sm text-muted-foreground'>{workshop.name}</p> : null}
        </div>
        <div className='flex flex-wrap items-center gap-2.5'>
          <label className='flex cursor-pointer items-center gap-2 rounded-full border bg-white px-3 py-1.5'>
            <span className='text-sm font-semibold'>
              {status === 'published' ? t('talleres:admin.published') : t('talleres:admin.draft')}
            </span>
            <Switch
              checked={status === 'published'}
              onCheckedChange={checked => setStatus(checked ? 'published' : 'draft')}
              className='data-[state=unchecked]:border-border data-[state=unchecked]:bg-gray-300'
            />
          </label>
          {workshop ? (
            <Button asChild variant='outline'>
              <Link to={`${PageURLS.tallerLanding(workshop.slug)}?preview=1`} target='_blank' rel='noreferrer'>
                {t('talleres:admin.preview')}
              </Link>
            </Button>
          ) : null}
          <Button type='submit' disabled={saving}>
            {saving ? t('talleres:admin.saving') : t('talleres:admin.save')}
          </Button>
        </div>
      </div>

      {locked ? (
        <p className='rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm'>{t('talleres:admin.lockBanner')}</p>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{t('talleres:admin.general')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='grid gap-2'>
            <Label htmlFor='workshop-name'>{t('talleres:admin.name')}</Label>
            <Input id='workshop-name' value={name} onChange={event => setName(event.target.value)} required />
          </div>
          <div className='grid gap-2'>
            <Label htmlFor='workshop-description'>{t('talleres:admin.description')}</Label>
            <Textarea
              id='workshop-description'
              value={description}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
          <div className='grid gap-4 md:grid-cols-4'>
            <div className='grid gap-2'>
              <Label>{t('talleres:admin.date')}</Label>
              <Input
                type='date'
                disabled={locked}
                value={date}
                onChange={event => setDate(event.target.value)}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label>{t('talleres:admin.startTime')}</Label>
              <Input
                type='time'
                disabled={locked}
                value={startTime}
                onChange={event => setStartTime(event.target.value)}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label>{t('talleres:admin.endTime')}</Label>
              <Input
                type='time'
                disabled={locked}
                value={endTime}
                onChange={event => setEndTime(event.target.value)}
                required
              />
            </div>
            <div className='grid gap-2'>
              <Label>{t('talleres:admin.capacity')}</Label>
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
              <Label htmlFor='workshop-room'>{t('talleres:admin.room')}</Label>
              <select
                id='workshop-room'
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
              <Label htmlFor='workshop-instructor'>{t('talleres:admin.instructor')}</Label>
              <select
                id='workshop-instructor'
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
          <CardTitle>{t('talleres:admin.image')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-3'>
          <OptionalFileUpload
            value={imageFile}
            previewUrl={previewUrl}
            acceptedTypes={Object.values(PaymentProofContentType)}
            isUploading={saving}
            helperText={t('talleres:admin.imageHint')}
            onChange={(file, nextPreviewUrl) => {
              setImageFile(file);
              setPreviewUrl(nextPreviewUrl ?? workshop?.image_url ?? null);
            }}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('talleres:admin.collaboration')}</CardTitle>
        </CardHeader>
        <CardContent className='grid gap-4'>
          <div className='flex items-center justify-between gap-4'>
            <span>{t('talleres:admin.isCollaboration')}</span>
            <Switch checked={isCollaboration} onCheckedChange={checked => setIsCollaboration(checked)} />
          </div>
          {isCollaboration ? (
            <>
              <div className='grid gap-2'>
                <Label htmlFor='collaborator-email'>{t('talleres:admin.collaboratorEmail')}</Label>
                <Input
                  id='collaborator-email'
                  type='email'
                  value={collaboratorEmail}
                  onChange={event => setCollaboratorEmail(event.target.value)}
                />
                {collaboratorName ? (
                  <p className='m-0 text-sm text-primary'>{collaboratorName}</p>
                ) : collaboratorError ? (
                  <p className='m-0 text-sm text-destructive'>{t('talleres:admin.collaboratorNotFound')}</p>
                ) : null}
              </div>
              <div className='grid gap-2'>
                <Label htmlFor='participation'>{t('talleres:admin.participation')}</Label>
                <Input
                  id='participation'
                  type='number'
                  min={0}
                  max={100}
                  value={participation}
                  onChange={event => setParticipation(event.target.value)}
                />
                <p className='m-0 text-xs text-muted-foreground'>{t('talleres:admin.participationHint')}</p>
              </div>
              <OptionalFileUpload
                value={qrFile}
                previewUrl={qrPreviewUrl}
                acceptedTypes={Object.values(PaymentProofContentType)}
                isUploading={saving}
                helperText={t('talleres:admin.qrHint')}
                onChange={(file, nextPreviewUrl) => {
                  setQrFile(file);
                  setQrPreviewUrl(nextPreviewUrl ?? workshop?.payment_qr_url ?? null);
                }}
              />
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardContent className='flex items-center justify-between gap-4 pt-6'>
          <span>{t('talleres:admin.requiresPartner')}</span>
          <Switch
            checked={requiresPartner}
            disabled={locked}
            onCheckedChange={checked => setRequiresPartner(checked)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('talleres:admin.priceRules')}</CardTitle>
        </CardHeader>
        <CardContent>
          <PriceTiersEditor
            conditions={conditions}
            tiers={tiers}
            basePrice={basePrice}
            baseLabel={requiresPartner ? t('talleres:admin.basePricePair') : t('talleres:admin.basePrice')}
            locked={locked}
            onChange={setTiers}
            onBasePriceChange={setBasePrice}
          />
        </CardContent>
      </Card>
      {workshop && isCollaboration ? (
        <Card>
          <CardHeader>
            <CardTitle>{t('talleres:admin.roster')}</CardTitle>
          </CardHeader>
          <CardContent className='grid gap-4'>
            <DirectRegistrationForm
              onSubmit={async payload => {
                const { ok } = await DansshipAPI.talleresAdmin.registerDirectly(workshop.id, payload);

                if (ok) {
                  await reFetchRoster();
                }

                return ok;
              }}
            />
            <TallerRoster rows={rosterResponse?.data ?? []} />
          </CardContent>
        </Card>
      ) : null}
    </form>
  );
}
