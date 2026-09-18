import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuInfo } from 'react-icons/lu';
import { Link, useLocation, useNavigate } from 'react-router';

import { TallerCheckoutModal } from './taller-checkout-modal';

import { SpinnerLoader } from '@components/loaders';
import { Badge } from '@components/ui';
import { useAuth, useOrPermissions } from '@contexts';
import { DansshipAPI, type WorkshopLanding } from '@core/api';
import { PageURLS } from '@core/constants';
import { AdminPermissions } from '@core/permissions';
import { consumePendingTallerCheckoutIntent, formatPrice, setPendingTallerCheckoutIntent } from '@helpers';
import { usePromise } from '@hooks';

function LandingHero({ landing }: { landing: WorkshopLanding }) {
  const { t } = useTranslation();

  return (
    <div className='grid gap-4'>
      {landing.image_url ? (
        <div className='grid place-items-center'>
          <img
            src={landing.image_url}
            alt=''
            className='max-h-[min(22rem,50vh)] w-auto max-w-full rounded-2xl object-contain sm:max-h-[min(32rem,70vh)]'
          />
        </div>
      ) : null}
      <div className='flex flex-wrap items-center justify-between gap-2'>
        <div className='flex flex-wrap gap-2'>
          <Badge variant='outline'>
            {landing.kind === 'combo' ? t('talleres:landing.comboBadge') : t('talleres:landing.workshopBadge')}
          </Badge>
          {landing.requires_partner ? <Badge variant='outlineTertiary'>{t('talleres:landing.pairBadge')}</Badge> : null}
        </div>
        <Badge variant={landing.sold_out ? 'destructive' : 'outlineActive'}>
          {landing.sold_out
            ? t('talleres:landing.soldOut')
            : t('talleres:landing.capacity', { remaining: landing.remaining, capacity: landing.capacity })}
        </Badge>
      </div>
      <div className='grid gap-2'>
        <h1 className='m-0 text-[1.75rem] font-bold leading-tight text-foreground sm:text-3xl'>{landing.name}</h1>
        {landing.description ? (
          <p className='m-0 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap'>{landing.description}</p>
        ) : null}
      </div>
    </div>
  );
}

function WorkshopDetails({ landing }: { landing: WorkshopLanding }) {
  const { t } = useTranslation();

  return (
    <div className='grid gap-4 rounded-[14px] border bg-white p-4'>
      <dl className='grid grid-cols-3 gap-3'>
        <div className='min-w-0'>
          <dt className='text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
            {t('talleres:landing.date')}
          </dt>
          <dd className='m-0 text-sm font-semibold leading-snug'>{landing.date_label}</dd>
        </div>
        <div className='min-w-0'>
          <dt className='text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
            {t('talleres:landing.schedule')}
          </dt>
          <dd className='m-0 text-sm font-semibold leading-snug'>{landing.schedule_label}</dd>
        </div>
        <div className='min-w-0'>
          <dt className='text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground'>
            {t('talleres:landing.room')}
          </dt>
          <dd className='m-0 text-sm font-semibold leading-snug'>{landing.room_name}</dd>
        </div>
      </dl>
      <div className='flex items-center gap-2.5'>
        <div className='grid size-8 shrink-0 place-content-center rounded-full bg-primary/15 text-[11px] font-semibold text-primary'>
          {landing.instructor?.initials}
        </div>
        <div>
          <p className='m-0 text-sm font-semibold'>{landing.instructor?.name}</p>
          <p className='m-0 text-[10.5px] text-muted-foreground'>{t('talleres:landing.instructor')}</p>
        </div>
      </div>
    </div>
  );
}

function PriceBlock({ landing }: { landing: WorkshopLanding }) {
  const { t } = useTranslation();

  return (
    <div className='grid gap-3 rounded-[14px] border bg-white p-4'>
      <h2 className='m-0 text-base font-semibold'>
        {landing.kind === 'combo' ? t('talleres:landing.priceTitleCombo') : t('talleres:landing.priceTitle')}
      </h2>
      <div className='grid gap-2.5'>
        {landing.price_rows.map((row, index) => (
          <div
            key={row.label}
            className={`flex items-start justify-between gap-4 ${
              index < landing.price_rows.length - 1 ? 'border-b border-border pb-2.5' : ''
            }`}
          >
            <span className='text-sm'>{row.label}</span>
            <span className={`shrink-0 text-base font-bold ${index === 0 ? 'text-primary' : ''}`}>
              {formatPrice(Number(row.price), 'COP')}
            </span>
          </div>
        ))}
      </div>
      <p className='m-0 text-xs leading-relaxed text-muted-foreground'>{t('talleres:landing.priceHint')}</p>
    </div>
  );
}

export function TallerLanding({ slug, preview }: { slug: string; preview: boolean }) {
  const { t } = useTranslation();
  const { isAuthenticated, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const canPreview = useOrPermissions(AdminPermissions.talleres);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const useAdminPreview = preview && canPreview;
  const canFetch = Boolean(slug) && (!preview || (ready && canPreview));

  const { response, isLoading } = usePromise(
    () => (useAdminPreview ? DansshipAPI.talleresAdmin.preview(slug) : DansshipAPI.talleres.getBySlug(slug)),
    canFetch,
    [slug, preview, useAdminPreview, isAuthenticated],
  );
  const landing = response?.data;

  useEffect(() => {
    if (!landing || !isAuthenticated) {
      return;
    }

    const pending = consumePendingTallerCheckoutIntent();

    if (pending === landing.slug && !landing.already_registered && !landing.sold_out) {
      setCheckoutOpen(true);
    }
  }, [isAuthenticated, landing]);

  if (preview && ready && !canPreview) {
    return <p className='text-muted-foreground'>{t('talleres:landing.notFound')}</p>;
  }

  if ((preview && !ready) || isLoading || response === null) {
    return <SpinnerLoader />;
  }

  if (!landing) {
    return <p className='text-muted-foreground'>{t('talleres:landing.notFound')}</p>;
  }

  const startCheckout = () => {
    if (landing.sold_out || landing.already_registered) {
      return;
    }

    if (!isAuthenticated) {
      setPendingTallerCheckoutIntent(landing.slug);
      navigate(PageURLS.auth.login, { state: { from: location } });

      return;
    }

    setCheckoutOpen(true);
  };

  const ctaDisabled = landing.sold_out || landing.already_registered;
  const ctaLabel = landing.already_registered
    ? t('talleres:landing.ctaAlreadyRegistered')
    : landing.sold_out
      ? t('talleres:landing.ctaSoldOut')
      : t('talleres:landing.cta');

  return (
    <div className='mx-auto grid max-w-xl gap-5 pb-8 lg:max-w-3xl'>
      <LandingHero landing={landing} />
      {landing.kind === 'workshop' ? (
        <WorkshopDetails landing={landing} />
      ) : (
        <div className='grid gap-3 sm:grid-cols-2'>
          {landing.components.map(component => (
            <article key={component.slug} className='overflow-hidden rounded-2xl border bg-white'>
              <div className='aspect-[4/3] bg-secondary'>
                {component.image_url ? (
                  <img src={component.image_url} alt='' className='size-full object-cover' />
                ) : null}
              </div>
              <div className='grid gap-1 p-3'>
                <p className='m-0 text-xs font-semibold text-primary'>{component.date_label}</p>
                <h2 className='m-0 text-[15px] font-semibold'>{component.name}</h2>
                <p className='m-0 text-xs text-muted-foreground'>
                  {component.instructor_label}
                  {component.instructor_label && component.room_label ? ' · ' : ''}
                  {component.room_label}
                </p>
                <Link
                  className='mt-1 text-xs font-semibold text-primary'
                  to={`${PageURLS.tallerLanding(component.slug)}${preview ? '?preview=1' : ''}`}
                >
                  {t('talleres:landing.viewWorkshop')}
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
      <PriceBlock landing={landing} />
      <div className='flex items-start gap-2.5 rounded-xl bg-secondary p-3'>
        <LuInfo className='mt-0.5 size-4 shrink-0' aria-hidden />
        <p className='m-0 text-xs font-medium leading-relaxed'>
          {landing.kind === 'combo' ? t('talleres:landing.nonRefundableCombo') : t('talleres:landing.nonRefundable')}
        </p>
      </div>
      <div className='flex justify-end'>
        <Button type='button' color='primary' variant='solid' disabled={ctaDisabled} onClick={startCheckout}>
          {ctaLabel}
        </Button>
      </div>
      <TallerCheckoutModal
        landing={landing}
        isOpen={checkoutOpen && !ctaDisabled}
        onClose={() => setCheckoutOpen(false)}
      />
    </div>
  );
}
