import { useTranslation } from 'react-i18next';

import { EntryPassCard } from './entry-pass-card';
import { useCountdown } from './use-countdown';
import { useEntryCode } from './use-entry-code';

import { SpinnerLoader } from '@components/loaders';
import { type EntryPass } from '@core/api';

interface EntryQrScreenProps {
  load: () => Promise<{ ok: boolean; data?: EntryPass | null; error?: unknown }>;
  cacheKey: string;
}

/** Shared by "Ver QR" (Mis reservas) and the public "Tu entrada" page. */
export function EntryQrScreen({ load, cacheKey }: EntryQrScreenProps) {
  const { t } = useTranslation();
  const { pass, skewMs, errorCode, isLoading, isOnline, isStale } = useEntryCode(load, cacheKey);
  const fraction = useCountdown(pass?.refresh_at ?? null, pass?.rotation_seconds ?? null, skewMs);

  if (isLoading && !pass) {
    return <SpinnerLoader />;
  }

  if (!pass) {
    return (
      <div
        className='mx-auto grid max-w-sm gap-2 rounded-2xl border border-border bg-white p-6 text-center'
        role='alert'
      >
        <p className='m-0 font-title text-lg font-bold'>{t('eventos:entry.unavailableTitle')}</p>
        <p className='m-0 text-sm text-muted-foreground'>
          {t(`errors:codes.${errorCode ?? 'ENTRY_PERSON_NOT_FOUND'}`, {
            defaultValue: t('eventos:entry.loadFailed'),
          })}
        </p>
      </div>
    );
  }

  return <EntryPassCard pass={pass} fraction={fraction} isOnline={isOnline} isStale={isStale} />;
}
