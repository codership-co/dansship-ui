import { format, parseISO } from 'date-fns';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuCalendar, LuChevronRight } from 'react-icons/lu';
import { Link, useParams } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { CollaboratorWorkshop } from '@components/modules/talleres/collaborator-workshop';
import { Badge } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI, type CollaboratorWorkshopSummary } from '@core/api';
import { PageURLS } from '@core/constants';
import { useDateLocale, usePromise } from '@hooks';

function ManagedWorkshopsPage() {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.talleres.listCollaborations());
  const workshops = response?.data ?? [];

  return (
    <Section navbarPadding>
      <SectionHeading title={t('talleres:managed.title')} subtitle={t('talleres:managed.subtitle')} />
      {isLoading || response === null ? (
        <SpinnerLoader />
      ) : workshops.length === 0 ? (
        <p className='text-muted-foreground'>{t('talleres:managed.empty')}</p>
      ) : (
        <div className='grid gap-3'>
          {workshops.map(workshop => (
            <CollaboratorWorkshopRow key={workshop.id} workshop={workshop} />
          ))}
        </div>
      )}
    </Section>
  );
}

function CollaboratorWorkshopRow({ workshop }: { workshop: CollaboratorWorkshopSummary }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const date = format(parseISO(workshop.starts_at), 'EEE. d MMM, yyyy', { locale }).toLowerCase();
  const pending = workshop.pending_review_count ?? 0;

  return (
    <Link
      className='flex items-center gap-4 rounded-2xl border bg-white px-4 py-3 text-foreground'
      to={PageURLS.managedWorkshop(workshop.id)}
    >
      <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-tertiary/25 text-tertiary'>
        <LuCalendar className='size-5' />
      </span>
      <span className='min-w-0 flex-1'>
        <span className='block truncate font-semibold'>{workshop.name}</span>
        <span className='block truncate text-sm text-muted-foreground'>
          {date} · {t('talleres:managed.enrolled', { count: workshop.enrolled_count ?? 0 })}
        </span>
      </span>
      {pending > 0 ? (
        <Badge variant='outlineTertiary' size='small'>
          {t('talleres:managed.pendingReview', { count: pending })}
        </Badge>
      ) : null}
      <LuChevronRight className='size-4 shrink-0 text-muted-foreground' />
    </Link>
  );
}

function ManagedWorkshopDetailPage() {
  const { t } = useTranslation();
  const { workshopId = '' } = useParams();
  const { response: rosterResponse, reFetch: reFetchRoster } = usePromise(
    () => DansshipAPI.talleres.collaboratorRoster(workshopId),
    Boolean(workshopId),
    [workshopId],
  );
  const { response: paymentsResponse, reFetch: reFetchPayments } = usePromise(
    () => DansshipAPI.talleres.collaboratorPayments(workshopId),
    Boolean(workshopId),
    [workshopId],
  );
  const { response: listResponse } = usePromise(() => DansshipAPI.talleres.listCollaborations());
  const workshop = (listResponse?.data ?? []).find(item => item.id === workshopId);
  const [qrUrl, setQrUrl] = useState<string | null>(null);

  useEffect(() => {
    setQrUrl(workshop?.payment_qr_url ?? null);
  }, [workshop?.payment_qr_url]);

  const waiting = listResponse === null || rosterResponse === null || paymentsResponse === null;

  return (
    <Section navbarPadding>
      {waiting ? (
        <SpinnerLoader />
      ) : !workshop ? (
        <div className='grid gap-4'>
          <Link className='w-fit text-sm font-semibold text-primary' to={PageURLS.managedWorkshops}>
            {`‹ ${t('talleres:managed.back')}`}
          </Link>
          <p className='text-muted-foreground'>{t('talleres:managed.empty')}</p>
        </div>
      ) : (
        <CollaboratorWorkshop
          workshop={{ ...workshop, payment_qr_url: qrUrl }}
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

export const SecureManagedWorkshopsPage = SecurityGuard(ManagedWorkshopsPage, {
  requiresAuth: true,
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
  redirect: PageURLS.auth.login,
});

export const SecureManagedWorkshopDetailPage = SecurityGuard(ManagedWorkshopDetailPage, {
  requiresAuth: true,
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled, FEATURE_FLAG.isTalleresPageEnabled],
  redirect: PageURLS.auth.login,
});
