import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

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
import { ClassDefinition, ClassGroup } from '@core/api';

const CLASS_LEVEL_OPTIONS = ['beginner', 'intermediate', 'advanced'] as const;
const ROOM_TYPE_OPTIONS = ['pole', 'aerial', 'yoga'] as const;
const EMPTY_OPTION = '__none__';

const classSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().min(1, 'Duration must be greater than 0'),
  max_participants: z.coerce.number().min(1, 'Capacity must be at least 1'),
  level: z.string().optional(),
  default_room_type: z.string().optional(),
  class_group_id: z.guid({ error: 'Class group is required' }),
});

type ClassFormValues = z.infer<typeof classSchema>;

interface ClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClassFormValues) => Promise<void>;
  initialData?: ClassDefinition | null;
  classGroups: Array<ClassGroup>;
  isLoading?: boolean;
}

export function ClassModal({ isOpen, onClose, onSubmit, initialData, classGroups, isLoading }: ClassModalProps) {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassFormValues>({
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    resolver: zodResolver(classSchema),
    defaultValues: {
      name: '',
      description: '',
      duration_minutes: 60,
      max_participants: 10,
      level: '',
      default_room_type: '',
      class_group_id: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        reset({
          name: initialData.name,
          description: initialData.description || '',
          duration_minutes: initialData.duration_minutes,
          max_participants: initialData.max_participants,
          level: initialData.level || '',
          default_room_type: initialData.default_room_type || '',
          class_group_id: initialData.class_group_id,
        });
      } else {
        reset({
          name: '',
          description: '',
          duration_minutes: 60,
          max_participants: 10,
          level: '',
          default_room_type: '',
          class_group_id: classGroups[0]?.id ?? '',
        });
      }
    }
  }, [isOpen, initialData, reset, classGroups]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? t('inventory:classes.editTitle') : t('inventory:classes.createTitle')}
          </DialogTitle>
        </DialogHeader>

        {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
        {/* @ts-ignore */}
        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='name'>{t('inventory:classes.className')}</Label>
            <Input id='name' {...register('name')} placeholder={t('inventory:classes.classNamePlaceholder')} />
            {errors.name && <p className='text-sm text-alert-500'>{errors.name.message}</p>}
          </div>

          <div className='space-y-2'>
            <Label htmlFor='description'>{t('inventory:classes.descriptionOptional')}</Label>
            <Input
              id='description'
              {...register('description')}
              placeholder={t('inventory:classes.descriptionPlaceholder')}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='class_group_id'>{t('inventory:classes.classGroup')}</Label>
            <Select
              value={watch('class_group_id') || undefined}
              onValueChange={val =>
                setValue('class_group_id', val, {
                  shouldValidate: true,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t('inventory:classes.selectClassGroup')} />
              </SelectTrigger>
              <SelectContent>
                {classGroups.map(group => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.class_group_id && <p className='text-sm text-alert-500'>{errors.class_group_id.message}</p>}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='duration_minutes'>{t('inventory:classes.duration')}</Label>
              <Input id='duration_minutes' type='number' {...register('duration_minutes')} />
              {errors.duration_minutes && <p className='text-sm text-alert-500'>{errors.duration_minutes.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='max_participants'>{t('inventory:classes.maxParticipants')}</Label>
              <Input id='max_participants' type='number' {...register('max_participants')} />
              {errors.max_participants && <p className='text-sm text-alert-500'>{errors.max_participants.message}</p>}
            </div>
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='level'>{t('inventory:classes.levelOptional')}</Label>
              <Select
                value={watch('level') || EMPTY_OPTION}
                onValueChange={val =>
                  setValue('level', val === EMPTY_OPTION ? '' : val, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory:classes.selectLevel')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_OPTION}>{t('inventory:classes.noLevel')}</SelectItem>
                  {CLASS_LEVEL_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='default_room_type'>{t('inventory:classes.defaultRoomType')}</Label>
              <Select
                value={watch('default_room_type') || EMPTY_OPTION}
                onValueChange={val =>
                  setValue('default_room_type', val === EMPTY_OPTION ? '' : val, {
                    shouldValidate: true,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('inventory:classes.selectRoomType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY_OPTION}>{t('inventory:classes.noRoomType')}</SelectItem>
                  {ROOM_TYPE_OPTIONS.map(option => (
                    <SelectItem key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex justify-end space-x-2 pt-4'>
            <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
              {t('common:cancel')}
            </Button>
            <Button type='submit' disabled={isLoading || classGroups.length === 0}>
              {isLoading ? t('common:saving') : t('common:save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
