import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { FamilyRegistrationModal } from './family-registration-modal';

import { SectionHeading } from '@components/containers';
import { Badge } from '@components/ui';
import { DansshipAPI, type MinorSummary } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

function initials(minor: MinorSummary) {
  const given = minor.given_name?.trim();
  const family = minor.family_name?.trim();

  if (given && family) {
    return `${given[0]}${family[0]}`.toUpperCase();
  }

  const parts = minor.full_name.trim().split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

function documentLabel(minor: MinorSummary, shortType: string) {
  if (!minor.document_value_masked) {
    return shortType || null;
  }

  return [shortType, minor.document_value_masked].filter(Boolean).join(' ');
}

export function FamilyTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { response, reFetch } = usePromise(() => DansshipAPI.family.listMine());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MinorSummary | null>(null);
  const minors = (response?.data?.minors ?? []).filter(minor => minor.is_active !== false);
  const pending = response?.data?.pending_requests ?? [];

  const close = () => {
    setOpen(false);
    setEditing(null);
  };

  return (
    <section className='grid gap-6' data-sentry-mask>
      <div className='grid justify-items-start gap-4'>
        <SectionHeading className='mb-0' title={t('family:title')} subtitle={t('family:subtitle')} />
        <Button color='primary' onClick={() => setOpen(true)}>
          {t('family:add')}
        </Button>
      </div>

      {pending.map(request => (
        <p key={request.id} className='m-0 text-sm text-muted-foreground'>
          {request.given_name} {request.family_name}: {t('family:pending')}
        </p>
      ))}

      {minors.length === 0 && pending.length === 0 ? <p className='m-0'>{t('family:empty')}</p> : null}

      <ul className='m-0 grid list-none gap-4 p-0'>
        {minors.map(minor => {
          const givenName = minor.given_name?.trim() || minor.full_name;
          const shortType = minor.document_type
            ? t(`family:documentShort.${minor.document_type}`, minor.document_type)
            : '';
          const details = [
            minor.age !== null ? t('family:wizard.ageYears', { count: minor.age }) : null,
            documentLabel(minor, shortType),
            minor.health_summary ? t('family:healthSummary', { summary: minor.health_summary }) : null,
          ].filter(Boolean);

          return (
            <li key={minor.user_id} className='rounded-2xl bg-white px-5 py-5 shadow-sm sm:px-6'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                <div className='flex min-w-0 items-start gap-4'>
                  <span className='grid size-12 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-white'>
                    {initials(minor)}
                  </span>
                  <div className='grid min-w-0 gap-1.5'>
                    <div className='flex flex-wrap items-center gap-2'>
                      <p className='m-0 text-xl font-bold'>{minor.full_name}</p>
                      <Badge variant='outline' size='small' className='border-secondary-800 text-secondary-800'>
                        {t('family:managedBadge')}
                      </Badge>
                      {minor.trial_available ? (
                        <Badge variant='outlineActive' size='small'>
                          {t('family:trialAvailable')}
                        </Badge>
                      ) : minor.trial_used ? (
                        <Badge variant='outlineNeutral' size='small'>
                          {t('family:trialUsed')}
                        </Badge>
                      ) : null}
                    </div>
                    {details.length > 0 ? (
                      <p className='m-0 text-sm text-muted-foreground'>{details.join(' · ')}</p>
                    ) : null}
                  </div>
                </div>
                <div className='flex shrink-0 flex-wrap gap-2'>
                  <Button color='primary' onClick={() => navigate(`${PageURLS.classes}?for=${minor.user_id}`)}>
                    {t('family:bookForName', { name: givenName })}
                  </Button>
                  <Button
                    variant='outlined'
                    color='primary'
                    onClick={() => {
                      setEditing(minor);
                      setOpen(true);
                    }}
                  >
                    {t('family:edit')}
                  </Button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {minors.length > 0 ? <p className='m-0 text-sm text-muted-foreground'>{t('family:identityLockedNote')}</p> : null}

      {open ? (
        <FamilyRegistrationModal
          key={editing?.user_id ?? 'create'}
          minor={editing}
          onClose={close}
          onSaved={async () => {
            close();
            await reFetch();
          }}
        />
      ) : null}
    </section>
  );
}
