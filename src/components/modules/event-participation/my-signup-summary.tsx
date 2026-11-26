import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';

import { MyFileAnswer } from './my-file-answer';
import { SignupStatusBadge } from './signup-status-badge';

import { SectionHeading } from '@components/containers';
import { answerText, bogotaDayLabel, type MySignup } from '@core/api';
import { PageURLS } from '@core/constants';
import { buildStudioWhatsAppLink, formatDateTime } from '@helpers';

function statusMessage(signup: MySignup, t: (key: string, options?: Record<string, unknown>) => string) {
  if (signup.status === 'not_approved') return t('eventos:participation.mine.notApproved');

  if (!signup.editable && signup.status !== 'approved') {
    return t('eventos:participation.mine.closed', { date: bogotaDayLabel(signup.closes_at) });
  }

  if (signup.status === 'approved') return t('eventos:participation.mine.approved');

  return t('eventos:participation.mine.inReview');
}

/** "Tu inscripción": what she sent, its status and "Editar inscripción" until the close date. */
export function MySignupSummary({ signup }: { signup: MySignup }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const closesLabel = bogotaDayLabel(signup.closes_at);
  const showEdit = signup.status !== 'not_approved';

  return (
    <div className='grid gap-5'>
      <div className='grid gap-1'>
        <Link className='text-sm font-semibold text-primary' to={PageURLS.profile.bookings} viewTransition>
          {t('eventos:participation.mine.back')}
        </Link>
        <SectionHeading
          className='mb-0'
          title={t('eventos:participation.mine.title')}
          subtitle={[signup.event_name, formatDateTime(signup.starts_at, 'es'), signup.place_label]
            .filter(Boolean)
            .join(' · ')}
        />
      </div>
      <section className='grid gap-2 rounded-[14px] border border-border bg-white p-4'>
        <SignupStatusBadge status={signup.status} />
        <p className='m-0 text-sm'>{statusMessage(signup, t)}</p>
      </section>
      <section className='grid gap-3 rounded-[14px] border border-border bg-white p-4'>
        <h2 className='m-0 text-base font-semibold'>{t('eventos:participation.mine.sent')}</h2>
        <dl className='m-0 grid gap-3'>
          {signup.answers.map(item =>
            item.kind === 'file' ? (
              <MyFileAnswer
                key={item.key}
                signupId={signup.id}
                participantTypeId={signup.participant_type_id}
                answer={item}
              />
            ) : (
              <div key={item.key} className='grid gap-0.5'>
                <dt className='text-xs font-semibold text-muted-foreground'>{item.label}</dt>
                <dd className='m-0 text-sm break-words whitespace-pre-wrap'>{answerText(item.value, t)}</dd>
              </div>
            ),
          )}
          {signup.members.length > 0 ? (
            <div className='grid gap-0.5'>
              <dt className='text-xs font-semibold text-muted-foreground'>{t('eventos:participation.mine.members')}</dt>
              <dd className='m-0 text-sm'>
                {signup.members
                  .map(member =>
                    member.is_minor
                      ? t('eventos:participation.mine.minorMember', { name: member.full_name })
                      : member.full_name,
                  )
                  .join(', ')}
              </dd>
            </div>
          ) : null}
          {signup.donations.length > 0 ? (
            <div className='grid gap-0.5'>
              <dt className='text-xs font-semibold text-muted-foreground'>
                {t('eventos:participation.mine.donations')}
              </dt>
              <dd className='m-0 text-sm'>{signup.donations.join(', ')}</dd>
            </div>
          ) : null}
        </dl>
      </section>
      {showEdit ? (
        <div className='grid justify-items-end gap-2'>
          {signup.editable && closesLabel ? (
            <p className='m-0 text-sm text-muted-foreground'>
              {t('eventos:participation.form.editUntil', { date: closesLabel })}
            </p>
          ) : null}
          <Button
            type='button'
            variant='solid'
            color='primary'
            disabled={!signup.editable}
            onClick={() => navigate(PageURLS.profile.signupEdit(signup.id), { viewTransition: true })}
          >
            {t('eventos:participation.mine.edit')}
          </Button>
        </div>
      ) : (
        <p className='m-0 text-sm text-muted-foreground'>
          <a
            className='font-semibold text-primary'
            href={buildStudioWhatsAppLink()}
            target='_blank'
            rel='noopener noreferrer'
          >
            {t('eventos:participation.card.contact')}
          </a>
        </p>
      )}
    </div>
  );
}
