import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { bogotaDayLabel, type LandingParticipantType } from '@core/api';
import { PageURLS } from '@core/constants';
import { buildStudioWhatsAppLink } from '@helpers';

interface ArtistSignupCardProps {
  slug: string;
  type: LandingParticipantType;
  accessToken: string | null;
}

/** "¿Te vas a presentar?" on the event page reached by the artists' link, and its closed variant. */
export function ArtistSignupCard({ slug, type, accessToken }: ArtistSignupCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const closed = type.state !== 'open';
  const closesLabel = bogotaDayLabel(type.closes_at);

  const open = () => {
    if (type.my_signup_id) {
      navigate(PageURLS.profile.signup(type.my_signup_id), { viewTransition: true });

      return;
    }

    // Without a session the form page sends her to sign in and brings her back to the link.
    navigate(PageURLS.eventoSignupForm(slug, type.id, accessToken), { viewTransition: true });
  };

  return (
    <section className='grid gap-3 rounded-[14px] border border-primary/30 bg-white p-4'>
      <h2 className='m-0 text-base font-semibold'>
        {closed ? t('eventos:participation.card.closedTitle') : t('eventos:participation.card.title')}
      </h2>
      <p className='m-0 text-sm text-muted-foreground'>
        {closed
          ? t('eventos:participation.card.closedText')
          : closesLabel
            ? t('eventos:participation.card.textUntil', { date: closesLabel })
            : t('eventos:participation.card.text')}
      </p>
      <div className='flex flex-wrap justify-end gap-2'>
        {type.my_signup_id ? (
          <Button type='button' variant='outlined' color='primary' onClick={open}>
            {t('eventos:participation.card.viewSignup')}
          </Button>
        ) : closed ? (
          <a
            className='text-sm font-semibold text-primary'
            href={buildStudioWhatsAppLink()}
            target='_blank'
            rel='noopener noreferrer'
          >
            {t('eventos:participation.card.contact')}
          </a>
        ) : (
          <Button type='button' variant='solid' color='primary' onClick={open}>
            {t('eventos:participation.card.cta')}
          </Button>
        )}
      </div>
    </section>
  );
}
