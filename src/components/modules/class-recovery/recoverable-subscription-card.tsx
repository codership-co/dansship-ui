import { format, parseISO } from 'date-fns';
import { Button } from 'polpo/components';
import { useTranslation } from 'react-i18next';

import { Badge, Checkbox } from '@components/ui';
import { selectableInGroup, type RecoverableClass, type RecoverableSubscription } from '@core/api';
import { cn, formatPrice } from '@helpers';
import { useDateLocale } from '@hooks';

interface RecoverableSubscriptionCardProps {
  group: RecoverableSubscription;
  selectedBookingIds: ReadonlySet<string>;
  /** Which unused-credit rows are ticked. */
  unusedSelected: ReadonlySet<number>;
  onToggleBooking: (bookingId: string, selected: boolean) => void;
  onToggleUnused: (subscriptionId: string, row: number, selected: boolean) => void;
  /** Selects (or clears) everything this plan offers. */
  onToggleAll: (group: RecoverableSubscription, selected: boolean) => void;
}

const DATE_CHIP = 'flex w-[52px] shrink-0 flex-col items-center gap-0.5 rounded-[11px] bg-muted py-[9px] text-center';

function ClassRow({
  item,
  checked,
  onChange,
}: {
  item: RecoverableClass;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const start = new Date(item.class_start);
  const end = item.class_end ? new Date(item.class_end) : null;
  const id = `recover-${item.booking_id}`;

  return (
    <li className='flex items-center gap-2 border-t border-border py-4 first:border-t-0 sm:gap-3'>
      <Checkbox
        id={id}
        checked={checked}
        disabled={item.in_review}
        onCheckedChange={value => onChange(value === true)}
      />
      <div className={DATE_CHIP} aria-hidden='true'>
        <span className='text-[9.5px] font-semibold tracking-[0.08em] text-muted-foreground uppercase'>
          {format(start, 'EEE', { locale })}
        </span>
        <span className='font-title text-[19px] leading-none font-bold text-primary'>{format(start, 'd')}</span>
        <span className='text-[9.5px] font-medium text-muted-foreground uppercase'>
          {format(start, 'MMM', { locale })}
        </span>
      </div>
      <label
        htmlFor={id}
        className={cn('grid min-w-0 flex-1 gap-1', item.in_review ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}
      >
        <span className='font-title font-semibold break-words text-foreground'>
          {item.class_name ?? t('recovery:list.classFallback')}
          {item.attendee_name ? <Badge className='ml-2'>{item.attendee_name}</Badge> : null}
        </span>
        <span className='text-sm text-muted-foreground'>
          {format(start, 'HH:mm')}
          {end ? ` – ${format(end, 'HH:mm')}` : ''}
          {item.instructor_name ? ` · ${item.instructor_name}` : ''}
        </span>
        <span className='flex flex-wrap items-center gap-x-2 gap-y-1'>
          <Badge variant='outlineNeutral'>{t(`recovery:list.lossReason.${item.loss_reason}`)}</Badge>
          {item.in_review ? (
            <Badge variant='outlineTertiary'>{t('recovery:list.paymentPending')}</Badge>
          ) : item.deadline ? (
            <span className='text-sm text-muted-foreground'>
              {/* Date-only string: a local day, not UTC midnight. */}
              {t('recovery:list.until', { date: format(parseISO(item.deadline), 'd MMM', { locale }) })}
            </span>
          ) : null}
        </span>
      </label>
      <span className='shrink-0 text-sm font-semibold sm:text-base'>{formatPrice(item.unit_price, 'COP')}</span>
    </li>
  );
}

function UnusedRow({
  group,
  index,
  checked,
  pending = false,
  onChange,
}: {
  group: RecoverableSubscription;
  index: number;
  checked: boolean;
  /** This credit is the one in the payment under review. */
  pending?: boolean;
  onChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const id = `recover-unused-${group.subscription_id}-${index}`;

  // One line on purpose: the card header already says which plan it is and that it expired.
  return (
    <li className='flex items-center gap-3 border-t border-border py-3 first:border-t-0'>
      <Checkbox id={id} checked={checked} disabled={pending} onCheckedChange={value => onChange(value === true)} />
      <label
        htmlFor={id}
        className={cn('grid min-w-0 flex-1 gap-0.5', pending ? 'cursor-not-allowed opacity-70' : 'cursor-pointer')}
      >
        <span className='font-title font-semibold text-foreground'>{t('recovery:list.unusedTitle')}</span>
        {pending ? (
          <span>
            <Badge variant='outlineTertiary'>{t('recovery:list.paymentPending')}</Badge>
          </span>
        ) : group.grace_deadline ? (
          <span className='text-sm text-muted-foreground'>
            {t('recovery:list.until', { date: format(parseISO(group.grace_deadline), 'd MMM', { locale }) })}
          </span>
        ) : null}
      </label>
      <span className='shrink-0 text-sm font-semibold sm:text-base'>{formatPrice(group.unit_price, 'COP')}</span>
    </li>
  );
}

export function RecoverableSubscriptionCard({
  group,
  selectedBookingIds,
  unusedSelected,
  onToggleBooking,
  onToggleUnused,
  onToggleAll,
}: RecoverableSubscriptionCardProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const isExpired = group.plan_state === 'expired_in_grace';
  const expiry = format(new Date(group.expiration_date), 'd MMM', { locale });
  const available = selectableInGroup(group);
  const selectable = available.bookingIds.length + available.unused;
  const allSelected =
    selectable > 0 &&
    available.bookingIds.every(id => selectedBookingIds.has(id)) &&
    [...unusedSelected].filter(row => row < available.unused).length === available.unused;

  return (
    <article className='min-w-0 rounded-2xl bg-white p-4 shadow-sm sm:p-6'>
      <header className='flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4'>
        <div className='flex flex-wrap items-center gap-3'>
          <h3 className='m-0'>{group.plan_name}</h3>
          <Badge variant={isExpired ? 'destructive' : 'secondary'}>
            {t(isExpired ? 'recovery:list.expiredOn' : 'recovery:list.expiresOn', { date: expiry })}
          </Badge>
        </div>
        <p className='m-0 min-w-0 text-sm text-muted-foreground'>
          {t('recovery:list.pricePerClass')} <strong>{formatPrice(group.unit_price, 'COP')}</strong>
          {' · '}
          {t('recovery:list.taxIncluded')}
        </p>
        {selectable > 1 ? (
          <Button
            type='button'
            color='primary'
            variant='outlined'
            size='small'
            onClick={() => onToggleAll(group, !allSelected)}
          >
            {t(allSelected ? 'recovery:list.clearAll' : 'recovery:list.selectAll')}
          </Button>
        ) : null}
      </header>
      <ul className='m-0 list-none p-0'>
        {group.classes.map(item => (
          <ClassRow
            key={item.booking_id}
            item={item}
            checked={selectedBookingIds.has(item.booking_id)}
            onChange={value => onToggleBooking(item.booking_id, value)}
          />
        ))}
        {Array.from({ length: group.unused_credits }, (_, index) => (
          <UnusedRow
            key={`${group.subscription_id}-${index}`}
            group={group}
            index={index}
            checked={unusedSelected.has(index)}
            onChange={value => onToggleUnused(group.subscription_id, index, value)}
          />
        ))}
        {Array.from({ length: group.unused_in_review }, (_, index) => (
          <UnusedRow
            key={`${group.subscription_id}-pending-${index}`}
            group={group}
            index={group.unused_credits + index}
            checked={false}
            pending
            onChange={() => undefined}
          />
        ))}
      </ul>
    </article>
  );
}
