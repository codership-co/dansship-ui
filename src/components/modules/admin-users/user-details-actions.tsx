import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEllipsisVertical } from 'react-icons/lu';
import { toast } from 'sonner';

import { ConfirmDialog } from '@components/modals';
import { Button, Popover, PopoverContent, PopoverTrigger } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { AdminPermissions } from '@core/permissions';
import { useCallablePromise } from '@hooks';

interface UserDetailsActionsProps {
  userId: string;
  userEmail: string;
  roleNames: Array<string>;
  isActive: boolean;
  hasInstructorProfile: boolean;
  instructorOnboardingCompleted: boolean;
  instructorBusinessStatus: string | null;
  onChanged: () => void;
}

const normalizeRoleName = (name: string) => name.trim().toLowerCase();

export function UserDetailsActions({
  userId,
  userEmail,
  roleNames,
  isActive,
  hasInstructorProfile,
  instructorOnboardingCompleted,
  instructorBusinessStatus,
  onChanged,
}: UserDetailsActionsProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'deactivateUser' | 'deactivateInstructor' | null>(null);
  const canManageUsers = useOrPermissions(AdminPermissions.users);

  const { call: inviteInstructor, isLoading: isInviting } = useCallablePromise((id: string) =>
    DansshipAPI.instructorsAdmin.inviteInstructor(id),
  );
  const { call: deactivateUser, isLoading: isDeactivatingUser } = useCallablePromise((id: string) =>
    DansshipAPI.usersAdmin.deactivateUser(id),
  );
  const { call: reactivateUser, isLoading: isReactivatingUser } = useCallablePromise((id: string) =>
    DansshipAPI.usersAdmin.reactivateUser(id),
  );
  const { call: deactivateInstructor, isLoading: isDeactivatingInstructor } = useCallablePromise((id: string) =>
    DansshipAPI.instructorsAdmin.deactivateInstructor(id),
  );
  const { call: reactivateInstructor, isLoading: isReactivatingInstructor } = useCallablePromise((id: string) =>
    DansshipAPI.instructorsAdmin.reactivateInstructor(id),
  );

  const isInstructor = useMemo(() => roleNames.some(role => normalizeRoleName(role) === 'instructor'), [roleNames]);
  const canInviteInstructor = !hasInstructorProfile;
  const isPendingInstructorActivation =
    hasInstructorProfile &&
    !isInstructor &&
    !instructorOnboardingCompleted &&
    instructorBusinessStatus !== 'active' &&
    instructorBusinessStatus !== 'inactive';
  const canResendInstructorInvite = isPendingInstructorActivation;
  const canDeactivateUser = isActive;
  const canReactivateUser = !isActive;
  const canDeactivateInstructor = instructorOnboardingCompleted && isInstructor;
  const canReactivateInstructor = hasInstructorProfile && instructorOnboardingCompleted && !isInstructor;
  const isLoading =
    isInviting || isDeactivatingUser || isReactivatingUser || isDeactivatingInstructor || isReactivatingInstructor;

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

  const handleDeactivateUser = async () => {
    try {
      const response = await deactivateUser(userId);

      if (!response.ok) {
        toast.error(t('admin:users.details.deactivateUserFailed'));

        return;
      }

      setPendingAction(null);
      setIsMenuOpen(false);
      toast.success(t('admin:users.details.deactivateUserSuccess'));
      onChanged();
    } catch {
      toast.error(t('admin:users.details.deactivateUserFailed'));
    }
  };

  const handleReactivateUser = async () => {
    try {
      const response = await reactivateUser(userId);

      if (!response.ok) {
        toast.error(t('admin:users.details.reactivateUserFailed'));

        return;
      }

      setIsMenuOpen(false);
      toast.success(t('admin:users.details.reactivateUserSuccess'));
      onChanged();
    } catch {
      toast.error(t('admin:users.details.reactivateUserFailed'));
    }
  };

  const handleDeactivateInstructor = async () => {
    try {
      const response = await deactivateInstructor(userId);

      if (!response.ok) {
        toast.error(t('admin:users.details.deactivateInstructorFailed'));

        return;
      }

      setPendingAction(null);
      setIsMenuOpen(false);
      toast.success(t('admin:users.details.deactivateInstructorSuccess'));
      onChanged();
    } catch {
      toast.error(t('admin:users.details.deactivateInstructorFailed'));
    }
  };

  const handleReactivateInstructor = async () => {
    try {
      const response = await reactivateInstructor(userId);

      if (!response.ok) {
        toast.error(t('admin:users.details.reactivateInstructorFailed'));

        return;
      }

      setIsMenuOpen(false);
      toast.success(t('admin:users.details.reactivateInstructorSuccess'));
      onChanged();
    } catch {
      toast.error(t('admin:users.details.reactivateInstructorFailed'));
    }
  };

  const hasActions =
    canInviteInstructor ||
    canResendInstructorInvite ||
    canDeactivateUser ||
    canReactivateUser ||
    canDeactivateInstructor ||
    canReactivateInstructor;

  if (!hasActions) {
    return null;
  }

  const confirmDialog =
    pendingAction === 'deactivateUser'
      ? {
          title: t('admin:users.details.deactivateUserConfirmTitle'),
          description: t('admin:users.details.deactivateUserConfirmDescription', { email: userEmail }),
          confirmLabel: t('admin:users.details.deactivateUser'),
          onConfirm: handleDeactivateUser,
          isLoading: isDeactivatingUser,
        }
      : pendingAction === 'deactivateInstructor'
        ? {
            title: t('admin:users.details.deactivateInstructorConfirmTitle'),
            description: t('admin:users.details.deactivateInstructorConfirmDescription', { email: userEmail }),
            confirmLabel: t('admin:users.details.deactivateInstructor'),
            onConfirm: handleDeactivateInstructor,
            isLoading: isDeactivatingInstructor,
          }
        : null;

  return (
    <>
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

        <PopoverContent align='end' className='w-64 p-1'>
          <div className='grid'>
            {canDeactivateUser ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={() => {
                  setIsMenuOpen(false);
                  setPendingAction('deactivateUser');
                }}
              >
                {t('admin:users.details.deactivateUser')}
              </button>
            ) : null}

            {canReactivateUser ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={() => void handleReactivateUser()}
              >
                {t('admin:users.details.reactivateUser')}
              </button>
            ) : null}

            {canDeactivateInstructor ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={() => {
                  setIsMenuOpen(false);
                  setPendingAction('deactivateInstructor');
                }}
              >
                {t('admin:users.details.deactivateInstructor')}
              </button>
            ) : null}

            {canReactivateInstructor ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={() => void handleReactivateInstructor()}
              >
                {t('admin:users.details.reactivateInstructor')}
              </button>
            ) : null}

            {canInviteInstructor ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={() => void handleInviteInstructor()}
              >
                {t('admin:users.details.convertToInstructor')}
              </button>
            ) : null}

            {canResendInstructorInvite ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={() => void handleInviteInstructor()}
              >
                {t('admin:users.details.resendInstructorInvite')}
              </button>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>

      {confirmDialog ? (
        <ConfirmDialog
          open={pendingAction !== null}
          onOpenChange={open => {
            if (!open) {
              setPendingAction(null);
            }
          }}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={t('common:cancel')}
          confirmVariant='destructive'
          isLoading={confirmDialog.isLoading}
        />
      ) : null}
    </>
  );
}
