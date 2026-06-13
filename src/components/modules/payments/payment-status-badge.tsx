import { useTranslation } from 'react-i18next';

import { Badge } from '@components/ui';
import { type PaymentStatus } from '@core/api';

const STATUS_VARIANT: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'secondary',
  pending_manual_review: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  cancelled: 'outline',
  expired: 'outline',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();

  return (
    <Badge variant={STATUS_VARIANT[status]} className='capitalize'>
      {t(`payments.status.${status}`)}
    </Badge>
  );
}
