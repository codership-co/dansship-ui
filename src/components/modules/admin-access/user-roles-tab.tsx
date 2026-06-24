import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { LuSearch } from 'react-icons/lu';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
} from '@components/ui';
import { type AssignRoleToUserPayload, DansshipAPI, RoleResponse } from '@core/api';
import { useCallablePromise, usePromise } from '@hooks';

export function UserRolesTab() {
  const { t } = useTranslation();
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchedUserId, setSearchedUserId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isInstructorDialogOpen, setIsInstructorDialogOpen] = useState(false);
  const [instructorRoleToAssign, setInstructorRoleToAssign] = useState<RoleResponse | null>(null);
  const [instructorProfileForm, setInstructorProfileForm] = useState({
    bio: '',
    photo_url: '',
    contact_info: '',
  });
  const [instructorProfileErrors, setInstructorProfileErrors] = useState({
    bio: '',
    photo_url: '',
    contact_info: '',
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce the search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 1000);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { response: allRoles } = usePromise(() => DansshipAPI.rbacAdmin.getRoles());
  const { response: userWithRoles, isLoading } = usePromise(
    () => DansshipAPI.rbacAdmin.getUserRoles(searchedUserId ?? ''),
    !!searchedUserId,
  );

  const { response: searchResults, isLoading: isSearchingUsers } = usePromise(
    () =>
      DansshipAPI.usersAdmin.search({
        email: debouncedSearch,
      }),
    debouncedSearch.length > 2,
  );

  const { call: assignRole, isLoading: isAssigning } = useCallablePromise(
    (userId: string, payload: AssignRoleToUserPayload) => DansshipAPI.rbacAdmin.assignRoleToUser(userId, payload),
  );

  const { call: revokeRole, isLoading: isRevoking } = useCallablePromise((userId: string, roleId: string) =>
    DansshipAPI.rbacAdmin.revokeRoleFromUser(userId, roleId),
  );

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(e.target.value);
    setSearchedUserId(null);
    setIsDropdownOpen(true);
  };

  const handleSelectUser = (userId: string, email: string) => {
    setSearchedUserId(userId);
    setSearchInput(email);
    setIsDropdownOpen(false);
  };

  const isInstructorRole = (role: RoleResponse): boolean => role.name.trim().toLowerCase() === 'instructor';

  const validateInstructorProfile = () => {
    const nextErrors = {
      bio: '',
      photo_url: '',
      contact_info: '',
    };
    let hasError = false;

    const trimmedBio = instructorProfileForm.bio.trim();
    const trimmedPhotoUrl = instructorProfileForm.photo_url.trim();
    const trimmedContactInfo = instructorProfileForm.contact_info.trim();

    if (!trimmedBio) {
      nextErrors.bio = t('validation:bioRequired');
      hasError = true;
    }

    if (!trimmedContactInfo) {
      nextErrors.contact_info = t('validation:contactInfoRequired');
      hasError = true;
    }

    if (!trimmedPhotoUrl) {
      nextErrors.photo_url = t('validation:photoUrlRequired');
      hasError = true;
    } else {
      try {
        // Ensures a full absolute URL is sent to backend.
        // eslint-disable-next-line no-new
        new URL(trimmedPhotoUrl);
      } catch {
        nextErrors.photo_url = t('validation:invalidUrl');
        hasError = true;
      }
    }

    setInstructorProfileErrors(nextErrors);

    return !hasError;
  };

  const handleAssign = async (role: RoleResponse) => {
    if (!searchedUserId) return;

    if (isInstructorRole(role)) {
      setInstructorRoleToAssign(role);
      setInstructorProfileForm({ bio: '', photo_url: '', contact_info: '' });
      setInstructorProfileErrors({ bio: '', photo_url: '', contact_info: '' });
      setIsInstructorDialogOpen(true);

      return;
    }

    try {
      await assignRole(searchedUserId, { role_id: role.id });
      toast.success(t('rbac:userRoles.roleAssignedSuccess', { name: role.name }));
    } catch {
      toast.error(t('rbac:userRoles.roleAssignFailed'));
    }
  };

  const handleConfirmInstructorAssignment = async () => {
    if (!searchedUserId || !instructorRoleToAssign) return;

    if (!validateInstructorProfile()) return;

    try {
      await assignRole(searchedUserId, {
        role_id: instructorRoleToAssign.id,
        instructor_profile: {
          bio: instructorProfileForm.bio.trim(),
          photo_url: instructorProfileForm.photo_url.trim(),
          contact_info: instructorProfileForm.contact_info.trim(),
        },
      });
      setIsInstructorDialogOpen(false);
      setInstructorRoleToAssign(null);
      toast.success(t('rbac:userRoles.instructorAssignedSuccess'));
    } catch {
      toast.error(t('rbac:userRoles.instructorAssignFailed'));
    }
  };

  const handleRevoke = (roleId: string) => {
    if (searchedUserId) {
      void revokeRole(searchedUserId, roleId);
    }
  };

  const availableRoles =
    allRoles?.data?.filter(role => !userWithRoles?.data?.roles.some(ur => ur.id === role.id)) || [];

  return (
    <div className='space-y-6'>
      <div>
        <h2 className='text-xl font-semibold mb-4'>{t('rbac:userRoles.title')}</h2>

        <div className='relative max-w-md' ref={dropdownRef}>
          <div className='flex gap-2'>
            <div className='relative flex-1'>
              <input
                type='text'
                value={searchInput}
                onChange={handleInputChange}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder={t('rbac:userRoles.searchPlaceholder')}
                className='w-full h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-600'
              />
              {isSearchingUsers && (
                <div className='absolute right-3 top-2.5'>
                  <SpinnerLoader className='w-5 h-5 text-gray-400' />
                </div>
              )}
            </div>
            <Button disabled className='w-10 p-0 flex justify-center items-center opacity-50 cursor-not-allowed'>
              <LuSearch className='w-4 h-4' />
            </Button>
          </div>

          {/* Autocomplete Dropdown */}
          {isDropdownOpen && debouncedSearch.length > 2 && (
            <div className='absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto'>
              {!isSearchingUsers && searchResults?.data?.length === 0 ? (
                <div className='px-4 py-3 text-sm text-gray-500'>{t('rbac:userRoles.noUsersFound')}</div>
              ) : (
                <ul className='py-1'>
                  {searchResults?.data?.map(user => (
                    <li
                      key={user.id}
                      onClick={() => handleSelectUser(user.id, user.email)}
                      className='px-4 py-2 hover:bg-purple-50 cursor-pointer text-sm border-b last:border-0'
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

      {searchedUserId && (
        <div className='border rounded-lg p-6 bg-white shadow-sm'>
          {isLoading ? (
            <div className='py-4 flex justify-center'>
              <SpinnerLoader />
            </div>
          ) : !userWithRoles?.ok ? (
            <div className='text-alert-500 py-4'>{t('rbac:userRoles.errorLoadingUser')}</div>
          ) : userWithRoles ? (
            <div className='space-y-6'>
              <div>
                <h3 className='text-lg font-medium'>
                  {t('rbac:userRoles.userLabel')}
                  <span className='text-purple-600 font-semibold'>{userWithRoles.data.email}</span>
                </h3>
                <p className='text-sm text-gray-500'>ID: {userWithRoles.data.id}</p>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <h4 className='font-semibold text-gray-700 border-b pb-2 mb-3'>
                    {t('rbac:userRoles.assignedRoles')}
                  </h4>
                  {userWithRoles.data.roles.length === 0 ? (
                    <p className='text-sm text-gray-500 italic'>{t('rbac:userRoles.noRolesAssigned')}</p>
                  ) : (
                    <div className='space-y-2'>
                      {userWithRoles.data.roles.map((role: RoleResponse) => (
                        <div
                          key={role.id}
                          className='flex justify-between items-center bg-gray-50 p-3 rounded-md border'
                        >
                          <span className='font-medium'>{role.name}</span>
                          <Button
                            variant='destructive'
                            size='sm'
                            onClick={() => handleRevoke(role.id)}
                            disabled={isRevoking || isAssigning}
                          >
                            {t('common:revoke')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className='font-semibold text-gray-700 border-b pb-2 mb-3'>
                    {t('rbac:userRoles.availableRoles')}
                  </h4>
                  {availableRoles.length === 0 ? (
                    <p className='text-sm text-gray-500 italic'>{t('rbac:userRoles.allRolesAssigned')}</p>
                  ) : (
                    <div className='space-y-2'>
                      {availableRoles.map((role: RoleResponse) => (
                        <div key={role.id} className='flex justify-between items-center bg-white p-3 rounded-md border'>
                          <span className='font-medium'>{role.name}</span>
                          <Button
                            size='sm'
                            onClick={() => {
                              void handleAssign(role);
                            }}
                            disabled={isAssigning || isRevoking}
                          >
                            {isInstructorRole(role) ? t('rbac:userRoles.assignAndComplete') : t('common:assign')}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <Dialog open={isInstructorDialogOpen} onOpenChange={setIsInstructorDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('rbac:userRoles.completeInstructorTitle')}</DialogTitle>
            <DialogDescription>{t('rbac:userRoles.completeInstructorDesc')}</DialogDescription>
          </DialogHeader>

          <div className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='instructor-bio'>{t('instructor:biography')}</Label>
              <Textarea
                id='instructor-bio'
                value={instructorProfileForm.bio}
                onChange={event => setInstructorProfileForm(prev => ({ ...prev, bio: event.target.value }))}
                placeholder={t('instructor:bioPlaceholder')}
                className='min-h-25'
              />
              {instructorProfileErrors.bio ? (
                <p className='text-sm text-alert-500'>{instructorProfileErrors.bio}</p>
              ) : null}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='instructor-photo-url'>{t('instructor:photoUrl')}</Label>
              <Input
                id='instructor-photo-url'
                value={instructorProfileForm.photo_url}
                onChange={event => setInstructorProfileForm(prev => ({ ...prev, photo_url: event.target.value }))}
                placeholder={t('instructor:photoUrlPlaceholder')}
              />
              {instructorProfileErrors.photo_url ? (
                <p className='text-sm text-alert-500'>{instructorProfileErrors.photo_url}</p>
              ) : null}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='instructor-contact-info'>{t('instructor:contactInfo')}</Label>
              <Input
                id='instructor-contact-info'
                value={instructorProfileForm.contact_info}
                onChange={event =>
                  setInstructorProfileForm(prev => ({
                    ...prev,
                    contact_info: event.target.value,
                  }))
                }
                placeholder={t('instructor:contactInfoPlaceholder')}
              />
              {instructorProfileErrors.contact_info ? (
                <p className='text-sm text-alert-500'>{instructorProfileErrors.contact_info}</p>
              ) : null}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setIsInstructorDialogOpen(false);
                setInstructorRoleToAssign(null);
              }}
              disabled={isAssigning}
            >
              {t('common:cancel')}
            </Button>
            <Button onClick={() => void handleConfirmInstructorAssignment()} disabled={isAssigning}>
              {isAssigning ? t('rbac:userRoles.assigning') : t('rbac:userRoles.assignInstructor')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
