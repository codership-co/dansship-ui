import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import {
  type AdminCancelInternalReservedUsePayload,
  DansshipAPI,
  type InternalReservedUseCreatePayload,
} from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

function toDateTimeLocal(date: Date): string {
  const pad = (value: number) => `${value}`.padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

export function InternalReservedUsePanel() {
  const { t } = useTranslation();
  const now = new Date();
  const startDefault = toDateTimeLocal(now);
  const endDefault = toDateTimeLocal(new Date(now.getTime() + 60 * 60 * 1000));

  const [roomId, setRoomId] = useState('');
  const [startAt, setStartAt] = useState(startDefault);
  const [endAt, setEndAt] = useState(endDefault);

  const { response: rooms } = usePromise(() => DansshipAPI.studioRental.getRooms());
  const { response: internalReservedUses, isLoading: isLoadingInternalReservedUses } = usePromise(() =>
    DansshipAPI.studioRentalAdmin.adminListInternalReservedUses(),
  );

  const { call: createInternalReservedUsePromise, isLoading: isCreatingInternalReservedUse } = useCallablePromise(
    (payload: InternalReservedUseCreatePayload) =>
      DansshipAPI.studioRentalAdmin.adminCreateInternalReservedUse(payload),
  );
  const { call: cancelInternalReservedUsePromise, isLoading: isCancelingInternalReservedUse } = useCallablePromise(
    (id: string, payload?: AdminCancelInternalReservedUsePayload) =>
      DansshipAPI.studioRentalAdmin.adminCancelInternalReservedUse(id, payload),
  );

  const createInternalReservedUse = useCallback(
    async (payload: InternalReservedUseCreatePayload) => {
      const { ok } = await createInternalReservedUsePromise(payload);

      if (ok) {
        toast.success(t('studioRental:toast.reservedUseCreated', { defaultValue: 'Reserved use created' }));
      } else {
        toast.error(t('studioRental:toast.reservedUseCreateFailed', { defaultValue: 'Failed to create reserved use' }));
      }
    },
    [createInternalReservedUsePromise, t],
  );

  const cancelInternalReservedUse = useCallback(
    async (id: string, payload?: AdminCancelInternalReservedUsePayload) => {
      const { ok } = await cancelInternalReservedUsePromise(id, payload);

      if (ok) {
        toast.success(
          t('studioRental:toast.reservedUseCancelled', {
            defaultValue: 'Reserved use cancelled',
          }),
        );
      } else {
        toast.error(t('studioRental:toast.reservedUseCancelFailed', { defaultValue: 'Failed to cancel reserved use' }));
      }
    },
    [cancelInternalReservedUsePromise, t],
  );

  const roomNameById = useMemo(() => {
    const dictionary: Record<string, string> = {};
    (rooms?.data ?? []).forEach(room => {
      dictionary[room.id] = room.name;
    });

    return dictionary;
  }, [rooms?.data]);

  const handleCreate = async () => {
    if (!roomId || !startAt || !endAt) {
      return;
    }

    await createInternalReservedUse({
      slots: [
        {
          room_id: roomId,
          start_time: new Date(startAt).toISOString(),
          end_time: new Date(endAt).toISOString(),
        },
      ],
    });

    setRoomId('');
  };

  return (
    <div className='space-y-4'>
      <div className='rounded-[calc(var(--radius)+4px)] bg-[hsl(var(--surface-container-low))] p-4 shadow-sm'>
        <h3 className='text-primary'>
          {t('studioRental:admin.reservedUse.title', { defaultValue: 'Internal Reserved Use' })}
        </h3>
        <p className='mt-1 text-sm text-muted-foreground'>
          {t('studioRental:admin.reservedUse.subtitle', {
            defaultValue: 'Create private internal room reservations that are confirmed immediately.',
          })}
        </p>

        <div className='mt-4 grid gap-3 md:grid-cols-3'>
          <div>
            <label className='text-xs font-medium uppercase text-muted-foreground'>
              {t('studioRental:admin.rules.room', { defaultValue: 'Room' })}
            </label>
            <Select value={roomId} onValueChange={setRoomId}>
              <SelectTrigger>
                <SelectValue
                  placeholder={t('studioRental:admin.reservedUse.roomPlaceholder', {
                    defaultValue: 'Select room',
                  })}
                />
              </SelectTrigger>
              <SelectContent>
                {(rooms?.data ?? []).map(room => (
                  <SelectItem key={room.id} value={room.id}>
                    {room.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className='text-xs font-medium uppercase text-muted-foreground'>
              {t('studioRental:admin.reservedUse.startAt', { defaultValue: 'Start' })}
            </label>
            <Input type='datetime-local' value={startAt} onChange={event => setStartAt(event.target.value)} />
          </div>

          <div>
            <label className='text-xs font-medium uppercase text-muted-foreground'>
              {t('studioRental:admin.reservedUse.endAt', { defaultValue: 'End' })}
            </label>
            <Input type='datetime-local' value={endAt} onChange={event => setEndAt(event.target.value)} />
          </div>
        </div>

        <div className='mt-4'>
          <Button
            onClick={() => {
              void handleCreate();
            }}
            disabled={!roomId || !startAt || !endAt || isCreatingInternalReservedUse}
          >
            {isCreatingInternalReservedUse
              ? t('studioRental:admin.reservedUse.creating', { defaultValue: 'Creating...' })
              : t('studioRental:admin.reservedUse.create', { defaultValue: 'Create Reserved Use' })}
          </Button>
        </div>
      </div>

      {isLoadingInternalReservedUses ? (
        <SpinnerLoader
          message={t('studioRental:admin.reservedUse.loading', {
            defaultValue: 'Loading reserved uses...',
          })}
        />
      ) : !internalReservedUses?.ok ? (
        <p className='rounded-(--radius) bg-[hsl(var(--error-container))] px-3 py-2 text-sm text-alert'>
          {t('studioRental:admin.reservedUse.loadError', {
            defaultValue: 'Unable to load reserved-use events.',
          })}
        </p>
      ) : (internalReservedUses.data ?? []).length === 0 ? (
        <p className='text-sm text-muted-foreground'>
          {t('studioRental:admin.reservedUse.empty', {
            defaultValue: 'No internal reserved-use events found.',
          })}
        </p>
      ) : (
        <div className='space-y-2'>
          {(internalReservedUses.data ?? []).map(request => {
            const firstSlot = request.slots[0];
            const roomName = firstSlot ? (roomNameById[firstSlot.room_id] ?? firstSlot.room_id) : '-';

            return (
              <div key={request.id} className='rounded-(--radius) bg-secondary-100 px-4 py-3 shadow-sm'>
                <div className='flex flex-col gap-2 md:flex-row md:items-center md:justify-between'>
                  <div>
                    <p className='text-sm font-semibold text-foreground'>#{request.id.slice(0, 8)}</p>
                    <p className='text-xs text-muted-foreground'>
                      {t('studioRental:admin.reservedUse.room', { defaultValue: 'Room' })}: {roomName}
                    </p>
                    <p className='text-xs text-muted-foreground'>
                      {firstSlot
                        ? `${new Date(firstSlot.start_time).toLocaleString()} - ${new Date(firstSlot.end_time).toLocaleString()}`
                        : t('studioRental:admin.reservedUse.noSlots', { defaultValue: 'No slots' })}
                    </p>
                  </div>

                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => {
                      const shouldCancel = window.confirm(
                        t('studioRental:admin.reservedUse.cancelConfirm', {
                          defaultValue: 'Cancel this internal reserved-use request?',
                        }),
                      );

                      if (!shouldCancel) {
                        return;
                      }

                      void cancelInternalReservedUse(request.id);
                    }}
                    disabled={isCancelingInternalReservedUse}
                  >
                    {t('studioRental:admin.reservedUse.cancel', { defaultValue: 'Cancel' })}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
