import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { DansshipAPI, DayOfWeek, type RoomAvailabilityBlockCreatePayload } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

const DAY_OPTIONS: Array<DayOfWeek> = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export function AvailabilityBlocksPanel() {
  const { t } = useTranslation();
  const [roomId, setRoomId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>('monday');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [notes, setNotes] = useState('');

  const { response: rooms, isLoading: isLoadingRooms } = usePromise(() => DansshipAPI.studioRental.getRooms());
  const {
    response: blocks,
    isLoading: isLoadingBlocks,
    reFetch: refetchBlocks,
  } = usePromise(() => DansshipAPI.studioRentalAdmin.listAvailabilityBlocks({ room_id: roomId }), Boolean(roomId), [
    roomId,
  ]);

  const { call: createBlockPromise, isLoading: isCreating } = useCallablePromise(
    (payload: RoomAvailabilityBlockCreatePayload) => DansshipAPI.studioRentalAdmin.createAvailabilityBlock(payload),
  );
  const { call: deleteBlockPromise, isLoading: isDeleting } = useCallablePromise((id: string) =>
    DansshipAPI.studioRentalAdmin.deleteAvailabilityBlock(id),
  );

  const createBlock = useCallback(async () => {
    if (!roomId) {
      return;
    }

    const { ok } = await createBlockPromise({
      room_id: roomId,
      day_of_week: dayOfWeek,
      start_time: `${startTime}:00`,
      end_time: `${endTime}:00`,
      is_active: true,
      notes: notes.trim() || null,
    });

    if (ok) {
      toast.success(t('studioRental:toast.blockCreated'));
      setNotes('');
      await refetchBlocks();
    } else {
      toast.error(t('studioRental:toast.blockCreateFailed'));
    }
  }, [createBlockPromise, dayOfWeek, endTime, notes, refetchBlocks, roomId, startTime, t]);

  const deleteBlock = useCallback(
    async (id: string) => {
      const { ok } = await deleteBlockPromise(id);

      if (ok) {
        toast.success(t('studioRental:toast.blockDeleted'));
        await refetchBlocks();
      } else {
        toast.error(t('studioRental:toast.blockDeleteFailed'));
      }
    },
    [deleteBlockPromise, refetchBlocks, t],
  );

  return (
    <div className='space-y-4'>
      <div className='grid gap-3 md:grid-cols-2 lg:grid-cols-4'>
        <div>
          <Label>{t('studioRental:admin.blocks.room')}</Label>
          <Select value={roomId} onValueChange={setRoomId}>
            <SelectTrigger>
              <SelectValue placeholder={t('studioRental:admin.blocks.roomPlaceholder')} />
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
            <p className='mt-2 text-xs text-muted-foreground'>{t('studioRental:admin.blocks.roomsLoading')}</p>
          ) : null}
        </div>
        <div>
          <Label>{t('studioRental:admin.blocks.dayOfWeek')}</Label>
          <Select value={dayOfWeek} onValueChange={value => setDayOfWeek(value as DayOfWeek)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAY_OPTIONS.map(day => (
                <SelectItem key={day} value={day}>
                  {t(`common:days.${day}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{t('studioRental:admin.blocks.startTime')}</Label>
          <Input type='time' value={startTime} onChange={event => setStartTime(event.target.value)} />
        </div>
        <div>
          <Label>{t('studioRental:admin.blocks.endTime')}</Label>
          <Input type='time' value={endTime} onChange={event => setEndTime(event.target.value)} />
        </div>
      </div>

      <div className='grid gap-3 md:grid-cols-[1fr_auto]'>
        <div>
          <Label>{t('studioRental:admin.blocks.notes')}</Label>
          <Input value={notes} onChange={event => setNotes(event.target.value)} />
        </div>
        <div className='flex items-end'>
          <Button type='button' disabled={!roomId || isCreating} onClick={() => void createBlock()}>
            {t('studioRental:admin.blocks.add')}
          </Button>
        </div>
      </div>

      {!roomId ? (
        <p className='text-sm text-muted-foreground'>{t('studioRental:admin.blocks.selectRoom')}</p>
      ) : isLoadingBlocks ? (
        <SpinnerLoader message={t('studioRental:admin.blocks.loading')} />
      ) : !blocks?.ok ? (
        <p className='text-sm text-alert'>{t('studioRental:admin.blocks.loadError')}</p>
      ) : (blocks.data ?? []).length === 0 ? (
        <p className='text-sm text-muted-foreground'>{t('studioRental:admin.blocks.empty')}</p>
      ) : (
        <div className='space-y-2'>
          {(blocks.data ?? []).map(block => (
            <div
              key={block.id}
              className='flex flex-col gap-2 rounded-(--radius) bg-[hsl(var(--surface-container-highest))] p-3 text-sm md:flex-row md:items-center md:justify-between'
            >
              <div>
                <p>
                  {t(`common:days.${block.day_of_week}`)} · {block.start_time.slice(0, 5)} –{' '}
                  {block.end_time.slice(0, 5)}
                </p>
                <p className='text-muted-foreground'>
                  {block.is_active ? t('studioRental:admin.blocks.active') : t('studioRental:admin.blocks.inactive')}
                  {block.notes ? ` · ${block.notes}` : ''}
                </p>
              </div>
              <Button
                type='button'
                size='sm'
                variant='outline'
                disabled={isDeleting}
                onClick={() => void deleteBlock(block.id)}
              >
                {t('studioRental:admin.blocks.delete')}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
