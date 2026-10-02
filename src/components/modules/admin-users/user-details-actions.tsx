import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuEllipsisVertical } from 'react-icons/lu';
import { toast } from 'sonner';

import { ConfirmDialog } from '@components/modals';
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui';
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
  isSubstitute: boolean;
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
  isSubstitute,
  onChanged,
}: UserDetailsActionsProps) {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    'deactivateUser' | 'deactivateInstructor' | 'convertSubstitute' | null
  >(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteAsSubstitute, setInviteAsSubstitute] = useState(false);
  const [issuedActivationLink, setIssuedActivationLink] = useState<string | null>(null);
  const canManageUsers = useOrPermissions(AdminPermissions.users);

  const { call: inviteInstructor, isLoading: isInviting } = useCallablePromise((id: string, asSubstitute: boolean) =>
    DansshipAPI.instructorsAdmin.inviteInstructor(id, {
      is_substitute: asSubstitute,
    }),
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
  const { call: convertSubstituteToRegular, isLoading: isConvertingSubstitute } = useCallablePromise((id: string) =>
    DansshipAPI.instructorsAdmin.convertSubstituteToRegular(id),
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
  const canConvertSubstitute = isSubstitute && instructorBusinessStatus === 'active' && isInstructor;
  const isLoading =
    isInviting ||
    isDeactivatingUser ||
    isReactivatingUser ||
    isDeactivatingInstructor ||
    isReactivatingInstructor ||
    isConvertingSubstitute;

  if (!canManageUsers) {
    return null;
  }

  const openInviteDialog = () => {
    setIsMenuOpen(false);
    setInviteAsSubstitute(isSubstitute);
    setIssuedActivationLink(null);
    setInviteDialogOpen(true);
  };

  const closeInviteDialog = () => {
    setInviteDialogOpen(false);
    setIssuedActivationLink(null);
  };

  const handleInviteInstructor = async () => {
    try {
      const response = await inviteInstructor(userId, inviteAsSubstitute);

      if (!response.ok) {
        toast.error(t('admin:users.details.inviteInstructorFailed'));

        return;
      }

      toast.success(
        t('admin:users.details.inviteInstructorSuccess', {
          email: userEmail,
        }),
      );

      if (response.data?.activation_link) {
        setIssuedActivationLink(response.data.activation_link);
      }

      onChanged();
    } catch {
      toast.error(t('admin:users.details.inviteInstructorFailed'));
    }
  };

  const handleCopyActivationLink = async () => {
    if (!issuedActivationLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(issuedActivationLink);
      toast.success(t('admin:users.details.copyInstructorInviteLinkSuccess'));
    } catch {
      toast.error(t('admin:users.details.copyInstructorInviteLinkFailed'));
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

  const handleConvertSubstitute = async () => {
    try {
      const response = await convertSubstituteToRegular(userId);

      if (!response.ok) {
        toast.error(t('admin:users.details.convertSubstituteToRegularFailed'));

        return;
      }

      setPendingAction(null);
      setIsMenuOpen(false);
      toast.success(t('admin:users.details.convertSubstituteToRegularSuccess'));
      onChanged();
    } catch {
      toast.error(t('admin:users.details.convertSubstituteToRegularFailed'));
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
    canReactivateInstructor ||
    canConvertSubstitute;

  if (!hasActions) {
    return null;
  }

  const confirmDialog =
    pendingAction === 'deactivateUser'
      ? {
          title: t('admin:users.details.deactivateUserConfirmTitle'),
          description: t('admin:users.details.deactivateUserConfirmDescription', { email: userEmail }),
          confirmLabel: t('admin:users.details.deactivateUser'),
          confirmVariant: 'destructive' as const,
          onConfirm: handleDeactivateUser,
          isLoading: isDeactivatingUser,
        }
      : pendingAction === 'deactivateInstructor'
        ? {
            title: t('admin:users.details.deactivateInstructorConfirmTitle'),
            description: t('admin:users.details.deactivateInstructorConfirmDescription', { email: userEmail }),
            confirmLabel: t('admin:users.details.deactivateInstructor'),
            confirmVariant: 'destructive' as const,
            onConfirm: handleDeactivateInstructor,
            isLoading: isDeactivatingInstructor,
          }
        : pendingAction === 'convertSubstitute'
          ? {
              title: t('admin:users.details.convertSubstituteToRegularConfirmTitle'),
              description: t('admin:users.details.convertSubstituteToRegularConfirmDescription', { email: userEmail }),
              confirmLabel: t('admin:users.details.convertSubstituteToRegular'),
              confirmVariant: 'default' as const,
              onConfirm: handleConvertSubstitute,
              isLoading: isConvertingSubstitute,
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

            {canConvertSubstitute ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={() => {
                  setIsMenuOpen(false);
                  setPendingAction('convertSubstitute');
                }}
              >
                {t('admin:users.details.convertSubstituteToRegular')}
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
                onClick={openInviteDialog}
              >
                {t('admin:users.details.convertToInstructor')}
              </button>
            ) : null}

            {canResendInstructorInvite ? (
              <button
                type='button'
                className='rounded-md px-3 py-2 text-left text-sm hover:bg-accent disabled:opacity-50'
                disabled={isLoading}
                onClick={openInviteDialog}
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
          confirmVariant={confirmDialog.confirmVariant ?? 'destructive'}
          isLoading={confirmDialog.isLoading}
        />
      ) : null}

      <Dialog
        open={inviteDialogOpen}
        onOpenChange={open => {
          if (!open) {
            closeInviteDialog();
          }
        }}
      >
        <DialogContent className='sm:max-w-106.25'>
          {issuedActivationLink ? (
            <>
              <DialogHeader>
                <DialogTitle>{t('admin:users.details.instructorInviteLinkTitle')}</DialogTitle>
                <DialogDescription>{t('admin:users.details.instructorInviteLinkDescription')}</DialogDescription>
              </DialogHeader>
              <p className='break-all text-sm text-foreground'>{issuedActivationLink}</p>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={closeInviteDialog}>
                  {t('common:close')}
                </Button>
                <Button type='button' onClick={() => void handleCopyActivationLink()}>
                  {t('admin:users.details.copyInstructorInviteLink')}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t('admin:users.details.instructorInviteChoiceTitle')}</DialogTitle>
                <DialogDescription>{t('admin:users.details.instructorInviteChoiceDescription')}</DialogDescription>
              </DialogHeader>
              <fieldset className='grid gap-2'>
                <legend className='text-sm font-medium text-foreground'>
                  {t('admin:users.details.instructorInviteKindLabel')}
                </legend>
                <Label className='font-normal'>
                  <input
                    type='radio'
                    name='instructor-invite-kind'
                    checked={!inviteAsSubstitute}
                    onChange={() => setInviteAsSubstitute(false)}
                  />
                  {t('admin:users.details.instructorInviteKindInstructor')}
                </Label>
                <Label className='font-normal'>
                  <input
                    type='radio'
                    name='instructor-invite-kind'
                    checked={inviteAsSubstitute}
                    onChange={() => setInviteAsSubstitute(true)}
                  />
                  {t('admin:users.details.instructorInviteKindSubstitute')}
                </Label>
              </fieldset>
              <DialogFooter>
                <Button type='button' variant='outline' onClick={closeInviteDialog} disabled={isInviting}>
                  {t('common:cancel')}
                </Button>
                <Button type='button' onClick={() => void handleInviteInstructor()} disabled={isInviting}>
                  {t('admin:users.details.sendInstructorInvite')}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
