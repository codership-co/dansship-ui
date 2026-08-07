import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { DansshipAPI, RoomResourceType } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

const RESOURCE_TYPES: Array<RoomResourceType> = ['pole', 'lyra', 'aerial_fabric', 'pendular_pole'];

type ResourceDraft = {
  label: string;
  hourly_rental_price: string;
  tax_type_id: string;
  resource_type: RoomResourceType;
};

type NewResourceDraft = {
  resource_type: RoomResourceType;
  label: string;
  hourly_rental_price: string;
  tax_type_id: string;
};

const emptyNewDraft = (taxTypeId = ''): NewResourceDraft => ({
  resource_type: 'pole',
  label: '',
  hourly_rental_price: '',
  tax_type_id: taxTypeId,
});

export function RentalPricingPanel() {
  const { t } = useTranslation();
  const [roomId, setRoomId] = useState('');
  const [hourlyPrice, setHourlyPrice] = useState('');
  const [taxTypeId, setTaxTypeId] = useState('');
  const [resourceDrafts, setResourceDrafts] = useState<Record<string, ResourceDraft>>({});
  const [newResource, setNewResource] = useState<NewResourceDraft>(emptyNewDraft());

  const {
    response: rooms,
    isLoading: isLoadingRooms,
    reFetch: refetchRooms,
  } = usePromise(() => DansshipAPI.studioRental.getRooms());
  const { response: taxTypes, isLoading: isLoadingTaxTypes } = usePromise(() => DansshipAPI.billingAdmin.getTaxTypes());

  const selectedRoom = useMemo(
    () => (rooms?.data ?? []).find(room => room.id === roomId) ?? null,
    [rooms?.data, roomId],
  );

  const resourcesByType = useMemo(() => {
    const groups: Partial<Record<RoomResourceType, NonNullable<typeof selectedRoom>['resources']>> = {};
    (selectedRoom?.resources ?? []).forEach(resource => {
      const list = groups[resource.resource_type] ?? [];
      list.push(resource);
      groups[resource.resource_type] = list;
    });

    return groups;
  }, [selectedRoom]);

  useEffect(() => {
    if (!selectedRoom) {
      setHourlyPrice('');
      setTaxTypeId('');
      setResourceDrafts({});
      setNewResource(emptyNewDraft());

      return;
    }

    setHourlyPrice(selectedRoom.hourly_rental_price ?? '');
    setTaxTypeId(selectedRoom.tax_type_id ?? '');
    const drafts: Record<string, ResourceDraft> = {};
    (selectedRoom.resources ?? []).forEach(resource => {
      drafts[resource.id] = {
        label: resource.label ?? '',
        hourly_rental_price: resource.hourly_rental_price,
        tax_type_id: resource.tax_type_id,
        resource_type: resource.resource_type,
      };
    });
    setResourceDrafts(drafts);
    setNewResource(emptyNewDraft(selectedRoom.tax_type_id ?? ''));
  }, [selectedRoom]);

  const roomPricingConfigured = Boolean(
    selectedRoom?.hourly_rental_price && Number(selectedRoom.hourly_rental_price) > 0 && selectedRoom.tax_type_id,
  );

  const { call: updateRoomPromise, isLoading: isSaving } = useCallablePromise(
    (id: string, payload: { hourly_rental_price: string; tax_type_id: string }) =>
      DansshipAPI.inventoryAdmin.updateRoom(id, payload),
  );

  const { call: createResourcePromise, isLoading: isCreating } = useCallablePromise(
    (id: string, payload: NewResourceDraft) =>
      DansshipAPI.studioRentalAdmin.createRoomResource(id, {
        resource_type: payload.resource_type,
        label: payload.label.trim() || null,
        hourly_rental_price: payload.hourly_rental_price,
        tax_type_id: payload.tax_type_id,
      }),
  );

  const { call: updateResourcePromise, isLoading: isSavingResource } = useCallablePromise(
    (id: string, payload: ResourceDraft) =>
      DansshipAPI.studioRentalAdmin.updateRoomResource(id, {
        resource_type: payload.resource_type,
        label: payload.label.trim() || null,
        hourly_rental_price: payload.hourly_rental_price,
        tax_type_id: payload.tax_type_id,
      }),
  );

  const { call: deleteResourcePromise, isLoading: isDeleting } = useCallablePromise((id: string) =>
    DansshipAPI.studioRentalAdmin.deleteRoomResource(id),
  );

  const saveRoomPricing = useCallback(async () => {
    if (!roomId || !hourlyPrice || !taxTypeId) {
      return;
    }

    if (Number(hourlyPrice) <= 0) {
      toast.error(t('studioRental:toast.pricingMustBePositive'));

      return;
    }

    const { ok } = await updateRoomPromise(roomId, {
      hourly_rental_price: hourlyPrice,
      tax_type_id: taxTypeId,
    });

    if (ok) {
      toast.success(t('studioRental:toast.pricingUpdated'));
      await refetchRooms();
    } else {
      toast.error(t('studioRental:toast.pricingUpdateFailed'));
    }
  }, [hourlyPrice, refetchRooms, roomId, t, taxTypeId, updateRoomPromise]);

  const saveResource = useCallback(
    async (resourceId: string) => {
      const draft = resourceDrafts[resourceId];

      if (!draft?.hourly_rental_price || !draft.tax_type_id) {
        return;
      }

      const { ok } = await updateResourcePromise(resourceId, draft);

      if (ok) {
        toast.success(t('studioRental:toast.resourceUpdated'));
        await refetchRooms();
      } else {
        toast.error(t('studioRental:toast.resourceUpdateFailed'));
      }
    },
    [refetchRooms, resourceDrafts, t, updateResourcePromise],
  );

  const addResource = useCallback(async () => {
    if (!roomId || !newResource.hourly_rental_price || !newResource.tax_type_id) {
      return;
    }

    const { ok } = await createResourcePromise(roomId, newResource);

    if (ok) {
      toast.success(t('studioRental:toast.resourceCreated'));
      await refetchRooms();
    } else {
      toast.error(t('studioRental:toast.resourceCreateFailed'));
    }
  }, [createResourcePromise, newResource, refetchRooms, roomId, t]);

  const removeResource = useCallback(
    async (resourceId: string) => {
      const { ok } = await deleteResourcePromise(resourceId);

      if (ok) {
        toast.success(t('studioRental:toast.resourceDeleted'));
        await refetchRooms();
      } else {
        toast.error(t('studioRental:toast.resourceDeleteFailed'));
      }
    },
    [deleteResourcePromise, refetchRooms, t],
  );

  const resourceTypeLabel = (type: RoomResourceType) => t(`studioRental:resourceTypes.${type}`);

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-3'>
        <div>
          <Label>{t('studioRental:admin.pricing.room')}</Label>
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger>
              <SelectValue placeholder={t('studioRental:admin.pricing.roomPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {(rooms?.data ?? []).map(room => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoadingRooms ? (
            <p className='mt-2 text-xs text-muted-foreground'>{t('studioRental:admin.pricing.roomsLoading')}</p>
          ) : null}
        </div>
        <div>
          <Label>{t('studioRental:admin.pricing.hourlyPrice')}</Label>
          <Input
            type='number'
            min={0}
            step='0.01'
            value={hourlyPrice}
            onChange={event => setHourlyPrice(event.target.value)}
            disabled={!roomId}
          />
        </div>
        <div>
          <Label>{t('studioRental:admin.pricing.taxType')}</Label>
          <Select value={taxTypeId} onValueChange={setTaxTypeId} disabled={!roomId}>
            <SelectTrigger>
              <SelectValue placeholder={t('studioRental:admin.pricing.taxPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {(taxTypes?.data ?? []).map(tax => (
                <SelectItem key={tax.id} value={tax.id}>
                  {tax.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoadingTaxTypes ? (
            <p className='mt-2 text-xs text-muted-foreground'>{t('studioRental:admin.pricing.taxLoading')}</p>
          ) : null}
        </div>
      </div>

      <Button
        type='button'
        disabled={!roomId || !hourlyPrice || !taxTypeId || isSaving}
        onClick={() => void saveRoomPricing()}
      >
        {t('studioRental:admin.pricing.save')}
      </Button>

      {selectedRoom ? (
        <div className='space-y-4'>
          {!roomPricingConfigured ? (
            <p className='rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-3 text-sm text-muted-foreground'>
              {t('studioRental:admin.pricing.roomPriceRequired')}
            </p>
          ) : null}

          <h3 className='text-sm font-semibold text-foreground'>{t('studioRental:admin.pricing.resources')}</h3>

          {(selectedRoom.resources ?? []).length === 0 ? (
            <p className='text-sm text-muted-foreground'>{t('studioRental:admin.pricing.noResources')}</p>
          ) : (
            RESOURCE_TYPES.map(type => {
              const items = resourcesByType[type] ?? [];

              if (items.length === 0) {
                return null;
              }

              return (
                <div key={type} className='space-y-2'>
                  <h4 className='text-xs font-medium uppercase tracking-[0.05em] text-muted-foreground'>
                    {resourceTypeLabel(type)}
                  </h4>
                  {items.map(resource => {
                    const draft = resourceDrafts[resource.id] ?? {
                      label: resource.label ?? '',
                      hourly_rental_price: resource.hourly_rental_price,
                      tax_type_id: resource.tax_type_id,
                      resource_type: resource.resource_type,
                    };

                    return (
                      <div
                        key={resource.id}
                        className='space-y-2 rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-3 text-sm'
                      >
                        <p>
                          {resource.label?.trim()
                            ? resource.label
                            : t('studioRental:browse.resourceFallback', {
                                type: resourceTypeLabel(resource.resource_type),
                                position: resource.position,
                              })}
                          {!resource.is_active ? ` · ${t('studioRental:admin.pricing.inactive')}` : ''}
                        </p>
                        <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-4'>
                          <Select
                            value={draft.resource_type}
                            onValueChange={value =>
                              setResourceDrafts(prev => ({
                                ...prev,
                                [resource.id]: {
                                  ...draft,
                                  resource_type: value as RoomResourceType,
                                },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOURCE_TYPES.map(option => (
                                <SelectItem key={option} value={option}>
                                  {resourceTypeLabel(option)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder={t('studioRental:admin.pricing.labelPlaceholder')}
                            value={draft.label}
                            onChange={event =>
                              setResourceDrafts(prev => ({
                                ...prev,
                                [resource.id]: {
                                  ...draft,
                                  label: event.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            type='number'
                            min={0}
                            step='0.01'
                            value={draft.hourly_rental_price}
                            onChange={event =>
                              setResourceDrafts(prev => ({
                                ...prev,
                                [resource.id]: {
                                  ...draft,
                                  hourly_rental_price: event.target.value,
                                },
                              }))
                            }
                          />
                          <Select
                            value={draft.tax_type_id}
                            onValueChange={value =>
                              setResourceDrafts(prev => ({
                                ...prev,
                                [resource.id]: {
                                  ...draft,
                                  tax_type_id: value,
                                },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(taxTypes?.data ?? []).map(tax => (
                                <SelectItem key={tax.id} value={tax.id}>
                                  {tax.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                          <Button
                            type='button'
                            variant='secondary'
                            disabled={isSavingResource}
                            onClick={() => void saveResource(resource.id)}
                          >
                            {t('studioRental:admin.pricing.saveResource')}
                          </Button>
                          <Button
                            type='button'
                            variant='outline'
                            disabled={isDeleting}
                            onClick={() => void removeResource(resource.id)}
                          >
                            {t('studioRental:admin.pricing.removeResource')}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}

          <div className='space-y-2 rounded-(--radius) border border-dashed border-border p-3'>
            <h4 className='text-sm font-medium text-foreground'>{t('studioRental:admin.pricing.addResource')}</h4>
            <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-4'>
              <Select
                value={newResource.resource_type}
                onValueChange={value =>
                  setNewResource(prev => ({
                    ...prev,
                    resource_type: value as RoomResourceType,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map(option => (
                    <SelectItem key={option} value={option}>
                      {resourceTypeLabel(option)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={t('studioRental:admin.pricing.labelPlaceholder')}
                value={newResource.label}
                onChange={event => setNewResource(prev => ({ ...prev, label: event.target.value }))}
              />
              <Input
                type='number'
                min={0}
                step='0.01'
                placeholder={t('studioRental:admin.pricing.hourlyPrice')}
                value={newResource.hourly_rental_price}
                onChange={event =>
                  setNewResource(prev => ({
                    ...prev,
                    hourly_rental_price: event.target.value,
                  }))
                }
              />
              <Select
                value={newResource.tax_type_id}
                onValueChange={value => setNewResource(prev => ({ ...prev, tax_type_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('studioRental:admin.pricing.taxPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {(taxTypes?.data ?? []).map(tax => (
                    <SelectItem key={tax.id} value={tax.id}>
                      {tax.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type='button'
              disabled={!newResource.hourly_rental_price || !newResource.tax_type_id || isCreating}
              onClick={() => void addResource()}
            >
              {t('studioRental:admin.pricing.addResource')}
            </Button>
          </div>
        </div>
      ) : isLoadingRooms ? (
        <SpinnerLoader message={t('studioRental:admin.pricing.loading')} />
      ) : (
        <p className='text-sm text-muted-foreground'>{t('studioRental:admin.pricing.selectRoom')}</p>
      )}
    </div>
  );
}
