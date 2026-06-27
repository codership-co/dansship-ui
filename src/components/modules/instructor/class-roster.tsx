import { format } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCircleCheck, LuSearch, LuCircleX } from 'react-icons/lu';

import { SpinnerLoader } from '@components/loaders';
import { Button, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Input } from '@components/ui';
import { DansshipAPI, InstructorUserSearchResult } from '@core/api';
import { useDateLocale, usePromise, useInstructorRoster } from '@hooks';

interface ClassRosterProps {
  classId: string;
  className: string;
  startTime: string;
}

export function ClassRoster({ classId, className, startTime }: ClassRosterProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { markAttendance, manualAddStudent, isAdding, isMarking } = useInstructorRoster();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<InstructorUserSearchResult | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { response: roster, isLoading } = usePromise(() => DansshipAPI.instructors.getClassRoster(classId));

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 600);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { response: searchedUsers, isLoading: isSearchingUsers } = usePromise(() =>
    DansshipAPI.instructors.searchUsersByEmail(debouncedSearch),
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
    await markAttendance(bookingId, { status });
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

  if (isLoading) {
    return (
      <div className='py-8 flex justify-center'>
        <SpinnerLoader />
      </div>
    );
  }

  const enrolled = roster?.data?.enrolled?.filter(s => s.status !== 'waitlisted' && s.status !== 'cancelled') ?? [];
  const waitlisted = roster?.data?.waitlisted?.filter(s => s.status === 'waitlisted') ?? [];

  return (
    <div className='space-y-8'>
      <div>
        <h2 className='text-xl font-bold text-gray-900'>{className} - Roster</h2>
        <p className='text-gray-500 text-sm'>{format(new Date(startTime), 'EEEE, MMMM do yyyy h:mm a', { locale })}</p>
      </div>

      <div className='space-y-4'>
        <div className='flex justify-between items-end'>
          <h3 className='text-lg font-semibold text-gray-800'>
            {t('instructor:roster.enrolledStudents', { count: enrolled.length })}
          </h3>

          <div className='relative flex space-x-2' ref={dropdownRef}>
            <div className='relative'>
              <Input
                placeholder={t('instructor:roster.searchPlaceholder')}
                value={searchInput}
                onChange={e => handleSearchInputChange(e.target.value)}
                onFocus={() => setIsDropdownOpen(true)}
                className='w-80'
              />
              {isSearchingUsers ? (
                <div className='absolute right-3 top-2.5'>
                  <SpinnerLoader className='h-4 w-4 text-gray-400' />
                </div>
              ) : (
                <LuSearch className='absolute right-3 top-2.5 h-4 w-4 text-gray-400' />
              )}
            </div>
            <Button onClick={handleManualAdd} disabled={isAdding || !selectedUser}>
              {isAdding ? t('instructor:roster.adding') : t('instructor:roster.manualAdd')}
            </Button>

            {isDropdownOpen && debouncedSearch.length > 2 && (
              <div className='absolute left-0 top-11 z-20 w-80 max-h-60 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg'>
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
            )}
          </div>
        </div>

        <div className='border rounded-md bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('instructor:roster.studentName')}</TableHead>
                <TableHead>{t('common:email')}</TableHead>
                <TableHead>{t('common:status')}</TableHead>
                <TableHead className='text-right'>{t('instructor:roster.attendance')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrolled.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className='text-center py-6 text-gray-500'>
                    {t('instructor:roster.noStudents')}
                  </TableCell>
                </TableRow>
              ) : (
                enrolled.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className='font-medium'>
                      {student.user_name || student.user_email || student.user_id}
                    </TableCell>
                    <TableCell>{student.user_email || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold uppercase
                        ${student.status === 'active' ? 'bg-blue-100 text-info-800' : ''}
                        ${student.status === 'attended' ? 'bg-active-100 text-active-800' : ''}
                        ${student.status === 'no_show' ? 'bg-red-100 text-alert-800' : ''}
                      `}
                      >
                        {student.status.replace('_', ' ')}
                      </span>
                    </TableCell>
                    <TableCell className='text-right space-x-2'>
                      <Button
                        variant={student.status === 'attended' ? 'default' : 'outline'}
                        size='sm'
                        onClick={() => handleAttendance(student.id, 'attended')}
                        disabled={!isPastStartTime || isMarking}
                        className={student.status === 'attended' ? 'bg-active-600 hover:bg-active-700' : ''}
                        title={!isPastStartTime ? t('instructor:roster.cannotMarkBeforeStart') : ''}
                      >
                        <LuCircleCheck className='h-4 w-4 mr-1' /> {t('instructor:roster.attended')}
                      </Button>
                      <Button
                        variant={student.status === 'no_show' ? 'destructive' : 'outline'}
                        size='sm'
                        onClick={() => handleAttendance(student.id, 'no_show')}
                        disabled={!isPastStartTime || isMarking}
                        title={!isPastStartTime ? t('instructor:roster.cannotMarkBeforeStart') : ''}
                      >
                        <LuCircleX className='h-4 w-4 mr-1' /> {t('instructor:roster.noShow')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {waitlisted.length > 0 && (
        <div className='space-y-4 pt-6 border-t border-gray-200'>
          <h3 className='text-lg font-semibold text-gray-800'>
            {t('instructor:roster.waitlist', { count: waitlisted.length })}
          </h3>

          <div className='border rounded-md bg-white'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('instructor:roster.studentName')}</TableHead>
                  <TableHead>{t('instructor:roster.joinedAt')}</TableHead>
                  <TableHead>{t('common:status')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {waitlisted.map(student => (
                  <TableRow key={student.id}>
                    <TableCell className='font-medium'>
                      {student.user_name || student.user_email || student.user_id}
                    </TableCell>
                    <TableCell>{format(new Date(student.created_at), 'MMM d, h:mm a', { locale })}</TableCell>
                    <TableCell>
                      <span className='px-2 py-1 rounded-full text-xs font-bold uppercase bg-yellow-100 text-yellow-800'>
                        {t('instructor:roster.waitlisted')}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {!isPastStartTime && (
        <p className='text-sm text-gray-500 italic mt-4 text-center'>{t('instructor:roster.attendanceNote')}</p>
      )}
    </div>
  );
}
