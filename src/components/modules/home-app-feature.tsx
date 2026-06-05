import { useTranslation } from 'react-i18next';
import { LuCalendar, LuHeart, LuSearch } from 'react-icons/lu';
import { Link } from 'react-router';

import { Section, SectionHeading } from '@components/containers';
import { Button } from '@components/ui';

const progressFeatures = [
  {
    icon: LuSearch,
    titleKey: 'home:stitch.progress.search.title',
    descriptionKey: 'home:stitch.progress.search.description',
    defaultTitle: 'Encuentra la figura',
    defaultDescription: 'Explora nuestro catálogo digital con más de 200 figuras clasificadas por niveles.',
  },
  {
    icon: LuHeart,
    titleKey: 'home:stitch.progress.favorites.title',
    descriptionKey: 'home:stitch.progress.favorites.description',
    defaultTitle: 'Agrega como favorita',
    defaultDescription: 'Crea tu propia rutina guardando las poses y movimientos que quieres perfeccionar.',
  },
  {
    icon: LuCalendar,
    titleKey: 'home:stitch.progress.log.title',
    descriptionKey: 'home:stitch.progress.log.description',
    defaultTitle: 'Entrena y registra',
    defaultDescription: 'Lleva un historial visual y técnico de tus avances clase tras clase.',
  },
];

export const HomeAppFeature = () => {
  const { t } = useTranslation();

  return (
    <Section id='tracking' compact className='py-8 bg-surface-container-low'>
      <div className='relative px-5 pb-7 pt-6 sm:px-8 sm:pt-8 lg:px-12 lg:pb-10 grid grid-cols-1 gap-5 lg:grid-cols-[1.1fr_0.9fr]'>
        <div className='flex items-center justify-center'>
          <img
            src='/assets/images/home/app.png'
            alt={t('home:stitch.app.imageAlt')}
            className='hidden h-100 max-w-none object-contain lg:block'
            loading='lazy'
          />
        </div>

        <div className='flex flex-col gap-7'>
          <SectionHeading
            className='space-y-2'
            intro={t('home:stitch.progress.kicker')}
            title={t('home:stitch.progress.title')}
            subtitle={t('home:stitch.progress.subtitle', {
              defaultValue: 'Transforma cada práctica en un avance medible dentro de tu biblioteca de movimiento.',
            })}
            titleSize='lg'
          />

          {progressFeatures.map(feature => {
            const Icon = feature.icon;

            return (
              <div key={feature.titleKey}>
                <div className='flex items-start gap-2.5'>
                  <span className='mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-xl bg-primary-fixed-dim/30 text-primary'>
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
              <Link to='/figures'>{t('home:stitch.progress.actions.viewAllFigures')}</Link>
            </Button>
          </div>
        </div>
      </div>
    </Section>
  );
};
