import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Badge } from '@components/ui';
import { type EventCatalogCard } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatPrice } from '@helpers';

interface EventoCardProps {
  card: EventCatalogCard;
}

export function EventoCard({ card }: EventoCardProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const price = formatPrice(Number(card.price_from), 'COP');

  return (
    <article className='overflow-hidden rounded-2xl border bg-white shadow-sm'>
      <div className='relative aspect-[4/3] bg-secondary'>
        {card.image_url ? (
          <img src={card.image_url} alt='' className='size-full object-cover' />
        ) : (
          <div className='size-full bg-gradient-onboarding' />
        )}
      </div>
      <div className='grid gap-3 p-4'>
        <div className='flex items-center justify-between gap-2'>
          <p className='m-0 text-sm text-muted-foreground'>{card.date_label}</p>
          <Badge variant={card.sold_out ? 'destructive' : 'outlineActive'} size='small'>
            {card.sold_out ? t('eventos:list.soldOut') : t('eventos:list.available')}
          </Badge>
        </div>
        <h2 className='m-0 text-lg font-semibold text-primary'>{card.name}</h2>
        {card.kind === 'event' && card.type_label ? (
          <p className='m-0 text-xs font-medium text-primary'>{card.type_label}</p>
        ) : null}
        <p className='m-0 text-sm text-muted-foreground'>
          {card.instructor_label}
          {card.instructor_label && card.room_label ? ' · ' : ''}
          {card.room_label}
        </p>
        <p className='m-0 font-semibold'>
          {t(card.priced_per_pair ? 'eventos:list.fromPricePair' : 'eventos:list.fromPrice', { price })}
        </p>
        <Button
          type='button'
          color='primary'
          variant='solid'
          onClick={() => navigate(PageURLS.eventoLanding(card.slug))}
        >
          {t('eventos:list.view')}
        </Button>
      </div>
    </article>
  );
}
