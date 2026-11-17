import { Button } from 'polpo/components';
import { Trans, useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Badge } from '@components/ui';
import { PageURLS } from '@core/constants';
import { promotionCopyKey } from '@helpers';

import type { PlanPromotion } from '@core/api';

interface PromotionBannerProps {
  promotion: PlanPromotion;
  /** Hide the button when the banner already sits on the plans page. */
  hideCta?: boolean;
}

/** Banner shown only while the API reports an open promotion. Copy is keyed by promotion code. */
export function PromotionBanner({ promotion, hideCta = false }: PromotionBannerProps) {
  const { t } = useTranslation();
  const values = { percentage: promotion.discount_percentage };

  return (
    <section className='mx-auto flex max-w-6xl flex-col gap-5 rounded-2xl bg-gradient-plan-recommended p-7 text-primary-foreground md:flex-row md:items-center md:justify-between md:gap-8'>
      <div className='grid max-w-xl justify-items-start gap-3'>
        <Badge variant='highlight' className='px-3 py-1'>
          {t(promotionCopyKey(promotion.code, 'bannerKicker'))}
        </Badge>
        <h2 className='m-0 leading-tight text-primary-foreground'>
          <Trans
            i18nKey={promotionCopyKey(promotion.code, 'bannerTitle')}
            values={values}
            components={{ Percentage: <span className='font-title text-header1 leading-none' /> }}
          />
        </h2>
        <p className='m-0'>
          <Trans i18nKey={promotionCopyKey(promotion.code, 'bannerSubtitle')} />
        </p>
      </div>
      {hideCta ? null : (
        <Link to={PageURLS.plans} viewTransition className='shrink-0'>
          <Button color='warning' variant='solid'>
            {t(promotionCopyKey(promotion.code, 'bannerCta'))}
          </Button>
        </Link>
      )}
    </section>
  );
}
