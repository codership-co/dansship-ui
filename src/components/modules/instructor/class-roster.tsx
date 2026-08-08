import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCircleCheck, LuSearch, LuCircleX } from 'react-icons/lu';

import { SpinnerLoader, Spinner } from '@components/loaders';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input } from '@components/ui';
import { DansshipAPI, InstructorUserSearchResult, RosterStudent } from '@core/api';
import { captureUnexpectedException } from '@core/sentry';
import { useDateLocale, usePromise, useInstructorRoster } from '@hooks';

interface ClassRosterProps {
  classId: string;
  className: string;
  startTime: string;
}

function studentDisplayName(student: RosterStudent) {
  return student.user_name || student.user_email || student.user_id;
}

interface AttendanceActionsProps {
  student: RosterStudent;
  isPastStartTime: boolean;
  isUpdating: boolean;
  isDisabled: boolean;
  onAttendance: (bookingId: string, status: 'attended' | 'no_show') => void;
  stacked?: boolean;
}

function AttendanceActions({
  student,
  isPastStartTime,
  isUpdating,
  isDisabled,
  onAttendance,
  stacked = false,
}: AttendanceActionsProps) {
  const { t } = useTranslation();

  return (
    <div className={`relative ${stacked ? 'grid grid-cols-2 gap-2 w-full' : 'inline-flex gap-2 justify-end'}`}>
      <Button
        variant={student.status === 'attended' ? 'default' : 'outline'}
        size='sm'
        onClick={() => onAttendance(student.id, 'attended')}
        disabled={!isPastStartTime || isDisabled}
        className={`${stacked ? 'w-full' : ''} ${student.status === 'attended' ? 'bg-active-600 hover:bg-active-700' : ''}`}
        title={!isPastStartTime ? t('instructor:roster.cannotMarkBeforeStart') : ''}
      >
        <LuCircleCheck className='h-4 w-4 mr-1' /> {t('instructor:roster.attended')}
      </Button>
      <Button
        variant={student.status === 'no_show' ? 'destructive' : 'outline'}
        size='sm'
        onClick={() => onAttendance(student.id, 'no_show')}
        disabled={!isPastStartTime || isDisabled}
        className={stacked ? 'w-full' : ''}
        title={!isPastStartTime ? t('instructor:roster.cannotMarkBeforeStart') : ''}
      >
        <LuCircleX className='h-4 w-4 mr-1' /> {t('instructor:roster.noShow')}
      </Button>
      {isUpdating ? (
        <div className='absolute inset-0 flex items-center justify-center rounded-md bg-white/70'>
          <Spinner size='sm' />
        </div>
      ) : null}
    </div>
  );
}

export function ClassRoster({ classId, className, startTime }: ClassRosterProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { markAttendance, manualAddStudent, isAdding } = useInstructorRoster();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<InstructorUserSearchResult | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [updatingBookingId, setUpdatingBookingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    response: roster,
    isLoading,
    reFetch: reFetchRoster,
  } = usePromise(() => DansshipAPI.instructors.getClassRoster(classId));

  useEffect(() => {
    if (!roster || roster.ok) {
      return;
    }

    captureUnexpectedException(roster.error ?? new Error('Instructor roster load failed'), {
      tags: { flow: 'instructor.roster.load', class_id: classId },
    });
  }, [roster, classId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const trimmedSearch = debouncedSearch.trim();
  const { response: searchedUsers, isLoading: isSearchingUsers } = usePromise(
    () => DansshipAPI.instructors.searchUsersByEmail(trimmedSearch),
    trimmedSearch.length > 2,
    [trimmedSearch],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAttendance = async (bookingId: string, status: 'attended' | 'no_show') => {
    setUpdatingBookingId(bookingId);

    try {
      const updated = await markAttendance(bookingId, { status });

      if (updated) {
        await reFetchRoster();
      }
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const handleManualAdd = async () => {
    if (!selectedUser) return;

    try {
      await manualAddStudent(classId, { user_id: selectedUser.id });
      setSearchInput('');
      setDebouncedSearch('');
      setSelectedUser(null);
    } catch {
      // Error handled by hook toast
    }
  };

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
    setSelectedUser(null);
    setIsDropdownOpen(true);
  };

  const handleSelectUser = (user: InstructorUserSearchResult) => {
    setSelectedUser(user);
    setSearchInput(user.email);
    setIsDropdownOpen(false);
  };

  const isPastStartTime = new Date(startTime) < new Date();
  const isAttendanceBusy = updatingBookingId !== null;

  if (isLoading && !roster) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  const enrolled = roster?.data?.enrolled?.filter(s => s.status !== 'cancelled') ?? [];

  const searchDropdown =
    isDropdownOpen && trimmedSearch.length > 2 ? (
      <div className='absolute left-0 right-0 lg:right-auto top-11 z-20 w-full lg:w-80 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg'>
        {!isSearchingUsers && (!searchedUsers?.ok || searchedUsers?.data?.length === 0) ? (
          <div className='px-4 py-3 text-sm text-gray-500'>{t('common:noUsersFound')}</div>
        ) : (
          <ul className='py-1'>
            {searchedUsers?.data?.map(user => (
              <li
                key={user.id}
                onClick={() => handleSelectUser(user)}
                className='cursor-pointer border-b px-4 py-2 text-sm hover:bg-purple-50 last:border-0'
              >
                <div className='font-medium'>{user.email}</div>
                <div className='text-xs text-gray-400'>ID: {user.id}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    ) : null;

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-xl font-bold text-gray-900'>{className} - Roster</h2>
        <p className='text-gray-500 text-sm'>{format(new Date(startTime), 'EEEE, MMMM do yyyy h:mm a', { locale })}</p>
      </div>

      <div className='space-y-4'>
        <div className='flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end'>
          <h3 className='text-lg font-semibold text-gray-800 m-0'>
            {t('instructor:roster.enrolledStudents', { count: enrolled.length })}
          </h3>

          <div className='relative flex flex-col gap-2 sm:flex-row sm:items-center w-full lg:w-auto' ref={dropdownRef}>
            <div className='relative w-full lg:w-80'>
              <Input
                placeholder={t('instructor:roster.searchPlaceholder')}
                value={searchInput}
                onChange={e => handleSearchInputChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className='w-full'
              />
              {isSearchingUsers ? (
                <div className='absolute right-3 top-2.5'>
                  <SpinnerLoader className='h-4 w-4 text-gray-400' />
                </div>
              ) : (
                <LuSearch className='absolute right-3 top-2.5 h-4 w-4 text-gray-400' />
              )}
              {searchDropdown}
            </div>
            <Button
              onClick={handleManualAdd}
              disabled={isAdding || !selectedUser}
              className='w-full sm:w-auto shrink-0'
            >
              {isAdding ? t('instructor:roster.adding') : t('instructor:roster.manualAdd')}
            </Button>
          </div>
        </div>

        <div className='lg:hidden space-y-3'>
          {enrolled.length === 0 ? (
            <p className='text-center py-6 text-gray-500 text-sm'>{t('instructor:roster.noStudents')}</p>
          ) : (
            enrolled.map(student => (
              <article key={student.id} className='rounded-xl border border-gray-200 bg-white p-4 grid gap-3'>
                <div className='grid gap-1 min-w-0'>
                  <p className='m-0 font-semibold text-gray-900 truncate'>{studentDisplayName(student)}</p>
                  <p className='m-0 text-sm text-gray-500 truncate'>{student.user_email || '-'}</p>
                </div>
                <AttendanceActions
                  student={student}
                  isPastStartTime={isPastStartTime}
                  isUpdating={updatingBookingId === student.id}
                  isDisabled={isAttendanceBusy}
                  onAttendance={handleAttendance}
                  stacked
                />
              </article>
            ))
          )}
        </div>

        <div className='hidden lg:block border rounded-md bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('instructor:roster.studentName')}</TableHead>
                <TableHead>{t('common:email')}</TableHead>
                <TableHead className='text-right'>{t('instructor:roster.attendance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolled.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className='text-center py-6 text-gray-500'>
                    {t('instructor:roster.noStudents')}
                  </TableCell>
                </TableRow>
              ) : (
                enrolled.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className='font-medium'>{studentDisplayName(student)}</TableCell>
                    <TableCell>{student.user_email || '-'}</TableCell>
                    <TableCell className='text-right'>
                      <AttendanceActions
                        student={student}
                        isPastStartTime={isPastStartTime}
                        isUpdating={updatingBookingId === student.id}
                        isDisabled={isAttendanceBusy}
                        onAttendance={handleAttendance}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {!isPastStartTime && (
        <p className='text-sm text-gray-500 italic mt-4 text-center'>{t('instructor:roster.attendanceNote')}</p>
      )}
    </div>
  );
}
