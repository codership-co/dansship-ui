import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { OptionalFileUpload } from '@components/forms/optional-file-upload';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui';
import { PaymentProofContentType, Room } from '@core/api';

const ROOM_TYPE_OPTIONS = ['pole', 'aerial', 'yoga'] as const;
const EMPTY_OPTION = '__none__';

const roomSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
  room_type: z.string().optional(),
});

type RoomFormValues = z.infer<typeof roomSchema>;

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: RoomFormValues, imageFile?: File | null) => void;
  initialData?: Room | null;
  isLoading?: boolean;
}

export function RoomModal({ isOpen, onClose, onSubmit, initialData, isLoading }: RoomModalProps) {
  const { t } = useTranslation();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RoomFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(roomSchema),
    defaultValues: {
      name: '',
      capacity: 1,
      room_type: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      setImageFile(null);

      if (initialData) {
        reset({
          name: initialData.name,
          capacity: initialData.capacity,
          room_type: initialData.room_type || '',
        });
        setPreviewUrl(initialData.image_url || null);
      } else {
        reset({
          name: '',
          capacity: 1,
          room_type: '',
        });
        setPreviewUrl(null);
      }
    }
  }, [isOpen, initialData, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? t('inventory:rooms.editTitle') : t('inventory:rooms.createTitle')}</DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(values => onSubmit(values as RoomFormValues, imageFile))} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>{t('inventory:rooms.roomName')}</Label>
            <Input id='name' {...register('name')} placeholder={t('inventory:rooms.roomNamePlaceholder')} />
            {errors.name && <p className='text-sm text-alert-500'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='capacity'>{t('inventory:rooms.capacity')}</Label>
            <Input
              id='capacity'
              type='number'
              {...register('capacity')}
              placeholder={t('inventory:rooms.capacityPlaceholder')}
            />
            {errors.capacity && <p className='text-sm text-alert-500'>{errors.capacity.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='room_type'>{t('inventory:rooms.roomTypeOptional')}</Label>
            <Select
              value={watch('room_type') || EMPTY_OPTION}
              onValueChange={val =>
                setValue('room_type', val === EMPTY_OPTION ? '' : val, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('inventory:rooms.selectRoomType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={EMPTY_OPTION}>{t('inventory:rooms.noRoomType')}</SelectItem>
                {ROOM_TYPE_OPTIONS.map(option => (
                  <SelectItem key={option} value={option}>
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.room_type && <p className='text-sm text-alert-500'>{errors.room_type.message}</p>}
          </div>

          <OptionalFileUpload
            value={imageFile}
            previewUrl={previewUrl}
            acceptedTypes={Object.values(PaymentProofContentType)}
            isUploading={isLoading}
            label={t('inventory:rooms.photo')}
            helperText={t('inventory:rooms.photoHint')}
            onChange={(file, nextPreviewUrl) => {
              setImageFile(file);
              setPreviewUrl(nextPreviewUrl);
            }}
          />

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' disabled={isLoading}>
              {isLoading ? t('common:saving') : t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
