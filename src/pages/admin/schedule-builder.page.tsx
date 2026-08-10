import { addWeeks, format, startOfWeek, subWeeks } from 'date-fns';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import { ClassSlotModal, ScheduleGrid } from '@components/modules';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard, useOrPermissions } from '@contexts';
import { AgendaEvent, DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError, ScheduledClass } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions, PERMISSION } from '@core/permissions';
import { useClasses, usePromise, useRooms, useSchedules } from '@hooks';

interface ClassSlotFormData {
  class_definition_id: string;
  room_id: string;
  instructor_id: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity?: number;
}

const UNASSIGNED_INSTRUCTOR = '__tba__';

function resolveInstructorId(instructorId: string): string | null {
  if (!instructorId || instructorId === UNASSIGNED_INSTRUCTOR) {
    return null;
  }

  return instructorId;
}

function formatAgendaTimeRange(event: AgendaEvent): string {
  const startTime = new Date(event.start_time);
  const endTime = new Date(event.end_time);
  const dateLabel = startTime.toLocaleDateString();
  const startLabel = startTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const endLabel = endTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return `${dateLabel} ${startLabel} - ${endLabel}`;
}

function toUtcWeekRange(weekStartDate: string) {
  const [year, month, day] = weekStartDate.split('-').map(Number);
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 7);

  return {
    startAt: start.toISOString(),
    endAt: end.toISOString(),
  };
}

function AdminScheduleBuilderPage() {
  const { t } = useTranslation();
  const canCancelPublishedClass = useOrPermissions([PERMISSION.SCHEDULED_CLASS_CANCEL]);
  const canManageFullSchedule = useOrPermissions([PERMISSION.SCHEDULE_MANAGE]);
  const canEditDraftSchedule = useOrPermissions([PERMISSION.SCHEDULE_DRAFT_CREATE, PERMISSION.SCHEDULE_MANAGE]);
  const [currentDate, setCurrentDate] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPublishConfirmOpen, setIsPublishConfirmOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<ScheduledClass | null>(null);
  const [defaultSlot, setDefaultSlot] = useState<{ date: string; time: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dayColumnMinWidth, setDayColumnMinWidth] = useState<number>(150);
  const [agendaRoomFilter, setAgendaRoomFilter] = useState<string>('all');

  const selectedWeekDate = format(currentDate, 'yyyy-MM-dd');

  // Data hooks
  const {
    weeks,
    weekId: selectedWeekId,
    activeWeekDetail,
    isLoadingWeeks,
    isLoadingWeekDetails,
    publishWeek,
    addClass,
    updateClass,
    editPublishedClass,
    cancelPublishedClass,
    removeClass,
    isPublishing,
    isCreatingClass,
    isUpdatingClass,
    isEditingPublishedClass,
    isCancellingPublishedClass,
    isRemovingClass,
  } = useSchedules({ weekStartDate: selectedWeekDate });
  const weekObj = useMemo(() => weeks.find(w => w.week_start_date === selectedWeekDate), [weeks, selectedWeekDate]);
  const { rooms } = useRooms();
  const { classes } = useClasses();

  // Use admin instructors endpoint and normalize response for the select component.
  const { response: instructors } = usePromise(() => DansshipAPI.instructorsAdmin.getInstructors());

  // Calculate the current active week
  const isPublished = weekObj?.status === 'published';
  const isArchived = weekObj?.status === 'archived';
  const canMutateCurrentWeek = isPublished ? canManageFullSchedule : canEditDraftSchedule;
  const agendaRoomId = agendaRoomFilter === 'all' ? undefined : agendaRoomFilter;

  const {
    response: agendaEvents,
    isLoading: isLoadingAgendaEvents,
    error: agendaEventsError,
  } = usePromise(
    () =>
      DansshipAPI.schedulesAdmin.getAgendaEvents({
        start_at: toUtcWeekRange(selectedWeekDate).startAt,
        end_at: toUtcWeekRange(selectedWeekDate).endAt,
        room_id: agendaRoomId,
      }),
    true,
    [selectedWeekDate, agendaRoomId],
  );

  const roomNameById = useMemo(() => {
    const dictionary: Record<string, string> = {};
    rooms.forEach(room => {
      dictionary[room.id] = room.name;
    });

    return dictionary;
  }, [rooms]);

  const getAgendaEventTypeLabel = (eventType: AgendaEvent['event_type']) => {
    if (eventType === 'studio_class') {
      return t('schedules:agenda.types.studioClass');
    }

    if (eventType === 'space_rental_external') {
      return t('schedules:agenda.types.externalRental');
    }

    if (eventType === 'internal_reserved_use') {
      return t('schedules:agenda.types.internalReservedUse');
    }

    return t('schedules:agenda.types.blockedSpace');
  };

  /** Returns true when the given date+hour slot is already in the past */
  const isSlotInPast = (date: string, hour: number): boolean => {
    const slotDate = new Date(`${date}T${hour.toString().padStart(2, '0')}:00:00`);

    return slotDate <= new Date();
  };

  /** Returns true when the given class has already started */
  const isClassInPast = (cls: ScheduledClass): boolean => {
    return new Date(cls.start_time) <= new Date();
  };

  // Handlers
  const handleSlotClick = (date: string, hour: number) => {
    if (isArchived || !canMutateCurrentWeek) return;

    if (isSlotInPast(date, hour)) return;

    setEditingClass(null);
    setSubmitError(null);
    setDefaultSlot({ date, time: `${hour.toString().padStart(2, '0')}:00` });
    setIsModalOpen(true);
  };

  const handleAddAtSameTime = (date: string, time: string) => {
    if (isArchived || !canMutateCurrentWeek) return;

    const [h] = time.split(':').map(Number);

    if (isSlotInPast(date, h)) return;

    setEditingClass(null);
    setSubmitError(null);
    setDefaultSlot({ date, time });
    setIsModalOpen(true);
  };

  const handleClassClick = (cls: ScheduledClass) => {
    if (isArchived) return;

    if (isClassInPast(cls)) return;

    if (isPublished && !(canManageFullSchedule || canCancelPublishedClass)) return;

    if (!isPublished && !canEditDraftSchedule) return;

    setEditingClass(cls);
    setSubmitError(null);
    setDefaultSlot(null);
    setIsModalOpen(true);
  };

  const getScheduleSubmitErrorMessage = (error: DansshipAPIError): string => {
    if (error.body.error_code === DANSSHIP_ERROR_CODE.SCHEDULE_ROOM_OVERLAP_CONFLICT) {
      return t('schedules:conflictRoom');
    }

    if (error.body.error_code === DANSSHIP_ERROR_CODE.SCHEDULE_INSTRUCTOR_OVERLAP_CONFLICT) {
      return t('schedules:conflictInstructor');
    }

    return t('schedules:saveClassError');
  };

  const handleModalSubmit = async (data: ClassSlotFormData) => {
    try {
      setSubmitError(null);

      // Convert local date and time back to UTC ISO string for backend
      const startIso = new Date(`${data.date}T${data.start_time}:00`).toISOString();
      const endIso = new Date(`${data.date}T${data.end_time}:00`).toISOString();

      if (editingClass && isPublished) {
        /*
         * Published schedule: use restricted published-edit endpoint
         * Always send instructor_id so TBA (null) can unassign an existing instructor
         */
        const publishedPayload = {
          room_id: data.room_id,
          instructor_id: resolveInstructorId(data.instructor_id),
          capacity: data.capacity || undefined,
        };
        await editPublishedClass(selectedWeekId, editingClass.id, publishedPayload);
      } else {
        // Draft schedule: full create/update
        const resolvedInstructorId = resolveInstructorId(data.instructor_id);
        const payload = {
          class_definition_id: data.class_definition_id,
          room_id: data.room_id,
          instructor_id: resolvedInstructorId,
          start_time: startIso,
          end_time: endIso,
          capacity: data.capacity || undefined,
        };

        if (editingClass) {
          await updateClass(selectedWeekId, editingClass.id, payload);
        } else {
          // addClass works for both draft and published schedules
          await addClass(payload);
        }
      }

      setIsModalOpen(false);
      setSubmitError(null);
    } catch (error) {
      setSubmitError(getScheduleSubmitErrorMessage(error as DansshipAPIError));
    }
  };

  const handleDeleteClass = async (options?: { cancellationNote?: string | null }) => {
    if (!editingClass) return;

    if (isPublished) {
      await cancelPublishedClass(selectedWeekId, editingClass.id, {
        cancellation_note: options?.cancellationNote ?? null,
      });
    } else {
      await removeClass(selectedWeekId, editingClass.id);
    }

    setIsModalOpen(false);
    setEditingClass(null);
    setSubmitError(null);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSubmitError(null);
  };

  const handlePublish = () => {
    if (!weekObj) return;

    setIsPublishConfirmOpen(true);
  };

  const handleConfirmPublish = async () => {
    if (!weekObj) return;

    await publishWeek(weekObj.id);
    setIsPublishConfirmOpen(false);
  };

  if (isLoadingWeeks) {
    return (
      <div className='flex justify-center py-12 pt-20'>
        <SpinnerLoader />
      </div>
    );
  }

  return (
    <div className='max-w-350 mx-auto py-8 px-4 pt-20'>
      <div className='flex justify-between items-end mb-8'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>{t('schedules:builderTitle')}</h1>
          <p className='text-gray-500 mt-2'>{t('schedules:builderSubtitle')}</p>
        </div>
        <div className='flex items-center space-x-4'>
          <Button variant='outline' size='icon' onClick={() => setCurrentDate(subWeeks(currentDate, 1))}>
            <LuChevronLeft className='h-4 w-4' />
          </Button>
          <div className='text-lg font-medium w-48 text-center'>
            {t('schedules:weekOf')} {format(currentDate, 'MMM d, yyyy')}
          </div>
          <Button variant='outline' size='icon' onClick={() => setCurrentDate(addWeeks(currentDate, 1))}>
            <LuChevronRight className='h-4 w-4' />
          </Button>
        </div>
      </div>

      {isLoadingWeekDetails ? (
        <div className='flex justify-center py-12'>
          <SpinnerLoader />
        </div>
      ) : (
        <div className='space-y-4'>
          <div className='flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-200'>
            <div>
              <span className='font-semibold text-gray-700 mr-4'>{t('schedules:statusLabel')}</span>
              <span
                className={`px-3 py-1 rounded-full text-xs uppercase font-bold
                ${weekObj?.status === 'draft' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${weekObj?.status === 'published' ? 'bg-green-100 text-green-800' : ''}
                ${weekObj?.status === 'archived' ? 'bg-gray-200 text-gray-800' : ''}
                ${!weekObj ? 'bg-blue-100 text-blue-800' : ''}
              `}
              >
                {weekObj?.status || 'New'}
              </span>
            </div>

            <div className='flex items-center gap-3'>
              <div className='flex items-center gap-2'>
                <span className='text-xs font-medium text-gray-600'>{t('schedules:dayWidth')}</span>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setDayColumnMinWidth(prev => Math.max(150, prev - 20))}
                >
                  -
                </Button>
                <span className='w-14 text-center text-xs text-gray-700'>{dayColumnMinWidth}px</span>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => setDayColumnMinWidth(prev => Math.min(280, prev + 20))}
                >
                  +
                </Button>
              </div>

              {weekObj?.status === 'draft' && canManageFullSchedule && (
                <Button onClick={handlePublish} disabled={isPublishing}>
                  {t('schedules:publishSchedule')}
                </Button>
              )}
            </div>
          </div>

          <ScheduleGrid
            weekDate={selectedWeekDate}
            classes={activeWeekDetail?.classes || []}
            onSlotClick={handleSlotClick}
            onClassClick={selectedClass => handleClassClick(selectedClass as ScheduledClass)}
            onAddAtTime={!isArchived && canMutateCurrentWeek ? handleAddAtSameTime : undefined}
            dayColumnMinWidth={dayColumnMinWidth}
            scheduleStatus={weekObj?.status}
          />

          <section className='bg-white rounded-lg border border-gray-200 p-4 md:p-6'>
            <div className='flex flex-col gap-4 md:flex-row md:items-end md:justify-between'>
              <div>
                <h2 className='text-xl font-semibold text-gray-900'>{t('schedules:agenda.title')}</h2>
                <p className='text-sm text-gray-500 mt-1'>{t('schedules:agenda.subtitle')}</p>
              </div>
              <div className='w-full md:w-72'>
                <label className='text-xs font-medium text-gray-600'>{t('schedules:agenda.filterRoom')}</label>
                <Select value={agendaRoomFilter} onValueChange={setAgendaRoomFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('schedules:agenda.filterRoom')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>{t('schedules:agenda.filterAllRooms')}</SelectItem>
                    {rooms.map(room => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {isLoadingAgendaEvents ? (
              <div className='py-8 flex justify-center'>
                <SpinnerLoader />
              </div>
            ) : agendaEventsError ? (
              <p className='text-sm text-alert-600 mt-4'>{t('schedules:agenda.loadError')}</p>
            ) : (agendaEvents?.data ?? []).length === 0 ? (
              <p className='text-sm text-gray-500 mt-4'>{t('schedules:agenda.empty')}</p>
            ) : (
              <div className='mt-4 divide-y divide-gray-100 rounded-md border border-gray-100'>
                {(agendaEvents?.data ?? []).map(event => (
                  <div
                    key={`${event.source_id}-${event.start_time}`}
                    className='px-4 py-3 grid gap-2 md:grid-cols-4 md:items-center'
                  >
                    <div className='md:col-span-2'>
                      <p className='text-sm font-medium text-gray-900'>{formatAgendaTimeRange(event)}</p>
                      <p className='text-xs text-gray-500 mt-1'>
                        {t('schedules:agenda.roomLabel')}
                        {roomNameById[event.room_id] ?? event.room_id}
                      </p>
                    </div>
                    <p className='text-xs uppercase tracking-wide text-gray-600'>
                      {t('schedules:agenda.eventTypeLabel')}
                      {getAgendaEventTypeLabel(event.event_type)}
                    </p>
                    <p className='text-xs text-gray-600'>
                      {t('schedules:agenda.statusLabel')}
                      {event.status ?? t('schedules:agenda.noStatus')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* Modal is rendered outside the loop */}
      <ClassSlotModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSubmit={handleModalSubmit}
        initialData={editingClass}
        rooms={rooms}
        classes={classes}
        instructors={instructors?.data ?? []}
        defaultDate={defaultSlot?.date}
        defaultTime={defaultSlot?.time}
        isLoading={isCreatingClass || isUpdatingClass || isEditingPublishedClass}
        onDelete={handleDeleteClass}
        isDeleting={isRemovingClass || isCancellingPublishedClass}
        submitError={submitError}
        isPublishedEdit={isPublished && editingClass !== null}
        canCancelPublishedClass={canCancelPublishedClass}
        canSave={!isPublished || canManageFullSchedule}
      />

      <ConfirmDialog
        open={isPublishConfirmOpen}
        onOpenChange={setIsPublishConfirmOpen}
        onConfirm={handleConfirmPublish}
        title={t('schedules:publishTitle')}
        description={t('schedules:publishConfirm')}
        confirmLabel={t('schedules:publish')}
        isLoading={isPublishing}
      />
    </div>
  );
}

export const SecureAdminScheduleBuilderPage = SecurityGuard(AdminScheduleBuilderPage, {
  featureFlags: [FEATURE_FLAG.areAdminPagesEnabled],
  orPermissions: AdminPermissions.scheduleBuilder,
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
