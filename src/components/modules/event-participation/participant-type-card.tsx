import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Badge } from '@components/ui';
import { bogotaDayLabel, displayPrice, type LandingParticipantType } from '@core/api';
import { PageURLS } from '@core/constants';
import { buildStudioWhatsAppLink, formatPrice } from '@helpers';

interface ParticipantTypeCardProps {
  type: LandingParticipantType;
  /** The person wants to sign up (the landing decides login, simple registration or the form). */
  onStart: (type: LandingParticipantType) => void;
}

/** One card per active participant type on the event page: its copy, price and state. */
export function ParticipantTypeCard({ type, onStart }: ParticipantTypeCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const open = type.state === 'open';
  const closesLabel = bogotaDayLabel(type.closes_at);
  const prices = displayPrice(type, t('eventos:participation.card.minorsRow', { age: type.minors.max_age ?? '' }));
  const title = type.card_copy.title || type.name;

  return (
    <section className='grid gap-3 rounded-[14px] border border-primary/30 bg-white p-4'>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        {/* Theme heading size (between the event name and the body text). */}
        <h2 className='m-0 text-header4'>{title}</h2>
        {type.state === 'sold_out' ? (
          <Badge variant='destructive' size='small'>
            {t('eventos:participation.card.soldOut')}
          </Badge>
        ) : type.state === 'closed' ? (
          <Badge variant='outlineNeutral' size='small'>
            {t('eventos:participation.card.closed')}
          </Badge>
        ) : null}
      </div>
      {open ? (
        <p className='m-0 leading-relaxed whitespace-pre-line text-muted-foreground'>
          {type.card_copy.text || (closesLabel ? t('eventos:participation.card.openUntil', { date: closesLabel }) : '')}
        </p>
      ) : (
        <p className='m-0 leading-relaxed whitespace-pre-line text-muted-foreground'>
          {type.card_copy.closing_message ||
            (type.state === 'sold_out'
              ? t('eventos:participation.card.soldOutText')
              : t('eventos:participation.card.defaultClosed'))}
        </p>
      )}
      {prices.length > 0 ? (
        <ul className='m-0 grid list-none gap-1 p-0 text-sm'>
          {prices.map(row => (
            <li key={row.label} className='flex justify-between gap-3'>
              <span>{row.label}</span>
              <span className='font-semibold'>
                {row.price === null
                  ? t('eventos:participation.free')
                  : row.from
                    ? t('eventos:participation.card.from', { price: formatPrice(row.price, 'COP') })
                    : formatPrice(row.price, 'COP')}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      {/* Full width on phones (easy to reach with the thumb), right-aligned from tablets up. */}
      <div className='grid gap-2 sm:flex sm:flex-wrap sm:justify-end'>
        {type.my_signup_id ? (
          <Button
            className='w-full sm:w-auto'
            type='button'
            variant='outlined'
            color='primary'
            onClick={() => navigate(PageURLS.profile.signup(type.my_signup_id ?? ''), { viewTransition: true })}
          >
            {t('eventos:participation.card.viewSignup')}
          </Button>
        ) : open ? (
          <Button
            className='w-full sm:w-auto'
            type='button'
            variant='solid'
            color='primary'
            onClick={() => onStart(type)}
          >
            {type.card_copy.button_text || t('eventos:participation.card.defaultCta')}
          </Button>
        ) : (
          <a href={buildStudioWhatsAppLink()} target='_blank' rel='noopener noreferrer'>
            <Button className='w-full sm:w-auto' type='button' variant='outlined' color='primary'>
              {t('eventos:participation.card.contact')}
            </Button>
          </a>
        )}
      </div>
    </section>
  );
}
