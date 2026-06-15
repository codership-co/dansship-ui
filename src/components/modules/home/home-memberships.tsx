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
    <Section id='planes'>
      <SectionHeading
        className='mx-auto max-w-2xl'
        centered
        intro={t('home:stitch.membership.kicker')}
        title={t('home:stitch.membership.title')}
        subtitle={t('home:stitch.membership.subtitle', {
          studioName: 'Dansship',
        })}
      />

      <div className='mx-auto mt-8 max-w-6xl'>
        <PlanSelector />
      </div>

      <p className='text-center mx-auto mt-8 max-w-2xl text-[0.92rem] text-muted-foreground'>
        {t('home:stitch.membership.helpText')}
        <br />
        <Link to={plansPath} className='font-semibold text-primary underline-offset-2 transition hover:underline'>
          {t('home:stitch.membership.viewAllPlans')}
        </Link>
      </p>
    </Section>
  );
};
