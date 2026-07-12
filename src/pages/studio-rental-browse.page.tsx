import { addDays, format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import {
  CreateRentalRequestPayload,
  DansshipAPI,
  GetAvailabilityParams,
  RentalSlotCreate,
  StudioRentalAvailabilitySlot,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { useCallablePromise, usePromise } from '@hooks';

const getDefaultDateRange = () => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = addDays(start, 7);

  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
};

function StudioRentalBrowsePage() {
  const { t } = useTranslation();
  const defaults = getDefaultDateRange();
  const [roomId, setRoomId] = useState('');
  const [startAt, setStartAt] = useState(defaults.startAt.slice(0, 16));
  const [endAt, setEndAt] = useState(defaults.endAt.slice(0, 16));
  const [selectedSlots, setSelectedSlots] = useState<Record<string, StudioRentalAvailabilitySlot>>({});
  const {
    response: rooms,
    isLoading: isLoadingRooms,
    error: roomsError,
  } = usePromise(() => DansshipAPI.studioRental.getRooms());
  const {
    call: getAvailability,
    response: availability,
    isLoading: isLoadingGetAvailability,
    error: getAvailabilityError,
  } = useCallablePromise((payload: GetAvailabilityParams) => DansshipAPI.studioRental.getAvailability(payload));
  const { call: createRental, isLoading: isLoadingCreateRental } = useCallablePromise(
    (payload: CreateRentalRequestPayload) => DansshipAPI.studioRental.createRequest(payload),
  );

  useEffect(() => {
    if (roomId && startAt && endAt) {
      getAvailability({
        room_id: roomId,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
      });
    }
  }, [endAt, getAvailability, roomId, startAt]);

  const selectedList = useMemo(() => Object.values(selectedSlots), [selectedSlots]);
  const selectedRoom = useMemo(
    () => (rooms?.data ?? []).find(room => room.id === roomId) ?? null,
    [rooms?.data, roomId],
  );

  const toggleSlot = (slot: StudioRentalAvailabilitySlot) => {
    const key = `${slot.room_id}:${slot.start_time}:${slot.end_time}`;
    setSelectedSlots(prev => {
      if (prev[key]) {
        const next = { ...prev };
        delete next[key];

        return next;
      }

      return { ...prev, [key]: slot };
    });
  };

  const submitRequest = async () => {
    const slots: Array<RentalSlotCreate> = selectedList.map(slot => ({
      room_id: slot.room_id,
      start_time: slot.start_time,
      end_time: slot.end_time,
      resource_type: 'room',
    }));

    const { error } = await createRental({
      type: 'studio_rental',
      purpose: 'self_practice',
      slots,
    });

    if (error) {
      toast(t('studioRental:toast.requestFailed'));
    } else {
      toast(t('studioRental:toast.requestCreated'));
    }

    setSelectedSlots({});
  };

  return (
    <div className='max-w-6xl mx-auto py-8 px-4 space-y-6 pt-20'>
      <div>
        <h1 className='text-3xl font-bold text-gray-900'>{t('studioRental:browse.title')}</h1>
        <p className='text-gray-500 mt-2'>{t('studioRental:browse.subtitle')}</p>
      </div>

      <div className='bg-white border border-gray-100 rounded-lg shadow-sm p-4 grid gap-4 md:grid-cols-3'>
        <div>
          <label className='text-sm text-gray-600'>{t('studioRental:browse.room')}</label>
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger>
              <SelectValue placeholder={t('studioRental:browse.roomPlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {(rooms?.data ?? []).map(room => (
                <SelectItem key={room.id} value={room.id}>
                  {room.name} {room.room_type ? `(${room.room_type})` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLoadingRooms ? (
            <p className='text-xs text-gray-500 mt-2'>{t('studioRental:browse.roomsLoading')}</p>
          ) : null}
          {rooms?.error || roomsError ? (
            <p className='text-xs text-alert-600 mt-2'>{t('studioRental:browse.roomsLoadError')}</p>
          ) : null}
        </div>
        <div>
          <label className='text-sm text-gray-600'>{t('studioRental:browse.startAt')}</label>
          <Input type='datetime-local' value={startAt} onChange={event => setStartAt(event.target.value)} />
        </div>
        <div>
          <label className='text-sm text-gray-600'>{t('studioRental:browse.endAt')}</label>
          <Input type='datetime-local' value={endAt} onChange={event => setEndAt(event.target.value)} />
        </div>
      </div>

      {selectedRoom ? (
        <div className='bg-slate-50 border border-slate-200 rounded-lg p-4 grid gap-2 md:grid-cols-3 text-sm text-slate-700'>
          <p>
            <span className='font-semibold'>{t('studioRental:browse.selectedRoom')}</span> {selectedRoom.name}
          </p>
          <p>
            <span className='font-semibold'>{t('studioRental:browse.roomType')}</span>{' '}
            {selectedRoom.room_type ?? t('studioRental:browse.notSpecified')}
          </p>
          <p>
            <span className='font-semibold'>{t('studioRental:browse.capacity')}</span> {selectedRoom.capacity}
          </p>
        </div>
      ) : null}

      {!roomId ? (
        <div className='bg-info-50 border border-info-200 rounded-lg p-4 text-sm text-info-800'>
          {t('studioRental:browse.roomHint')}
        </div>
      ) : isLoadingGetAvailability ? (
        <SpinnerLoader message={t('studioRental:browse.loading')} />
      ) : availability?.error || getAvailabilityError ? (
        <div className='bg-alert-50 border border-alert-200 rounded-lg p-4 text-sm text-alert-700'>
          {t('studioRental:browse.loadError')}
        </div>
      ) : (
        <div className='bg-white border border-gray-100 rounded-lg shadow-sm p-4 space-y-3'>
          <div className='flex items-center justify-between'>
            <h2 className='font-semibold text-gray-900'>{t('studioRental:browse.availableSlots')}</h2>
            <span className='text-sm text-gray-500'>
              {t('studioRental:browse.selectedCount', { count: selectedList.length })}
            </span>
          </div>

          {(availability?.data ?? []).length === 0 ? (
            <p className='text-sm text-gray-500'>{t('studioRental:browse.noSlots')}</p>
          ) : (
            <div className='space-y-2'>
              {(availability?.data ?? []).map(slot => {
                const key = `${slot.room_id}:${slot.start_time}:${slot.end_time}`;
                const selected = Boolean(selectedSlots[key]);

                return (
                  <button
                    key={key}
                    type='button'
                    onClick={() => toggleSlot(slot)}
                    className={`w-full text-left border rounded-md px-3 py-2 transition ${selected ? 'border-primary bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className='flex items-center justify-between text-sm'>
                      <span>
                        {format(new Date(slot.start_time), 'EEE, MMM d HH:mm')} -{' '}
                        {format(new Date(slot.end_time), 'HH:mm')}
                      </span>
                      <span className='font-medium'>{slot.base_price}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className='pt-2'>
            <Button onClick={submitRequest} disabled={selectedList.length === 0 || isLoadingCreateRental}>
              {isLoadingCreateRental ? t('studioRental:browse.creating') : t('studioRental:browse.createRequest')}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export const SecureStudioRentalBrowsePage = SecurityGuard(StudioRentalBrowsePage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isStudioRentalBrowsePageEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
