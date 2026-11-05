import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { AccountDataTab } from './account-data-tab';
import { AccountLinksTab } from './account-links-tab';
import { AccountMergeTab } from './account-merge-tab';
import { ACCOUNT_SUBTAB, ACCOUNT_SUBTAB_PERMISSIONS, type AccountSubtab, isAccountSubtab } from './assisted-tabs';

import { AdminRegisterUser } from '@components/modules/admin-users/admin-register-user';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui';
import { useOrPermissions } from '@contexts';

const SUBTAB_ORDER: Array<AccountSubtab> = [
  ACCOUNT_SUBTAB.create,
  ACCOUNT_SUBTAB.data,
  ACCOUNT_SUBTAB.links,
  ACCOUNT_SUBTAB.merge,
];

export function AccountTab() {
  const { t } = useTranslation('assisted');
  const [searchParams, setSearchParams] = useSearchParams();
  const canCreate = useOrPermissions(ACCOUNT_SUBTAB_PERMISSIONS.create);
  const canData = useOrPermissions(ACCOUNT_SUBTAB_PERMISSIONS.data);
  const canLinks = useOrPermissions(ACCOUNT_SUBTAB_PERMISSIONS.links);
  const canMerge = useOrPermissions(ACCOUNT_SUBTAB_PERMISSIONS.merge);
  const allowed: Record<AccountSubtab, boolean> = {
    create: canCreate,
    data: canData,
    links: canLinks,
    merge: canMerge,
  };
  const visible = SUBTAB_ORDER.filter(subtab => allowed[subtab]);
  const requested = searchParams.get('sub');
  const active = isAccountSubtab(requested) && allowed[requested] ? requested : visible[0];

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

            params.set('sub', value);

            return params;
          },
          { replace: true },
        )
      }
    >
      <TabsList variant='line' className='h-auto max-w-full flex-wrap justify-start'>
        {visible.map(subtab => (
          <TabsTrigger key={subtab} value={subtab}>
            {t(`account.subtabs.${subtab}`)}
          </TabsTrigger>
        ))}
      </TabsList>
      {canCreate ? (
        <TabsContent value={ACCOUNT_SUBTAB.create}>
          <AdminRegisterUser />
        </TabsContent>
      ) : null}
      {canData ? (
        <TabsContent value={ACCOUNT_SUBTAB.data}>
          <AccountDataTab />
        </TabsContent>
      ) : null}
      {canLinks ? (
        <TabsContent value={ACCOUNT_SUBTAB.links}>
          <AccountLinksTab />
        </TabsContent>
      ) : null}
      {canMerge ? (
        <TabsContent value={ACCOUNT_SUBTAB.merge}>
          <AccountMergeTab />
        </TabsContent>
      ) : null}
    </Tabs>
  );
}
