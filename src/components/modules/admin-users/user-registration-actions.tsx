import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { TemporaryPasswordPanel } from './temporary-password-panel';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';

interface UserRegistrationActionsProps {
  userId: string;
  email: string;
  isEmailVerified: boolean;
  mustChangePassword: boolean;
}

export function UserRegistrationActions({
  userId,
  email,
  isEmailVerified,
  mustChangePassword,
}: UserRegistrationActionsProps) {
  const { t } = useTranslation();
  const canRegister = useOrPermissions(AdminPermissions.userRegistration);
  const canBuyPlan = useOrPermissions(AdminPermissions.planPurchaseRegistration);
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isReissuing, setIsReissuing] = useState(false);

  if (!canRegister && !canBuyPlan) {
    return null;
  }

  const reissue = async () => {
    setIsReissuing(true);

    try {
      const response = await DansshipAPI.usersAdmin.reissueTemporaryPassword(userId);

      if (!response.ok || !response.data) {
        toast.error(t('admin:users.registration.reissueFailed'));

        return;
      }

      setIssuedPassword(response.data.temporary_password);
      setExpiresAt(response.data.temporary_password_expires_at);
    } finally {
      setIsReissuing(false);
    }
  };

  const resendVerification = async () => {
    try {
      await DansshipAPI.auth.resendVerification({ email });
      toast.success(t('admin:users.registration.resendVerificationSent'));
    } catch {
      toast.error(t('admin:users.registration.resendVerificationFailed'));
    }
  };

  return (
    <div className='flex flex-wrap gap-2'>
      {canRegister ? (
        <Link to={PageURLS.admin.userEdit(userId)}>
          <Button color='primary' variant='outlined' size='small'>
            {t('admin:users.registration.edit')}
          </Button>
        </Link>
      ) : null}
      {canRegister && mustChangePassword ? (
        <Button
          color='primary'
          variant='outlined'
          size='small'
          type='button'
          disabled={isReissuing}
          onClick={() => void reissue()}
        >
          {t('admin:users.registration.reissuePassword')}
        </Button>
      ) : null}
      {canRegister && !isEmailVerified ? (
        <Button color='primary' variant='outlined' size='small' type='button' onClick={() => void resendVerification()}>
          {t('admin:users.registration.resendVerification')}
        </Button>
      ) : null}
      {canBuyPlan ? (
        <Link to={PageURLS.admin.userPlanPurchase(userId)}>
          <Button color='primary' variant='solid' size='small'>
            {t('admin:users.registration.buyPlan')}
          </Button>
        </Link>
      ) : null}
      <Dialog open={issuedPassword !== null} onOpenChange={open => !open && setIssuedPassword(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin:users.registration.passwordOnce')}</DialogTitle>
          </DialogHeader>
          {issuedPassword && expiresAt ? (
            <TemporaryPasswordPanel password={issuedPassword} expiresAt={expiresAt} />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
