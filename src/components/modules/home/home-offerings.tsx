import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { LuArrowRight, LuDumbbell, LuMusic2, LuSparkles } from 'react-icons/lu';
import { Link } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui';
import { PageURLS } from '@core/constants';

const offeringCards = [
  {
    icon: LuMusic2,
    titleKey: 'home:stitch.offerings.dance.title',
    descriptionKey: 'home:stitch.offerings.dance.description',
    image: '/assets/images/home/dance.png',
  },
  {
    icon: LuDumbbell,
    titleKey: 'home:stitch.offerings.poleSport.title',
    descriptionKey: 'home:stitch.offerings.poleSport.description',
    image: '/assets/images/home/pole.png',
  },
  {
    icon: LuSparkles,
    titleKey: 'home:stitch.offerings.complementary.title',
    descriptionKey: 'home:stitch.offerings.complementary.description',
    image: '/assets/images/home/flex.png',
  },
];

export const HomeOfferings = () => {
  const { t } = useTranslation();

  return (
    <Section id='disciplinas'>
      <SectionHeading
        className='max-w-3xl'
        intro={t('home:stitch.offerings.kicker')}
        title={t('home:stitch.offerings.title')}
        subtitle={t('home:stitch.offerings.subtitle')}
      />

      <div className='mt-8 grid grid-cols-1 gap-4 md:grid-cols-3'>
        {offeringCards.map((card, index) => {
          const Icon = card.icon;
          const isFeatured = index === 1;

          return (
            <Link key={card.titleKey} to={PageURLS.classes} className='block rounded-lg'>
              <Card
                className={`group relative min-h-100 overflow-hidden border-secondary/50 shadow-none h-full ${
                  isFeatured ? 'bg-primary-600 text-accent-200' : 'bg-tertiary-200 text-primary'
                }`}
              >
                <img
                  src={card.image}
                  alt={t(card.titleKey)}
                  className='pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 opacity-[0.3]'
                  loading='lazy'
                />

                <CardHeader className='relative z-10 px-5'>
                  <CardTitle>
                    <div className='flex flex-col gap-4 pt-42.5'>
                      <span className='inline-flex h-9 w-9 items-center justify-center rounded-xl text-primary backdrop-blur-sm bg-tertiary-200/40'>
                        <Icon className='h-4 w-4' />
                      </span>

                      <h3 className='whitespace-pre-line'>{t(card.titleKey)}</h3>
                    </div>
                  </CardTitle>

                  <CardDescription className='text-body'>
                    <span className='text-body'>{t(card.descriptionKey)}</span>
                  </CardDescription>
                </CardHeader>

                <CardFooter className='relative z-10 px-5'>
                  <Button
                    color='primary'
                    variant='text'
                    className={`inline-flex items-center gap-2 uppercase ${
                      isFeatured ? 'text-primary-foreground hover:bg-primary/30' : 'text-primary hover:bg-primary/20'
                    }`}
                  >
                    {t('home:stitch.offerings.learnMore')}
                    <LuArrowRight className='h-3.5 w-3.5' />
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className='mt-8 flex flex-col items-center gap-3 text-center'>
        <p>{t('home:stitch.offerings.scheduleCtaMessage')}</p>

        <Link to={PageURLS.classes}>
          <Button color='primary'>{t('home:stitch.offerings.scheduleCtaAction')}</Button>
        </Link>
      </div>
    </Section>
  );
};
