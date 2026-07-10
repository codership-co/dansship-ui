import { useTranslation } from 'react-i18next';

import { Badge } from '@components/ui';
import { PaymentStatus } from '@core/api';

const STATUS_VARIANT: Record<PaymentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  [PaymentStatus.PENDING]: 'secondary',
  [PaymentStatus.PENDING_MANUAL_REVIEW]: 'secondary',
  [PaymentStatus.APPROVED]: 'default',
  [PaymentStatus.REJECTED]: 'destructive',
  [PaymentStatus.CANCELLED]: 'destructive',
  [PaymentStatus.EXPIRED]: 'destructive',
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const { t } = useTranslation();

  return (
    <Badge variant={STATUS_VARIANT[status]} className='capitalize'>
      {t(`payments:status.${status}`)}
    </Badge>
  );
}
