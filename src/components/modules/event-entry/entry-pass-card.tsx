import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { LuWifiOff } from 'react-icons/lu';

import { CountdownRing } from './countdown-ring';
import { EntryQrCanvas } from './entry-qr-canvas';

import { type EntryPass } from '@core/api';
import { useDateLocale } from '@hooks';

interface EntryPassCardProps {
  pass: EntryPass;
  fraction: number;
  isOnline: boolean;
  /** Last refresh failed while the browser still says online (weak signal, 429, 5xx). */
  isStale?: boolean;
}

/** The QR screen: big rotating code, ring, holder, minors; offline shows the email to find them by. */
export function EntryPassCard({ pass, fraction, isOnline, isStale = false }: EntryPassCardProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const start = new Date(pass.event.starts_at);
  const entered = pass.entered_at ? new Date(pass.entered_at) : null;
  const live = isOnline && !isStale;

  return (
    <article className='mx-auto grid w-full max-w-sm gap-4 rounded-3xl border border-primary/20 bg-white p-4 shadow-sm'>
      <header className='grid gap-1 text-center'>
        <p className='m-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase'>{pass.type_name}</p>
        <h1 className='m-0 font-title text-xl leading-tight font-bold text-foreground'>{pass.event.name}</h1>
        <p className='m-0 text-sm text-muted-foreground'>
          {[format(start, t('eventos:entry.dateFormat'), { locale }), pass.event.place].filter(Boolean).join(' · ')}
        </p>
      </header>

      <EntryQrCanvas code={pass.code} dimmed={!live || Boolean(entered)} />

      {entered ? (
        <p
          className='m-0 rounded-xl bg-active-50 px-3 py-2 text-center text-sm font-semibold text-active-700'
          role='status'
        >
          {t('eventos:entry.entered', { time: format(entered, 'HH:mm') })}
        </p>
      ) : live ? (
        <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
          <CountdownRing fraction={fraction} />
          <span>{t('eventos:entry.autoRefresh')}</span>
        </div>
      ) : null}

      {!live ? (
        <div className='grid gap-1 rounded-xl border border-warning-300 bg-warning-50 p-3 text-center' role='status'>
          <p className='m-0 flex items-center justify-center gap-2 text-sm font-semibold text-foreground'>
            <LuWifiOff aria-hidden className='size-4' />
            {isOnline ? t('eventos:entry.staleTitle') : t('eventos:entry.offlineTitle')}
          </p>
          <p className='m-0 text-xs text-muted-foreground'>
            {isOnline ? t('eventos:entry.staleHint') : t('eventos:entry.offlineHint')}
          </p>
          {pass.email ? (
            <p className='m-0 break-all font-title text-lg font-bold text-foreground'>{pass.email}</p>
          ) : null}
        </div>
      ) : null}

      <div className='grid gap-1 text-center'>
        <p className='m-0 font-title text-2xl leading-tight font-bold break-words text-foreground'>
          {pass.holder_name}
        </p>
        {!entered ? <p className='m-0 text-sm text-muted-foreground'>{t('eventos:entry.instructions')}</p> : null}
        {pass.minors.length > 0 ? (
          <p className='m-0 text-sm text-foreground'>
            {t('eventos:entry.minors', { names: pass.minors.map(minor => minor.full_name).join(', ') })}
          </p>
        ) : null}
      </div>
    </article>
  );
}
