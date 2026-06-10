import { useTranslation } from 'react-i18next';
import { LuCalendar, LuHeart, LuSearch } from 'react-icons/lu';
import { Link } from 'react-router';

import { SectionHeading } from '@components/containers';
import { Button } from '@components/ui';
import { PageURLS } from '@core/constants';

const progressFeatures = [
  {
    icon: LuSearch,
    titleKey: 'home:stitch.progress.search.title',
    descriptionKey: 'home:stitch.progress.search.description',
  },
  {
    icon: LuHeart,
    titleKey: 'home:stitch.progress.favorites.title',
    descriptionKey: 'home:stitch.progress.favorites.description',
  },
  {
    icon: LuCalendar,
    titleKey: 'home:stitch.progress.log.title',
    descriptionKey: 'home:stitch.progress.log.description',
  },
];

export const HomeAppFeature = () => {
  const { t } = useTranslation();

  return (
    <section id='tracking' className='p-0 bg-secondary'>
      <div className='mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8'>
        <div className='relative grid grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_1fr]'>
          <div className='self-end'>
            <img
              src='/assets/images/home/app.png'
              alt={t('home:stitch.app.imageAlt')}
              className='hidden h-150 max-w-none object-contain lg:block'
              loading='lazy'
            />
          </div>

          <div className='flex flex-col gap-7 pr-5 pb-7 pt-6 sm:pr-8 sm:pt-8 lg:pr-12 lg:pb-10 '>
            <SectionHeading
              className='space-y-2'
              intro={t('home:stitch.progress.kicker')}
              title={t('home:stitch.progress.title')}
              subtitle={t('home:stitch.progress.subtitle')}
              titleSize='lg'
            />

            {progressFeatures.map(feature => {
              const Icon = feature.icon;

              return (
                <div key={feature.titleKey}>
                  <div className='flex items-start gap-2.5'>
                    <span className='mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary/30 text-primary'>
                      <Icon className='h-3.5 w-3.5' />
                    </span>

                    <div>
                      <h6 className='text-primary'>{t(feature.titleKey)}</h6>

                      <p className='mt-1 text-[0.84rem] leading-relaxed text-muted-foreground'>
                        {t(feature.descriptionKey)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className='flex flex-col gap-2.5 sm:max-w-90 sm:flex-row'>
              <Button asChild>
                <Link to={PageURLS.figures}>{t('home:stitch.progress.actions.viewAllFigures')}</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
