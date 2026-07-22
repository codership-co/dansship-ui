import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { RoomModal } from './room-modal';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { Room } from '@core/api';
import { useRooms } from '@hooks';

export function RoomsTab() {
  const { t } = useTranslation();
  const {
    rooms,
    isLoading,
    createRoom,
    updateRoom,
    deleteRoom,
    reactivateRoom,
    isCreating,
    isUpdating,
    isDeleting,
    isReactivating,
  } = useRooms();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [roomToDeactivate, setRoomToDeactivate] = useState<Room | null>(null);

  const handleOpenModal = (room?: Room) => {
    setSelectedRoom(room || null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRoom(null);
  };

  const handleSubmit = async (data: Omit<Room, 'id' | 'is_active' | 'created_at'>, imageFile?: File | null) => {
    if (selectedRoom) {
      await updateRoom(selectedRoom.id, data, imageFile);
    } else {
      await createRoom(data, imageFile);
    }

    handleCloseModal();
  };

  const handleDeactivate = async (room: Room) => {
    setRoomToDeactivate(room);
  };

  const handleConfirmDeactivate = async () => {
    if (!roomToDeactivate) {
      return;
    }

    await deleteRoom(roomToDeactivate.id);
    setRoomToDeactivate(null);
  };

  const handleReactivate = async (id: string) => {
    await reactivateRoom(id);
  };

  if (isLoading) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  const sortedRooms = [...rooms].sort((a, b) => Number(b.is_active) - Number(a.is_active));

  return (
    <div className='space-y-4'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold'>{t('inventory:rooms.title')}</h2>
        <Button onClick={() => handleOpenModal()}>{t('inventory:rooms.addRoom')}</Button>
      </div>

      <div className='border rounded-md'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('inventory:rooms.photo')}</TableHead>
              <TableHead>{t('common:name')}</TableHead>
              <TableHead>{t('inventory:rooms.capacity')}</TableHead>
              <TableHead>{t('common:type')}</TableHead>
              <TableHead>{t('common:status')}</TableHead>
              <TableHead className='text-right'>{t('common:actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rooms.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className='text-center py-4 text-gray-500'>
                  {t('inventory:rooms.empty')}
                </TableCell>
              </TableRow>
            ) : (
              sortedRooms.map(room => (
                <TableRow key={room.id} className={!room.is_active ? 'opacity-60 grayscale blur-[0.5px]' : undefined}>
                  <TableCell>
                    {room.image_url ? (
                      <img src={room.image_url} alt='' className='size-12 rounded object-cover' />
                    ) : (
                      <span className='text-xs text-muted-foreground'>—</span>
                    )}
                  </TableCell>
                  <TableCell className='font-medium'>{room.name}</TableCell>
                  <TableCell>{room.capacity}</TableCell>
                  <TableCell>{room.room_type || '-'}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${room.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-alert-800'}`}
                    >
                      {room.is_active ? t('common:active') : t('common:inactive')}
                    </span>
                  </TableCell>
                  <TableCell className='text-right space-x-2'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() => handleOpenModal(room)}
                      disabled={!room.is_active}
                    >
                      {t('common:edit')}
                    </Button>
                    {room.is_active && (
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeactivate(room)}
                        disabled={isDeleting}
                      >
                        {t('common:deactivate')}
                      </Button>
                    )}
                    {!room.is_active && (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => handleReactivate(room.id)}
                        disabled={isReactivating}
                      >
                        {t('common:reactivate')}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <RoomModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        initialData={selectedRoom}
        isLoading={isCreating || isUpdating}
      />

      <ConfirmDialog
        open={Boolean(roomToDeactivate)}
        onOpenChange={open => {
          if (!open) {
            setRoomToDeactivate(null);
          }
        }}
        onConfirm={handleConfirmDeactivate}
        title={t('inventory:rooms.deactivateTitle')}
        description={
          roomToDeactivate?.name
            ? t('inventory:rooms.deactivateConfirmNamed', { name: roomToDeactivate.name })
            : t('inventory:rooms.deactivateConfirm')
        }
        confirmLabel={t('common:deactivate')}
        confirmVariant='destructive'
        isLoading={isDeleting}
      />
    </div>
  );
}
