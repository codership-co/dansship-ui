import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuClock, LuChartBar, LuTag, LuBookmark, LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { Link, useParams } from 'react-router';

import { SpinnerLoader } from '@components/loaders';
import { FigureStatus, ProgressModal } from '@components/modules';
import { Badge, Button } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { mapDifficultyToDisplay } from '@helpers';
import { useFigureDetails } from '@hooks';

function FiguresDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const [showProgressModal, setShowProgressModal] = useState(false);
  const { figure, isSaved, isSaving, isLoading, handleSave } = useFigureDetails(+(id ?? 0));

  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const imageUrls = useMemo(() => {
    if (!figure) {
      return [] as Array<string>;
    }

    const sources = [...(figure.image_urls ?? []), figure.image_url, figure.image];

    return Array.from(new Set(sources.filter((url): url is string => Boolean(url))));
  }, [figure]);

  useEffect(() => {
    setCurrentImageIndex(0);
  }, [figure?.id, imageUrls.length]);

  if (isLoading) {
    return <SpinnerLoader />;
  }

  if (!figure) return <div>{t('figure:notFound')}</div>;

  const displayDifficulty = mapDifficultyToDisplay(figure.difficulty);

  const activeImageUrl = imageUrls[currentImageIndex] ?? '';
  const showCarouselControls = imageUrls.length > 1;

  const goToPreviousImage = () => {
    setCurrentImageIndex(current => {
      if (!imageUrls.length) {
        return 0;
      }

      return current === 0 ? imageUrls.length - 1 : current - 1;
    });
  };

  const goToNextImage = () => {
    setCurrentImageIndex(current => {
      if (!imageUrls.length) {
        return 0;
      }

      return current === imageUrls.length - 1 ? 0 : current + 1;
    });
  };

  return (
    <main className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
      <Button asChild variant='ghost' size='default' className='mb-6 h-10 px-4 text-sm sm:h-11 sm:px-5 sm:text-base'>
        <Link to='/figures'>
          <LuChevronLeft className='h-5 w-5' />
          {t('figure:details.backToFigures')}
        </Link>
      </Button>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-12'>
        {/* Left Column - Image */}
        <div
          className='relative'
          onKeyDown={event => {
            if (!showCarouselControls) {
              return;
            }

            if (event.key === 'ArrowLeft') {
              goToPreviousImage();
            }

            if (event.key === 'ArrowRight') {
              goToNextImage();
            }
          }}
          tabIndex={showCarouselControls ? 0 : -1}
          aria-label={figure.name}
        >
          {activeImageUrl ? (
            <img src={activeImageUrl} alt={figure.name} className='w-full h-150 object-cover rounded-lg shadow-lg' />
          ) : (
            <div className='w-full h-150 rounded-lg shadow-lg bg-muted flex items-center justify-center text-muted-foreground'>
              {figure.name}
            </div>
          )}

          {showCarouselControls && (
            <>
              <Button
                onClick={goToPreviousImage}
                size='icon'
                variant='secondary'
                className='absolute top-1/2 left-4 -translate-y-1/2 rounded-full shadow-md'
                aria-label={t('common:back')}
              >
                <LuChevronLeft className='w-6 h-6' />
              </Button>
              <Button
                onClick={goToNextImage}
                size='icon'
                variant='secondary'
                className='absolute top-1/2 right-4 -translate-y-1/2 rounded-full shadow-md'
                aria-label={t('common:next')}
              >
                <LuChevronRight className='w-6 h-6' />
              </Button>
            </>
          )}

          {showCarouselControls && (
            <div className='absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-full px-3 py-2 bg-black/35 backdrop-blur-sm'>
              {imageUrls.map((_, index) => (
                <button
                  key={index}
                  type='button'
                  className={`h-2.5 w-2.5 rounded-full transition-all ${
                    currentImageIndex === index ? 'bg-white' : 'bg-white/50'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                  aria-label={`${t('common:next')} ${index + 1}`}
                />
              ))}
            </div>
          )}

          <Button
            onClick={handleSave}
            disabled={isSaving}
            size='icon'
            variant={isSaved ? 'default' : 'secondary'}
            className='absolute top-4 right-4 rounded-full shadow-md'
          >
            <LuBookmark className={`w-6 h-6 ${isSaving ? 'opacity-50' : ''}`} />
          </Button>
        </div>

        {/* Right Column - Details */}
        <div>
          <h1 className='text-4xl font-bold text-gray-900 mb-4'>{figure.name}</h1>

          <div className='flex flex-wrap gap-3 mb-6'>
            <Badge variant='secondary'>{t(`difficulty:${displayDifficulty.toLowerCase()}`)}</Badge>
            <Badge variant='outline'>{t(`figureTypes:${figure.type.toLowerCase()}`)}</Badge>
          </div>

          {/* Status and Actions */}
          <div className='mb-8'>
            <FigureStatus onTrackProgress={() => setShowProgressModal(true)} />
          </div>

          <div className='grid grid-cols-2 gap-4 mb-8'>
            <div className='flex items-center space-x-2 text-gray-600'>
              <LuChartBar className='w-5 h-5' />
              <span>
                {t('difficulty:title')}: {t(`difficulty:${displayDifficulty.toLowerCase()}`)}
              </span>
            </div>
            <div className='flex items-center space-x-2 text-gray-600'>
              <LuTag className='w-5 h-5' />
              <span>
                {t('figure:details.type')}: {t(`figureTypes:${figure.type.toLowerCase()}`)}
              </span>
            </div>

            {figure.duration && (
              <div className='flex items-center space-x-2 text-gray-600'>
                <LuClock className='w-5 h-5' />
                <span>{figure.duration}</span>
              </div>
            )}
          </div>

          <div className='prose max-w-none'>
            <h2 className='text-2xl font-semibold text-gray-900 mb-4'>{t('figure:details.description')}</h2>
            <p className='text-gray-600 mb-8'>{figure.description}</p>

            {figure.prerequisites?.length > 0 && (
              <>
                <h2 className='text-2xl font-semibold text-gray-900 mb-4'>{t('figure:details.prerequisites')}</h2>
                <ul className='list-disc list-inside text-gray-600 mb-8'>
                  {figure.prerequisites.map((prereq, index) => (
                    <li key={index} className='mb-2'>
                      {prereq}
                    </li>
                  ))}
                </ul>
              </>
            )}

            {figure.tips?.length > 0 && (
              <>
                <h2 className='text-2xl font-semibold text-gray-900 mb-4'>{t('figure:details.tips')}</h2>
                <ul className='list-disc list-inside text-gray-600'>
                  {figure.tips.map((tip, index) => (
                    <li key={index} className='mb-2'>
                      {tip}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      <ProgressModal isOpen={showProgressModal} onClose={() => setShowProgressModal(false)} figureId={figure.id} />
    </main>
  );
}

export const SecureFiguresDetailsPage = SecurityGuard(FiguresDetailsPage, {
  featureFlags: [FEATURE_FLAG.isFiguresDetailsPageEnabled],
});
