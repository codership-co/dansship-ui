import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Badge } from '@components/ui';
import { formatPrice } from '@helpers';
import { useDateLocale } from '@hooks';

import type { ClassRecoveryReview } from '@core/api';

/** Covered classes, plan state and what approving would do (ADR-056). */
export function ClassRecoveryReviewSection({ review }: { review: ClassRecoveryReview }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const day = (value: string) => format(new Date(value), 'd MMM', { locale });
  const { recovery } = review;
  const reactivating = review.subscriptions.filter(sub => sub.will_reactivate);

  return (
    <section className='grid gap-3 rounded-md border border-gray-200 p-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <p className='m-0 text-sm font-medium text-gray-900'>{t('recovery:admin.review.title')}</p>
        {recovery.status === 'returned_to_wallet' ? (
          <Badge variant='secondary'>{t('recovery:admin.review.statusReturned')}</Badge>
        ) : null}
      </div>
      <ul className='m-0 grid list-none gap-2 p-0 text-sm'>
        {recovery.lines.map(line => (
          <li key={line.id} className='flex flex-wrap items-center justify-between gap-2'>
            <span className='min-w-0'>
              {line.kind === 'lost_booking'
                ? `${line.class_name ?? ''}${line.class_start ? ` · ${day(line.class_start)}` : ''}`
                : t('recovery:admin.review.unusedLine', { count: line.quantity })}
              {line.plan_name ? ` · ${line.plan_name}` : ''}
              {line.attendee_name ? <Badge className='ml-2'>{line.attendee_name}</Badge> : null}
            </span>
            <span className='font-semibold'>{formatPrice(line.unit_price * line.quantity, 'COP')}</span>
          </li>
        ))}
      </ul>
      <p className='m-0 text-xs text-gray-500'>{t('recovery:admin.review.priceNote')}</p>
      {review.subscriptions.map(sub => (
        <p key={sub.subscription_id} className='m-0 text-sm text-gray-700'>
          <span className='font-medium'>{sub.plan_name}:</span>{' '}
          {sub.days_since_expiration !== null && sub.will_reactivate
            ? t('recovery:admin.review.planExpired', {
                count: sub.days_since_expiration,
                date: day(review.usable_until),
              })
            : t('recovery:admin.review.planActive')}
        </p>
      ))}
      {review.outcome === 'return_to_wallet' ? (
        <p className='m-0 rounded-md border border-warning p-3 text-sm'>
          {t('recovery:admin.review.alreadyReactivated', {
            amount: formatPrice(recovery.amount_to_charge + recovery.wallet_applied, 'COP'),
          })}
        </p>
      ) : reactivating.length ? (
        <p className='m-0 rounded-md border border-warning p-3 text-sm'>
          {t('recovery:admin.review.willReactivate', { date: day(review.usable_until) })}
        </p>
      ) : null}
    </section>
  );
}

/** Label of the approve button for a recovery payment. */
export function classRecoveryApproveLabelKey(review: ClassRecoveryReview | null): string | null {
  if (!review) return null;

  if (review.outcome === 'return_to_wallet') return 'recovery:admin.review.returnToWallet';

  if (review.subscriptions.some(sub => sub.will_reactivate)) return 'recovery:admin.review.approveAndReactivate';

  return null;
}
