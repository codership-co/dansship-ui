import { zodResolver } from '@hookform/resolvers/zod';
import { addMinutes, format, parseISO, isValid } from 'date-fns';
import { useEffect, useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { LuCircleCheck, LuOctagonAlert, LuLoaderCircle } from 'react-icons/lu';
import { z } from 'zod';

import { ConfirmDialog } from '@components/modals';
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
import { ScheduledClass, AdminInstructorListItem, Room, ClassDefinition, DansshipAPI } from '@core/api';
import { usePromise } from '@hooks';

const TIME_OPTIONS = Array.from({ length: 24 * 4 }, (_, idx) => {
  const hours = Math.floor(idx / 4)
    .toString()
    .padStart(2, '0');
  const minutes = ((idx % 4) * 15).toString().padStart(2, '0');

  return `${hours}:${minutes}`;
});

const getOneHourAfter = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number);
  const dateObj = new Date();
  dateObj.setHours(hours, minutes, 0, 0);

  return format(addMinutes(dateObj, 60), 'HH:mm');
};

const classSlotSchema = z
  .object({
    class_definition_id: z.string().min(1, 'Select a class'),
    room_id: z.string().min(1, 'Select a room'),
    instructor_id: z.string().min(1, 'Select an instructor'),
    date: z.string().min(1, 'Date is required'),
    start_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM required'),
    end_time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:MM required'),
    capacity: z.preprocess(
      value => (value === '' || value === null || value === undefined ? undefined : Number(value)),
      z.number().int().min(1, 'Capacity must be at least 1').optional(),
    ),
    waitlist_max_size: z.preprocess(
      value => (value === '' || value === null ? undefined : Number(value)),
      z.number().int().min(1, 'Waitlist max size must be at least 1').optional(),
    ),
  })
  .refine(
    data => {
      return data.start_time < data.end_time;
    },
    {
      message: 'End time must be after start time',
      path: ['end_time'],
    },
  );

type ClassSlotFormValues = z.infer<typeof classSlotSchema>;

interface ClassSlotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ClassSlotFormValues) => Promise<void> | void;
  onDelete?: () => Promise<void> | void;
  initialData?: ScheduledClass | null;
  // Options
  rooms: Array<Room>;
  classes: Array<ClassDefinition>;
  instructors: Array<AdminInstructorListItem>;
  defaultDate?: string;
  defaultTime?: string;
  waitlistDefaultMaxSize?: number | null;
  isLoading?: boolean;
  isDeleting?: boolean;
  submitError?: string | null;
  /** When true, the modal restricts edits to room, instructor, and capacity only */
  isPublishedEdit?: boolean;
}

export function ClassSlotModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  rooms,
  classes,
  instructors,
  defaultDate,
  defaultTime,
  waitlistDefaultMaxSize,
  isLoading,
  onDelete,
  isDeleting,
  submitError,
  isPublishedEdit = false,
}: ClassSlotModalProps) {
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClassSlotFormValues>({
    resolver: zodResolver(classSlotSchema) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    defaultValues: {
      class_definition_id: '',
      room_id: '',
      instructor_id: '',
      date: defaultDate || '',
      start_time: defaultTime || '09:00',
      end_time: getOneHourAfter(defaultTime || '09:00'),
      waitlist_max_size: undefined,
    },
  });

  const watchClassDefId = watch('class_definition_id');
  const watchStartTime = watch('start_time');
  const watchEndTime = watch('end_time');
  const watchDate = watch('date');
  const watchInstructorId = watch('instructor_id');
  const watchRoomId = watch('room_id');
  const watchCapacity = watch('capacity');
  const selectedClassDefinition = classes.find(cls => cls.id === watchClassDefId);
  const selectedRoom = rooms.find(room => room.id === watchRoomId);

  const effectiveCapacity = useMemo(() => {
    if (typeof watchCapacity === 'number' && !Number.isNaN(watchCapacity)) {
      return watchCapacity;
    }

    return selectedClassDefinition?.max_participants ?? null;
  }, [watchCapacity, selectedClassDefinition]);

  const selectedDateStr = watchDate || defaultDate;
  const isDateValid = selectedDateStr && isValid(parseISO(selectedDateStr));

  const { response: availabilityData, isLoading: isLoadingAvailability } = usePromise(
    () => DansshipAPI.instructorsAdmin.getAdminAvailability(watchInstructorId),
    Boolean(watchInstructorId),
    [watchInstructorId],
  );

  const availabilityStatus = useMemo(() => {
    if (!availabilityData?.data || !isDateValid || !watchStartTime || !watchEndTime) return null;

    let dayOfWeek = parseISO(selectedDateStr).getDay() - 1;

    if (dayOfWeek === -1) dayOfWeek = 6;

    const daySlots = availabilityData.data.slots.filter(s => s.day_of_week === dayOfWeek);

    if (daySlots.length === 0)
      return {
        isAvailable: false,
        message: t('instructor:availability.noAvailabilityForDay', {
          defaultValue: 'Instructor has no availability on this day',
        }),
      };

    const formatTime = (t: string) => t.substring(0, 5);

    const isAvailable = daySlots.some(slot => {
      return formatTime(slot.start_time) <= watchStartTime && formatTime(slot.end_time) >= watchEndTime;
    });

    if (isAvailable) {
      return {
        isAvailable: true,
        message: t('instructor:availability.available', { defaultValue: 'Instructor is available' }),
      };
    }

    return {
      isAvailable: false,
      message: t('instructor:availability.notAvailableTime', {
        defaultValue: 'Instructor not available at this time. Availability: {{slots}}',
        slots: daySlots.map(s => `${formatTime(s.start_time)} - ${formatTime(s.end_time)}`).join(', '),
      }),
    };
  }, [availabilityData, isDateValid, selectedDateStr, watchStartTime, watchEndTime, t]);

  // Auto-calculate end time when a class definition is selected based on duration
  useEffect(() => {
    if (watchClassDefId && watchStartTime) {
      const selectedDef = classes.find(c => c.id === watchClassDefId);

      if (selectedDef) {
        // Simple time math
        const [hours, minutes] = watchStartTime.split(':').map(Number);
        const dateObj = new Date();
        dateObj.setHours(hours, minutes, 0, 0);
        const endDate = addMinutes(dateObj, selectedDef.duration_minutes);
        setValue('end_time', format(endDate, 'HH:mm'), { shouldValidate: true });

        // Auto-select room if default exists
        if (selectedDef.default_room_type) {
          const matchRoom = rooms.find(
            r => r.room_type?.toLowerCase() === selectedDef.default_room_type?.toLowerCase(),
          );

          if (matchRoom) setValue('room_id', matchRoom.id);
        }
      }
    }
  }, [watchClassDefId, watchStartTime, classes, rooms, setValue]);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // parse the ISO strings back into local dates and times for the form
        const localStartDate = new Date(initialData.start_time);
        const localEndDate = new Date(initialData.end_time);

        reset({
          class_definition_id: initialData.class_definition_id,
          room_id: initialData.room_id,
          instructor_id: initialData.instructor_id,
          date: format(localStartDate, 'yyyy-MM-dd'),
          start_time: format(localStartDate, 'HH:mm'),
          end_time: format(localEndDate, 'HH:mm'),
          capacity: initialData.capacity,
          waitlist_max_size: initialData.waitlist_max_size ?? undefined,
        });
      } else {
        reset({
          class_definition_id: '',
          room_id: '',
          instructor_id: '',
          date: defaultDate || '',
          start_time: defaultTime || '09:00',
          end_time: getOneHourAfter(defaultTime || '09:00'),
          capacity: undefined,
          waitlist_max_size: undefined,
        });
      }
    }
  }, [isOpen, initialData, defaultDate, defaultTime, reset]);

  useEffect(() => {
    if (!isOpen) {
      setIsDeleteConfirmOpen(false);
    }
  }, [isOpen]);

  const isBusy = Boolean(isLoading || isDeleting);

  const handleDelete = async () => {
    if (!onDelete) return;

    await onDelete();
    setIsDeleteConfirmOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {isPublishedEdit
              ? t('schedules:editPublishedClass')
              : initialData
                ? t('schedules:editClass')
                : t('schedules:scheduleNewClass')}
          </DialogTitle>
        </DialogHeader>

        {isPublishedEdit && (
          <div className='rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800'>
            {t('schedules:publishedEditInfo')}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div className='space-y-2'>
            <Label>{t('schedules:class')}</Label>
            <Select
              value={watchClassDefId}
              onValueChange={val => setValue('class_definition_id', val, { shouldValidate: true })}
              disabled={isPublishedEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('schedules:selectClassCatalog')} />
              </SelectTrigger>
              <SelectContent>
                {classes
                  .filter(c => c.is_active)
                  .map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name} ({c.duration_minutes}m • {c.max_participants})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            {errors.class_definition_id && (
              <p className='text-sm text-alert-500'>{errors.class_definition_id.message}</p>
            )}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>{t('schedules:room')}</Label>
              <Select
                value={watch('room_id')}
                onValueChange={val => setValue('room_id', val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('schedules:selectRoom')} />
                </SelectTrigger>
                <SelectContent>
                  {rooms
                    .filter(r => r.is_active)
                    .map(r => (
                      <SelectItem key={r.id} value={r.id}>
                        {r.name} ({r.room_type ? `${r.room_type} • ` : ''}Max {r.capacity})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {errors.room_id && <p className='text-sm text-alert-500'>{errors.room_id.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label>{t('schedules:instructor')}</Label>
              <Select
                value={watchInstructorId}
                onValueChange={val => setValue('instructor_id', val, { shouldValidate: true })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('schedules:selectInstructor')} />
                </SelectTrigger>
                <SelectContent>
                  {instructors
                    .filter(i => i.id !== null)
                    .map(i => (
                      <SelectItem key={i.id} value={i.id ?? ''}>
                        {i.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {watchInstructorId && isLoadingAvailability && (
                <div className='flex items-center text-xs text-muted-foreground mt-1'>
                  <LuLoaderCircle className='w-3 h-3 mr-1 animate-spin' />
                  {t('instructor:availability.checking', 'Checking availability...')}
                </div>
              )}

              {watchInstructorId && !isLoadingAvailability && availabilityStatus && (
                <div
                  className={`flex items-start text-xs mt-1 ${availabilityStatus.isAvailable ? 'text-green-600' : 'text-amber-600'}`}
                >
                  {availabilityStatus.isAvailable ? (
                    <LuCircleCheck className='w-3 h-3 mr-1 shrink-0 mt-0.5' />
                  ) : (
                    <LuOctagonAlert className='w-3 h-3 mr-1 shrink-0 mt-0.5' />
                  )}
                  <span>{availabilityStatus.message}</span>
                </div>
              )}

              {errors.instructor_id && <p className='text-sm text-alert-500'>{errors.instructor_id.message}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='date'>{t('common:date')}</Label>
            <Input id='date' type='date' {...register('date')} disabled={isPublishedEdit} />
            {errors.date && <p className='text-sm text-alert-500'>{errors.date.message}</p>}
          </div>

          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label>{t('schedules:startTime')}</Label>
              <Select
                value={watch('start_time')}
                onValueChange={val => setValue('start_time', val, { shouldValidate: true })}
                disabled={isPublishedEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('schedules:selectStartTime')} />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.start_time && <p className='text-sm text-alert-500'>{errors.start_time.message}</p>}
            </div>

            <div className='space-y-2'>
              <Label>{t('schedules:endTime')}</Label>
              <Select
                value={watch('end_time')}
                onValueChange={val => setValue('end_time', val, { shouldValidate: true })}
                disabled={isPublishedEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('schedules:selectEndTime')} />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map(time => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.end_time && <p className='text-sm text-alert-500'>{errors.end_time.message}</p>}
            </div>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='capacity'>{t('schedules:capacityOverride')}</Label>

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>{t('schedules:classCapacity')}</p>
                <Input
                  id='class_capacity_display'
                  type='number'
                  value={selectedClassDefinition?.max_participants ?? ''}
                  readOnly
                  disabled
                  placeholder={t('schedules:selectClassForCapacity')}
                />
              </div>

              <div className='space-y-1'>
                <p className='text-xs text-muted-foreground'>{t('schedules:roomCapacity')}</p>
                <Input
                  id='room_capacity_display'
                  type='number'
                  value={selectedRoom?.capacity ?? ''}
                  readOnly
                  disabled
                  placeholder='—'
                />
              </div>
            </div>

            <Input
              id='capacity'
              type='number'
              min={1}
              placeholder={t('schedules:leaveBlankDefault')}
              {...register('capacity')}
            />
            {errors.capacity && <p className='text-sm text-alert-500'>{errors.capacity.message}</p>}

            <div className='rounded-md border border-border bg-muted/40 px-3 py-2 text-sm'>
              <span className='font-medium'>{t('schedules:effectiveCapacity')}: </span>
              <span>{effectiveCapacity ?? '—'}</span>
            </div>

            <p className='text-xs text-gray-500'>
              {selectedClassDefinition
                ? t('schedules:capacityDefaultHelp', { max: selectedClassDefinition.max_participants })
                : t('schedules:capacityDefaultHelpGeneric')}
            </p>
            <p className='text-xs text-gray-500'>{t('schedules:capacityEffectiveHelp')}</p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='waitlist_max_size'>{t('schedules:waitlistMaxSize')}</Label>
            <Input
              id='waitlist_max_size'
              type='number'
              min={1}
              placeholder={t('schedules:leaveBlankStudioDefault')}
              {...register('waitlist_max_size')}
            />
            {errors.waitlist_max_size && <p className='text-sm text-alert-500'>{errors.waitlist_max_size.message}</p>}
            <p className='text-xs text-gray-500'>
              {typeof waitlistDefaultMaxSize === 'number'
                ? t('schedules:waitlistDefaultHelp', { size: waitlistDefaultMaxSize })
                : t('schedules:waitlistDefaultHelpNoLimit')}
            </p>
          </div>

          {submitError && (
            <div className='rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {submitError}
            </div>
          )}

          <div className='flex justify-between items-center pt-4'>
            {initialData ? (
              <Button
                type='button'
                variant='destructive'
                onClick={() => setIsDeleteConfirmOpen(true)}
                disabled={isBusy}
              >
                {isPublishedEdit ? t('schedules:cancelClass') : t('schedules:deleteClass')}
              </Button>
            ) : (
              <span />
            )}

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={onClose} disabled={isBusy}>
                {t('common:cancel')}
              </Button>
              <Button type='submit' disabled={isBusy}>
                {isLoading ? t('common:saving') : t('schedules:saveClass')}
              </Button>
            </div>
          </div>
        </form>

        <ConfirmDialog
          open={isDeleteConfirmOpen}
          onOpenChange={setIsDeleteConfirmOpen}
          onConfirm={() => {
            void handleDelete();
          }}
          title={isPublishedEdit ? t('schedules:cancelClassTitle') : t('schedules:deleteClassTitle')}
          description={isPublishedEdit ? t('schedules:cancelClassConfirm') : t('schedules:deleteClassConfirm')}
          confirmLabel={
            isDeleting ? t('common:deleting') : isPublishedEdit ? t('schedules:cancelClassBtn') : t('common:delete')
          }
          cancelLabel={t('common:keep')}
          confirmVariant='destructive'
          isLoading={isDeleting}
        />
      </DialogContent>
    </Dialog>
  );
}
