import { Button } from 'polpo/components';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Section, SectionEmpty, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import {
  RecoverableSubscriptionCard,
  RecoveryCheckoutModal,
  RecoverySummaryBar,
} from '@components/modules/class-recovery';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { selectableInGroup, selectionTotal, type RecoverableSubscription, type RecoverySelection } from '@core/api';
import { PageURLS } from '@core/constants';
import { useRecoverableClasses } from '@hooks';

const NO_ROWS: ReadonlySet<number> = new Set();

function RecoverClassesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { subscriptions, settings, isLoading, hasError, reload } = useRecoverableClasses();
  const [selectedBookingIds, setSelectedBookingIds] = useState<ReadonlySet<string>>(new Set());
  // Which unused-credit rows are ticked, per plan. Credits are interchangeable: only how many matter.
  const [unusedRows, setUnusedRows] = useState<Record<string, ReadonlySet<number>>>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const unused = useMemo(
    () =>
      Object.fromEntries(
        subscriptions.map(group => [
          group.subscription_id,
          [...(unusedRows[group.subscription_id] ?? [])].filter(row => row < group.unused_credits).length,
        ]),
      ),
    [subscriptions, unusedRows],
  );
  // The list can change under an open page (another tab, an approval): only what is still selectable counts.
  const activeBookingIds = useMemo(() => {
    const selectable = new Set(subscriptions.flatMap(group => selectableInGroup(group).bookingIds));

    return new Set([...selectedBookingIds].filter(id => selectable.has(id)));
  }, [subscriptions, selectedBookingIds]);
  const totals = useMemo(
    () => selectionTotal(subscriptions, activeBookingIds, unused),
    [subscriptions, activeBookingIds, unused],
  );
  const selection: RecoverySelection = useMemo(
    () => ({
      booking_ids: [...activeBookingIds],
      unused_credits: Object.entries(unused)
        .filter(([, quantity]) => quantity > 0)
        .map(([subscription_id, quantity]) => ({ subscription_id, quantity })),
    }),
    [activeBookingIds, unused],
  );

  const toggleBooking = (bookingId: string, selected: boolean) =>
    setSelectedBookingIds(current => {
      const next = new Set(current);

      if (selected) next.add(bookingId);
      else next.delete(bookingId);

      return next;
    });

  const selectableByGroup = useMemo(
    () =>
      subscriptions.map(group => {
        const available = selectableInGroup(group);

        return available.bookingIds.length + available.unused;
      }),
    [subscriptions],
  );
  const selectableCount = selectableByGroup.reduce((sum, count) => sum + count, 0);
  // With a single plan the card's own button already does this.
  const showSelectAll = selectableByGroup.filter(count => count > 0).length > 1;
  const allSelected = selectableCount > 0 && totals.classes === selectableCount;

  const toggleUnusedRow = (subscriptionId: string, row: number, selected: boolean) =>
    setUnusedRows(current => {
      const next = new Set(current[subscriptionId] ?? NO_ROWS);

      if (selected) next.add(row);
      else next.delete(row);

      return { ...current, [subscriptionId]: next };
    });

  const toggleGroup = (group: RecoverableSubscription, selected: boolean) => {
    setSelectedBookingIds(current => {
      const next = new Set(current);

      for (const bookingId of selectableInGroup(group).bookingIds) {
        if (selected) next.add(bookingId);
        else next.delete(bookingId);
      }

      return next;
    });
    setUnusedRows(current => ({
      ...current,
      [group.subscription_id]: new Set(
        selected ? Array.from({ length: selectableInGroup(group).unused }, (_, row) => row) : [],
      ),
    }));
  };

  const toggleAll = (selected: boolean) => {
    for (const group of subscriptions) toggleGroup(group, selected);
  };

  const subtitle = t('recovery:page.subtitle', { count: settings?.recovery_window_days ?? 0 });

  return (
    <Section navbarPadding contentClassName='grid grid-cols-[minmax(0,1fr)] gap-6 pb-8'>
      <SectionHeading className='mb-0' title={t('recovery:page.title')} subtitle={subtitle} />

      {isLoading && !subscriptions.length ? (
        <div className='grid place-content-center py-12'>
          <SpinnerLoader message={t('recovery:page.loading')} />
        </div>
      ) : hasError ? (
        <p className='py-8 text-center text-muted-foreground'>{t('recovery:page.loadFailed')}</p>
      ) : !subscriptions.length ? (
        <section className='grid justify-items-center gap-4'>
          <div className='w-full'>
            <SectionEmpty message={t('recovery:empty.title')} label={t('recovery:empty.description')} />
          </div>
          <Button
            color='primary'
            variant='outlined'
            type='button'
            onClick={() => navigate(PageURLS.profile.bookings, { viewTransition: true })}
          >
            {t('recovery:empty.goToBookings')}
          </Button>
        </section>
      ) : (
        <>
          {showSelectAll ? (
            <div className='flex justify-end'>
              <Button
                type='button'
                color='primary'
                variant='outlined'
                size='small'
                onClick={() => toggleAll(!allSelected)}
              >
                {t(allSelected ? 'recovery:list.clearAll' : 'recovery:list.selectAll')}
              </Button>
            </div>
          ) : null}
          {subscriptions.map(group => (
            <RecoverableSubscriptionCard
              key={group.subscription_id}
              group={group}
              selectedBookingIds={selectedBookingIds}
              unusedSelected={unusedRows[group.subscription_id] ?? NO_ROWS}
              onToggleBooking={toggleBooking}
              onToggleUnused={toggleUnusedRow}
              onToggleAll={toggleGroup}
            />
          ))}
          <RecoverySummaryBar
            total={totals.amount}
            selectedCount={totals.classes}
            onContinue={() => setIsCheckoutOpen(true)}
          />
        </>
      )}

      <RecoveryCheckoutModal
        isOpen={isCheckoutOpen}
        selection={selection}
        groups={subscriptions}
        onClose={() => setIsCheckoutOpen(false)}
        onSubmitted={() => {
          setSelectedBookingIds(new Set());
          setUnusedRows({});
          void reload();
        }}
      />
    </Section>
  );
}

export const SecureRecoverClassesPage = SecurityGuard(RecoverClassesPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
