import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCalendar, LuChevronRight } from 'react-icons/lu';
import { Link, useParams } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { CollaboratorEvent } from '@components/modules/eventos/collaborator-event';
import { Badge } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI, type CollaboratorEventSummary } from '@core/api';
import { PageURLS } from '@core/constants';
import { useDateLocale, usePromise } from '@hooks';

function ManagedEventsPage() {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.eventos.listCollaborations());
  const events = response?.data ?? [];

  return (
    <Section navbarPadding>
      <SectionHeading title={t('eventos:managed.title')} subtitle={t('eventos:managed.subtitle')} />
      {isLoading || response === null ? (
        <SpinnerLoader />
      ) : events.length === 0 ? (
        <p className='text-muted-foreground'>{t('eventos:managed.empty')}</p>
      ) : (
        <div className='grid gap-3'>
          {events.map(event => (
            <CollaboratorEventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </Section>
  );
}

function CollaboratorEventRow({ event }: { event: CollaboratorEventSummary }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const date = format(parseISO(event.starts_at), 'EEE. d MMM, yyyy', { locale }).toLowerCase();
  const pending = event.pending_review_count ?? 0;

  return (
    <Link
      className='flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-foreground'
      to={PageURLS.managedEvent(event.id)}
    >
      <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-tertiary/25 text-tertiary'>
        <LuCalendar className='size-5' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate font-semibold'>{event.name}</span>
        <span className='block truncate text-sm text-muted-foreground'>
          {date} · {t('eventos:managed.enrolled', { count: event.enrolled_count ?? 0 })}
        </span>
      </span>
      {pending > 0 ? (
        <Badge variant='outlineTertiary' size='small'>
          {t('eventos:managed.pendingReview', { count: pending })}
        </Badge>
      ) : null}
      <LuChevronRight className='size-4 shrink-0 text-muted-foreground' />
    </Link>
  );
}

function ManagedEventDetailPage() {
  const { t } = useTranslation();
  const { eventId = '' } = useParams();
  const { response: rosterResponse, reFetch: reFetchRoster } = usePromise(
    () => DansshipAPI.eventos.collaboratorRoster(eventId),
    Boolean(eventId),
    [eventId],
  );
  const { response: paymentsResponse, reFetch: reFetchPayments } = usePromise(
    () => DansshipAPI.eventos.collaboratorPayments(eventId),
    Boolean(eventId),
    [eventId],
  );
  const { response: listResponse } = usePromise(() => DansshipAPI.eventos.listCollaborations());
  const event = (listResponse?.data ?? []).find(item => item.id === eventId);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    setQrUrl(event?.payment_qr_url ?? null);
  }, [event?.payment_qr_url]);

  const waiting = listResponse === null || rosterResponse === null || paymentsResponse === null;

  return (
    <Section navbarPadding>
      {waiting ? (
        <SpinnerLoader />
      ) : !event ? (
        <div className='grid gap-4'>
          <Link className='w-fit text-sm font-semibold text-primary' to={PageURLS.managedEvents}>
            {`‹ ${t('eventos:managed.back')}`}
          </Link>
          <p className='text-muted-foreground'>{t('eventos:managed.empty')}</p>
        </div>
      ) : (
        <CollaboratorEvent
          event={{ ...event, payment_qr_url: qrUrl }}
          roster={rosterResponse?.data ?? []}
          payments={paymentsResponse?.data ?? []}
          onRegistered={async () => {
            await reFetchRoster();
            await reFetchPayments();
          }}
          onReviewed={async () => {
            await reFetchPayments();
            await reFetchRoster();
          }}
          onQrSaved={setQrUrl}
        />
      )}
    </Section>
  );
}

export const SecureManagedEventsPage = SecurityGuard(ManagedEventsPage, {
  requiresAuth: true,
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
  redirect: PageURLS.auth.login,
});

export const SecureManagedEventDetailPage = SecurityGuard(ManagedEventDetailPage, {
  requiresAuth: true,
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
  redirect: PageURLS.auth.login,
});
