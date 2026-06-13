import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { PlanSelector } from '@components/modules';
import { useAuth } from '@contexts';
import { PageURLS } from '@core/constants';

export const HomeMemberships = () => {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();

  const plansPath = isAuthenticated ? PageURLS.myAccountSubscription : PageURLS.auth.login;

  return (
    <Section id='planes' className='text-center'>
      <SectionHeading
        className='mx-auto max-w-2xl'
        centered
        intro={t('home:stitch.membership.kicker')}
        title={t('home:stitch.membership.title')}
        subtitle={t('home:stitch.membership.subtitle', {
          studioName: 'Dansship',
        })}
      />

      <div className='mx-auto mt-8 max-w-6xl text-left'>
        <PlanSelector />
      </div>

      <p className='mx-auto mt-8 max-w-2xl text-[0.92rem] leading-relaxed text-muted-foreground'>
        {t('home:stitch.membership.helpText')}{' '}
        <Link to={plansPath} className='font-semibold text-primary underline-offset-2 transition hover:underline'>
          {t('home:stitch.membership.viewAllPlans')}
        </Link>
      </p>
    </Section>
  );
};
