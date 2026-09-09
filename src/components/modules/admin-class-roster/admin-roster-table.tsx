import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCircleCheck, LuCircleX } from 'react-icons/lu';

import { Spinner } from '@components/loaders';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { type RosterStudent } from '@core/api';
import { classLevelLabelKey, rosterStudentName } from '@helpers';
import { useAdminRoster } from '@hooks';

const MARKABLE_STATUSES = new Set(['active', 'attended', 'no_show']);

function rosterClassLevel(student: RosterStudent, t: (key: string) => string) {
  const key = classLevelLabelKey(student.class_level);

  return key ? t(key) : t('admin:roster.noLevel');
}

function canMarkAttendance(student: RosterStudent) {
  return MARKABLE_STATUSES.has(student.status);
}

interface AttendanceActionsProps {
  student: RosterStudent;
  isPastStartTime: boolean;
  isUpdating: boolean;
  isDisabled: boolean;
  onAttendance: (bookingId: string, status: 'attended' | 'no_show') => void;
}

function AttendanceActions({ student, isPastStartTime, isUpdating, isDisabled, onAttendance }: AttendanceActionsProps) {
  const { t } = useTranslation();

  return (
    <div className='relative inline-flex justify-end gap-2'>
      <Button
        variant={student.status === 'attended' ? 'default' : 'outline'}
        size='sm'
        onClick={() => onAttendance(student.id, 'attended')}
        disabled={!isPastStartTime || isDisabled}
        className={student.status === 'attended' ? 'bg-active-600 hover:bg-active-700' : ''}
        title={!isPastStartTime ? t('admin:roster.cannotMarkBeforeStart') : ''}
      >
        <LuCircleCheck className='mr-1 h-4 w-4' /> {t('admin:roster.attended')}
      </Button>
      <Button
        variant={student.status === 'no_show' ? 'destructive' : 'outline'}
        size='sm'
        onClick={() => onAttendance(student.id, 'no_show')}
        disabled={!isPastStartTime || isDisabled}
        title={!isPastStartTime ? t('admin:roster.cannotMarkBeforeStart') : ''}
      >
        <LuCircleX className='mr-1 h-4 w-4' /> {t('admin:roster.noShow')}
      </Button>
      {isUpdating ? (
        <div className='absolute inset-0 flex items-center justify-center rounded-md bg-white/70'>
          <Spinner size='sm' />
        </div>
      ) : null}
    </div>
  );
}

interface AdminRosterTableProps {
  attendees: Array<RosterStudent>;
  emptyLabel: string;
  isPastStartTime: boolean;
  onAttendanceUpdated: () => void;
}

export function AdminRosterTable({
  attendees,
  emptyLabel,
  isPastStartTime,
  onAttendanceUpdated,
}: AdminRosterTableProps) {
  const { t } = useTranslation();
  const { adjustAttendance } = useAdminRoster();
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const isAttendanceBusy = updatingBookingId !== null;

  const handleAttendance = async (bookingId: string, status: 'attended' | 'no_show') => {
    setUpdatingBookingId(bookingId);
    try {
      const updated = await adjustAttendance(bookingId, { status });

      if (updated) {
        onAttendanceUpdated();
      }
    } finally {
      setUpdatingBookingId(null);
    }
  };

  return (
    <div className='rounded-md border bg-white/50'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:roster.studentName')}</TableHead>
            <TableHead>{t('common:email')}</TableHead>
            <TableHead>{t('common:level')}</TableHead>
            <TableHead>{t('common:status')}</TableHead>
            <TableHead className='text-right'>{t('admin:roster.attendance')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {attendees.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className='py-6 text-center text-muted-foreground'>
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            attendees.map(student => (
              <TableRow key={student.id}>
                <TableCell>{rosterStudentName(student)}</TableCell>
                <TableCell>{student.user_email || '-'}</TableCell>
                <TableCell>{rosterClassLevel(student, t)}</TableCell>
                <TableCell>{student.status}</TableCell>
                <TableCell className='text-right'>
                  {canMarkAttendance(student) ? (
                    <AttendanceActions
                      student={student}
                      isPastStartTime={isPastStartTime}
                      isUpdating={updatingBookingId === student.id}
                      isDisabled={isAttendanceBusy}
                      onAttendance={handleAttendance}
                    />
                  ) : (
                    <span className='text-sm text-muted-foreground'>—</span>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
