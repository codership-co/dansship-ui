import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { PlanSelector } from '@components/modules/payments/plan-selector';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { usePromise } from '@hooks';

export const HomeMemberships = () => {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.subscriptions.getPublicPlans());
  const publicPlans = response?.data ?? [];

  return (
    <Section id='planes' verticalPadding>
      <SectionHeading
        className='mx-auto max-w-2xl'
        centered
        intro={t('home:stitch.membership.kicker')}
        title={t('home:stitch.membership.title')}
        subtitle={t('home:stitch.membership.subtitle', {
          studioName: 'Dansship',
        })}
      />

      <div className='mx-auto mt-8 min-h-64 max-w-6xl'>
        {isLoading ? <div className='min-h-64' aria-hidden /> : <PlanSelector plans={publicPlans} />}
      </div>

      <section className='grid gap-2 justify-items-center'>
        <p className='text-center mx-auto mt-8 max-w-2xl text-[0.92rem] text-muted-foreground'>
          {t('home:stitch.membership.helpText')}
        </p>
        <Link to={PageURLS.plans}>
          <Button color='primary' className='mx-auto'>
            {t('home:stitch.membership.viewAllPlans')}
          </Button>
        </Link>
      </section>
    </Section>
  );
};
