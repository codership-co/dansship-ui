import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { AccountTab } from './account-tab';
import { ASSISTED_TAB, ASSISTED_TAB_ORDER, type AssistedTab, canSeeTab, isAssistedTab } from './assisted-tabs';
import { BenefitsTab } from './benefits-tab';
import { ClassTab } from './class-tab';
import { ContactsTab } from './contacts-tab';
import { EventTab } from './event-tab';
import { PlanTab } from './plan-tab';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { useAuth } from '@contexts';

import type { PERMISSION } from '@core/permissions';

export function AssistedPage() {
  const { t } = useTranslation('assisted');
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const has = (permissions: Array<PERMISSION>) =>
    permissions.some(permission => user?.permissions.includes(permission));
  const visible = ASSISTED_TAB_ORDER.filter(tab => canSeeTab(tab, has));
  const requested = searchParams.get('tab');
  // "Dar atención" lands on Clase when no tab is given; otherwise the first tab the user may see.
  const fallback: AssistedTab | undefined = visible.includes(ASSISTED_TAB.class) ? ASSISTED_TAB.class : visible[0];
  const active = isAssistedTab(requested) && visible.includes(requested) ? requested : fallback;

  if (!active) {
    return null;
  }

  return (
    <Tabs
      value={active}
      onValueChange={value =>
        setSearchParams(
          previous => {
            const params = new URLSearchParams(previous);

            params.set('tab', value);
            params.delete('sub');

            return params;
          },
          { replace: true },
        )
      }
    >
      <TabsList className='h-auto max-w-full flex-wrap justify-start gap-1 border bg-background p-1 shadow-sm'>
        {visible.map(tab => (
          <TabsTrigger key={tab} value={tab} className='flex-none'>
            {t(`tabs.${tab}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value={ASSISTED_TAB.account}>{active === ASSISTED_TAB.account ? <AccountTab /> : null}</TabsContent>
      <TabsContent value={ASSISTED_TAB.plan}>{active === ASSISTED_TAB.plan ? <PlanTab /> : null}</TabsContent>
      <TabsContent value={ASSISTED_TAB.class}>{active === ASSISTED_TAB.class ? <ClassTab /> : null}</TabsContent>
      <TabsContent value={ASSISTED_TAB.event}>{active === ASSISTED_TAB.event ? <EventTab /> : null}</TabsContent>
      <TabsContent value={ASSISTED_TAB.benefits}>
        {active === ASSISTED_TAB.benefits ? <BenefitsTab /> : null}
      </TabsContent>
      <TabsContent value={ASSISTED_TAB.contacts}>
        {active === ASSISTED_TAB.contacts ? <ContactsTab /> : null}
      </TabsContent>
    </Tabs>
  );
}
