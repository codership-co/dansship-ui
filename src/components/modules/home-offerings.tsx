import { useTranslation } from 'react-i18next';
import { LuArrowRight, LuDumbbell, LuMusic2, LuSparkles } from 'react-icons/lu';
import { Link } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { Button, Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui';

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
            <Link key={card.titleKey} to='/classes' className='block rounded-lg'>
              <Card
                className={`group relative min-h-100 overflow-hidden border-secondary/50 shadow-none ${
                  isFeatured ? 'bg-primary-container text-primary-foreground' : 'bg-surface-container-low text-accent'
                }`}
              >
                <img
                  src={card.image}
                  alt={t(card.titleKey)}
                  className={`pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                    isFeatured ? 'opacity-[0.52]' : 'opacity-[0.3]'
                  }`}
                  loading='lazy'
                />

                <div
                  className={`pointer-events-none absolute inset-0 ${isFeatured ? 'bg-primary/70' : 'bg-secondary/10'}`}
                />

                {/* header */}
                <CardHeader className='relative z-10 px-5'>
                  <CardTitle>
                    <div className='flex flex-col gap-4 pt-42.5'>
                      <span
                        className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${
                          isFeatured
                            ? 'text-primary-foreground bg-on-tertiary-container/20'
                            : 'text-primary bg-primary/10'
                        }`}
                      >
                        <Icon className='h-4 w-4' />
                      </span>

                      <h3 className={isFeatured ? 'text-primary-foreground' : 'text-primary'}>{t(card.titleKey)}</h3>
                    </div>
                  </CardTitle>

                  <CardDescription
                    className={`pt-1 text-[0.9rem] leading-relaxed ${
                      isFeatured ? 'text-primary-foreground/90' : 'text-foreground/85'
                    }`}
                  >
                    {t(card.descriptionKey)}
                  </CardDescription>
                </CardHeader>

                {/* footer */}
                <CardFooter className='relative z-10 mt-auto px-5'>
                  <span
                    className={`inline-flex items-center gap-2 text-[0.84rem] font-semibold uppercase tracking-[0.08em] ${
                      isFeatured ? 'text-primary-foreground' : 'text-primary'
                    }`}
                  >
                    {t('home:stitch.offerings.learnMore')}
                    <LuArrowRight className='h-3.5 w-3.5' />
                  </span>
                </CardFooter>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className='mt-8 flex flex-col items-center gap-3 text-center'>
        <p className='text-sm text-muted-foreground'>{t('home:stitch.offerings.scheduleCtaMessage')}</p>

        <Button asChild>
          <Link to='/classes'>{t('home:stitch.offerings.scheduleCtaAction')}</Link>
        </Button>
      </div>
    </Section>
  );
};
