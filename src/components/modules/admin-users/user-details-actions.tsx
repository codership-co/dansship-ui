import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEllipsisVertical } from 'react-icons/lu';
import { toast } from 'sonner';

import { Button, Popover, PopoverContent, PopoverTrigger } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { AdminPermissions } from '@core/permissions';
import { useCallablePromise } from '@hooks';

interface UserDetailsActionsProps {
  userId: string;
  userEmail: string;
  roleNames: Array<string>;
  onChanged: () => void;
}

const normalizeRoleName = (name: string) => name.trim().toLowerCase();

export function UserDetailsActions({ userId, userEmail, roleNames, onChanged }: UserDetailsActionsProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const canManageUsers = useOrPermissions(AdminPermissions.users);

  const { call: inviteInstructor, isLoading: isInviting } = useCallablePromise((id: string) =>
    DansshipAPI.instructorsAdmin.inviteInstructor(id),
  );
  const { call: deactivateInstructor, isLoading: isDeactivating } = useCallablePromise((id: string) =>
    DansshipAPI.instructorsAdmin.deactivateInstructor(id),
  );

  const isInstructor = useMemo(() => roleNames.some(role => normalizeRoleName(role) === 'instructor'), [roleNames]);
  const isLoading = isInviting || isDeactivating;

  if (!canManageUsers) {
    return null;
  }

  const handleInviteInstructor = async () => {
    try {
      const response = await inviteInstructor(userId);

      if (!response.ok) {
        toast.error(t('admin:users.details.inviteInstructorFailed'));

        return;
      }

      setIsMenuOpen(false);
      toast.success(
        t('admin:users.details.inviteInstructorSuccess', {
          email: userEmail,
        }),
      );
      onChanged();
    } catch {
      toast.error(t('admin:users.details.inviteInstructorFailed'));
    }
  };

  const handleDeactivateInstructor = async () => {
    try {
      const response = await deactivateInstructor(userId);

      if (!response.ok) {
        toast.error(t('admin:users.details.deactivateInstructorFailed'));

        return;
      }

      setIsMenuOpen(false);
      toast.success(t('admin:users.details.deactivateInstructorSuccess'));
      onChanged();
    } catch {
      toast.error(t('admin:users.details.deactivateInstructorFailed'));
    }
  };

  return (
    <Popover open={isMenuOpen} onOpenChange={setIsMenuOpen}>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='icon'
          aria-label={t('admin:users.details.actionsMenu')}
          disabled={isLoading}
        >
          <LuEllipsisVertical />
        </Button>
      </PopoverTrigger>

      <PopoverContent align='end' className='w-56 p-1'>
        <div className='grid'>
          {isInstructor ? (
            <button
              type='button'
              className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
              disabled={isLoading}
              onClick={() => void handleDeactivateInstructor()}
            >
              {t('admin:users.details.deactivateInstructor')}
            </button>
          ) : (
            <button
              type='button'
              className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
              disabled={isLoading}
              onClick={() => void handleInviteInstructor()}
            >
              {t('admin:users.details.convertToInstructor')}
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
