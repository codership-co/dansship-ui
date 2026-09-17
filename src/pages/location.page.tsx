import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { LuArrowRight, LuBus, LuCar, LuClock, LuImage, LuMapPin } from 'react-icons/lu';

import { Section, SectionHeading } from '@components/containers';

const STUDIO_FACADE_SRC = '/assets/images/studio/facade.webp';
const STUDIO_MAP_QUERY = 'Dansship, Calle 25G # 74-71, Bogota, Colombia';
const STUDIO_MAP_URL = `https://www.google.com/maps?q=${encodeURIComponent(STUDIO_MAP_QUERY)}`;

export function LocationPage() {
  const { t } = useTranslation();
  const [facadeFailed, setFacadeFailed] = useState(false);

  return (
    <Section navbarPadding className='min-h-dvh pb-16 md:pb-20'>
      <SectionHeading
        className='mb-6 md:mb-10'
        intro={t('location:intro')}
        title={t('location:title')}
        subtitle={t('location:subtitle')}
      />

      <div className='flex flex-col gap-4 md:gap-10'>
        <div
          className={
            facadeFailed
              ? 'flex aspect-[2/1] min-h-40 w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-background-paper px-4 text-center text-sm text-muted-foreground md:aspect-[21/6] md:min-h-[180px]'
              : 'aspect-[2/1] min-h-40 w-full overflow-hidden rounded-2xl md:aspect-[21/6] md:min-h-[180px]'
          }
        >
          {facadeFailed ? (
            <>
              <LuImage className='h-8 w-8 text-muted-foreground/70' aria-hidden />
              <span>{t('location:facadeAlt')}</span>
            </>
          ) : (
            <img
              src={STUDIO_FACADE_SRC}
              alt={t('location:facadeAlt')}
              decoding='async'
              className='h-full w-full object-cover'
              onError={() => setFacadeFailed(true)}
            />
          )}
        </div>

        <div className='grid w-full grid-cols-1 items-start gap-4 md:grid-cols-2 md:gap-8'>
          <div className='aspect-4/3 w-full overflow-hidden rounded-2xl border border-border shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)]'>
            <iframe
              title={t('location:mapTitle')}
              src={`${STUDIO_MAP_URL}&output=embed`}
              className='h-full w-full border-0'
              loading='lazy'
              referrerPolicy='no-referrer-when-downgrade'
            />
          </div>

          <div className='flex w-full flex-col gap-3 md:gap-5'>
            <div className='rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6'>
              <div className='flex items-start gap-3.5'>
                <LuMapPin className='mt-0.5 hidden h-5 w-5 shrink-0 text-primary md:block' aria-hidden />
                <div>
                  <p className='m-0 mb-1 font-bold text-foreground'>{t('location:address.title')}</p>
                  <p className='m-0 leading-normal text-muted-foreground'>
                    {t('location:address.line1')}
                    <br />
                    {t('location:address.line2')}
                  </p>
                  <a
                    href={STUDIO_MAP_URL}
                    target='_blank'
                    rel='noreferrer'
                    className='mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-600'
                  >
                    {t('location:address.directions')}
                    <LuArrowRight className='h-3.5 w-3.5' aria-hidden />
                  </a>
                </div>
              </div>
            </div>

            <div className='flex flex-col gap-3 md:gap-3.5'>
              <InfoRow icon={<LuClock className='mt-px h-[18px] w-[18px] shrink-0 text-primary' aria-hidden />}>
                <p className='m-0 mb-0.5 text-sm font-bold'>{t('location:hours.title')}</p>
                <p className='m-0 text-sm leading-relaxed text-muted-foreground'>
                  {t('location:hours.weekday')}
                  <br />
                  {t('location:hours.saturday')}
                  <br />
                  {t('location:hours.sunday')}
                </p>
              </InfoRow>

              <InfoRow icon={<LuCar className='mt-px h-[18px] w-[18px] shrink-0 text-primary' aria-hidden />}>
                <p className='m-0 mb-0.5 text-sm font-bold'>{t('location:parking.title')}</p>
                <p className='m-0 text-sm leading-relaxed text-muted-foreground'>
                  {t('location:parking.line1')}
                  <br />
                  {t('location:parking.line2')}
                </p>
              </InfoRow>

              <InfoRow icon={<LuBus className='mt-px h-[18px] w-[18px] shrink-0 text-primary' aria-hidden />}>
                <p className='m-0 mb-0.5 text-sm font-bold'>{t('location:transit.title')}</p>
                <p className='m-0 text-sm leading-relaxed text-muted-foreground'>{t('location:transit.description')}</p>
              </InfoRow>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

function InfoRow({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <div className='flex gap-3.5 rounded-2xl bg-background-paper px-4 py-4 md:rounded-lg md:px-[18px]'>
      <span className='hidden md:inline-flex'>{icon}</span>
      <div>{children}</div>
    </div>
  );
}
