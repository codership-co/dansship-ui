import { useTranslation } from 'react-i18next';

import { Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@components/ui';
import { formatPrice } from '@helpers';

import type { StudioRentalRoomOption } from '@core/api';

interface StudioRentalRoomGridProps {
  rooms: Array<StudioRentalRoomOption>;
  onSelect: (room: StudioRentalRoomOption) => void;
}

export function StudioRentalRoomGrid({ rooms, onSelect }: StudioRentalRoomGridProps) {
  const { t } = useTranslation();

  return (
    <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-3'>
      {rooms.map(room => {
        const rate = room.hourly_rental_price ? formatPrice(Number(room.hourly_rental_price), 'COP') : null;

        return (
          <Card key={room.id} className='overflow-hidden py-0'>
            <div className='aspect-16/10 bg-[hsl(var(--surface-container-highest))]'>
              {room.image_url ? (
                <img src={room.image_url} alt={room.name} className='size-full object-cover' />
              ) : (
                <div className='flex size-full items-center justify-center text-sm text-muted-foreground'>
                  {t('studioRental:browse.noImage')}
                </div>
              )}
            </div>
            <CardHeader className='px-5 pt-4'>
              <CardTitle>{room.name}</CardTitle>
              <CardDescription>
                {t('studioRental:browse.capacity')} {room.capacity}
                {room.room_type ? ` · ${room.room_type}` : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className='px-5'>
              <p className='text-sm text-muted-foreground'>
                {rate
                  ? t('studioRental:browse.hourlyRateValue', { rate })
                  : t('studioRental:browse.priceNotConfigured')}
              </p>
            </CardContent>
            <CardFooter className='px-5 pb-5'>
              <Button type='button' className='w-full' onClick={() => onSelect(room)}>
                {t('studioRental:browse.rentRoom')}
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
