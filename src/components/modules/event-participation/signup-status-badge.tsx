import { useTranslation } from 'react-i18next';

import { Badge } from '@components/ui';
import { signupStatusLabel, signupStatusTone, type EventSignupStatus } from '@core/api';

const TONE_BADGE = { approved: 'outlineActive', review: 'outlineWarning', rejected: 'outlineNeutral' } as const;

/** Status as the signer reads it ("En revisión", "Aprobada", "No aprobada"). */
export function SignupStatusBadge({ status }: { status: EventSignupStatus }) {
  const { t } = useTranslation();

  return (
    <Badge variant={TONE_BADGE[signupStatusTone(status)]} size='small'>
      {signupStatusLabel(status, t, 'signer')}
    </Badge>
  );
}
