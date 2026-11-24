import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { SignupPayActions } from './signup-pay-actions';

import { SignupStatusBadge } from '@components/modules/event-participation';
import { canOpenEntry, entryHistoryState, type MyParticipationRow } from '@core/api';
import { PageURLS } from '@core/constants';
import { cn } from '@helpers';
import { useDateLocale } from '@hooks';

interface ParticipationReservationCardProps {
  row: MyParticipationRow;
  tone?: 'upcoming' | 'history';
}

/**
 * A row of "Mis reservas" for a participant-type event (ADR-064): the artist registration
 * ("Ver inscripción") or one adult ticket, with the minors who enter with it and "Volver a pagar".
 */
export function ParticipationReservationCard({ row, tone = 'upcoming' }: ParticipationReservationCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const locale = useDateLocale();
  const start = new Date(row.starts_at);
  const history = tone === 'history' ? entryHistoryState(row) : null;
  const performed = tone === 'history' && !row.issues_entry_qr && row.kind === 'signup' && row.status === 'approved';
  const showEntry = tone === 'upcoming' && canOpenEntry(row);

  return (
    <article
      className={cn(
        'flex min-w-0 items-start gap-[13px] rounded-[14px] border bg-white px-[13px] py-3',
        tone === 'upcoming' ? 'border-primary/20' : 'border-border',
      )}
    >
      <div
        className={cn(
          'flex w-[52px] shrink-0 flex-col items-center gap-px rounded-[11px] py-2 text-center',
          tone === 'upcoming' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground',
        )}
      >
        <span className='text-[9.5px] font-semibold tracking-[0.08em] uppercase opacity-75'>
          {format(start, 'EEE', { locale })}
        </span>
        <span className='font-title text-[19px] leading-none font-bold'>{format(start, 'd')}</span>
        <span className='text-[9.5px] font-medium uppercase opacity-75'>{format(start, 'MMM', { locale })}</span>
      </div>
      <div className='min-w-0 flex-1'>
        <h3 className='m-0 min-w-0 break-words font-title text-base leading-none font-semibold text-foreground'>
          {row.event_name}
        </h3>
        <p className='mt-1 text-[12.5px] leading-[1.4] text-muted-foreground'>
          {[
            format(start, 'HH:mm'),
            row.place_label,
            row.kind === 'signup'
              ? t('bookings:participation.signupLabel', { type: row.participant_type_name })
              : t('bookings:participation.ticketFor', { name: row.holder_name ?? '' }),
          ]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {row.kind === 'ticket' && row.minors.length > 0 ? (
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('bookings:participation.withMinors', { names: row.minors.join(', ') })}
          </p>
        ) : null}
        {row.kind === 'signup' && row.holder_name ? (
          <p className='mt-1 text-xs text-muted-foreground'>
            {t('bookings:participation.actName', { name: row.holder_name })}
          </p>
        ) : null}
        <div className='mt-2 flex min-w-0 flex-wrap items-center justify-between gap-2'>
          {history ? (
            <p className='m-0 text-xs font-medium text-muted-foreground'>
              {t(`bookings:participation.history.${history}`, {
                time: row.entered_at ? format(new Date(row.entered_at), 'HH:mm') : '',
              })}
            </p>
          ) : performed ? (
            <p className='m-0 text-xs font-medium text-muted-foreground'>{t('bookings:participation.performed')}</p>
          ) : (
            <SignupStatusBadge status={row.status} />
          )}
          {showEntry ? (
            <Button
              color='primary'
              variant='solid'
              size='small'
              type='button'
              onClick={() => navigate(PageURLS.profile.entry(row.person_id ?? ''), { viewTransition: true })}
            >
              {row.kind === 'signup' ? t('bookings:participation.viewMyEntry') : t('bookings:participation.viewQr')}
            </Button>
          ) : null}
          {row.repayable && row.purchase_id ? (
            <Button
              color='primary'
              variant='solid'
              size='small'
              type='button'
              onClick={() =>
                navigate(PageURLS.eventoRepay(row.event_slug, row.purchase_id ?? ''), { viewTransition: true })
              }
            >
              {t('bookings:participation.repay')}
            </Button>
          ) : null}
          {row.kind === 'ticket' && !row.repayable && row.payment_intent_id && row.status === 'pending_payment' ? (
            <Button
              color='primary'
              variant='outlined'
              size='small'
              type='button'
              onClick={() => navigate(`${PageURLS.paymentsResult}?intentId=${row.payment_intent_id}`)}
            >
              {t('bookings:viewPayment')}
            </Button>
          ) : null}
          {row.kind === 'signup' && !row.is_attendee && row.signup_id ? (
            <Button
              color='primary'
              variant='outlined'
              size='small'
              type='button'
              onClick={() => navigate(PageURLS.profile.signup(row.signup_id ?? ''), { viewTransition: true })}
            >
              {t('bookings:participation.viewSignup')}
            </Button>
          ) : null}
        </div>
        {tone === 'upcoming' && !row.is_attendee ? <SignupPayActions row={row} /> : null}
      </div>
    </article>
  );
}
