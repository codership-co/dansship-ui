import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { cn } from 'polpo/helpers';
import { useTranslation } from 'react-i18next';
import { LuClipboardList } from 'react-icons/lu';

import { Badge } from '@components/ui';
import { InstructorTeachingWorkshop } from '@core/api';
import { DEFAULT_ROOM_IMAGE } from '@core/constants';
import { formatTimeDifference } from '@helpers';

interface InstructorWorkshopCardProps {
  workshop: InstructorTeachingWorkshop;
  highlighted?: boolean;
  onClick: () => void;
}

export function InstructorWorkshopCard({ workshop, highlighted = false, onClick }: InstructorWorkshopCardProps) {
  const { t } = useTranslation();
  const isFull = workshop.registered_count >= workshop.capacity;

  return (
    <section
      role='button'
      tabIndex={0}
      onClick={onClick}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={cn(
        'relative select-none rounded-2xl gap-3 px-4 py-4 pt-20 xs:pt-30 sm:pt-40 transition-all cursor-pointer',
        'hover:scale-102 hover:shadow-[0_40px_30px_-30px_#00000055]',
        'group relative grid content-end',
        highlighted && 'ring-2 ring-primary/40',
      )}
    >
      <section
        className='absolute -z-10 top-0 left-0 size-full rounded-2xl'
        style={{
          background: `url('${workshop.room?.image_url || DEFAULT_ROOM_IMAGE}') center center / cover`,
        }}
      />

      <Badge variant='default' size='regular' className='absolute top-0 left-0 m-4 px-4 py-1'>
        {t('instructor:home.workshopBadge')}
      </Badge>

      <p
        className={cn(
          'absolute block font-bold top-0 right-0 m-4 py-1 px-4 bg-accent-200 text-primary rounded-2xl',
          isFull && 'bg-gray-100 text-gray-400',
        )}
      >
        {isFull ? t('bookings:spotsFull') : `${workshop.registered_count} / ${workshop.capacity}`}
      </p>

      <section className='bg-white/50 backdrop-blur-md py-4 px-8 grid gap-4 rounded-xl'>
        <h3 className='text-primary text-center sm:text-left m-0'>{workshop.name}</h3>
        <section className='grid grid-cols-2 sm:grid-cols-3 gap-8 items-center'>
          <section className='text-center'>
            <h4 className='m-0'>{format(new Date(workshop.starts_at), 'H:mm a')}</h4>
            <label>{t('bookings:startTime')}</label>
          </section>
          <section className='text-center'>
            <h4 className='m-0'>{formatTimeDifference(workshop.ends_at, workshop.starts_at)}</h4>
            <label>{t('bookings:duration')}</label>
          </section>
          <section className='text-center col-span-2 sm:col-span-1'>
            <h4 className='m-0'>{workshop.room?.name || t('bookings:roomTBA')}</h4>
            <label>{t('bookings:room')}</label>
          </section>
        </section>
      </section>

      <Button
        type='button'
        color='primary'
        variant='solid'
        className='absolute top-full right-8 -translate-y-1/2'
        tabIndex={-1}
      >
        <LuClipboardList className='size-4' />
        {t('instructor:home.viewRoster')}
      </Button>
    </section>
  );
}
