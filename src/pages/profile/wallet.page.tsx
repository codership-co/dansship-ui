import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Section, SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { FEATURE_FLAG, SecurityGuard } from '@contexts';
import { DansshipAPI } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatPrice } from '@helpers';
import { useDateLocale, usePromise } from '@hooks';

function WalletPage() {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading, error } = usePromise(() => DansshipAPI.wallets.getMine());
  const wallet = response?.data;
  const hasError = Boolean(error) || Boolean(response && !response.ok);

  return (
    <Section navbarPadding className='grid gap-6 pb-8'>
      <SectionHeading title={t('profile:wallet.title')} subtitle={t('profile:wallet.subtitle')} />

      {isLoading && !wallet ? (
        <div className='grid place-content-center py-12'>
          <SpinnerLoader message={t('profile:wallet.loading')} />
        </div>
      ) : hasError ? (
        <p className='py-8 text-center text-sm text-muted-foreground'>{t('profile:wallet.loadFailed')}</p>
      ) : (
        <>
          <div className='rounded-md border bg-white/50 p-4'>
            <p className='text-sm text-muted-foreground'>{t('profile:wallet.balanceLabel')}</p>
            <p className='text-3xl font-semibold text-primary'>{formatPrice(wallet?.balance ?? 0, 'COP')}</p>
            <p className='mt-2 text-xs text-muted-foreground'>{t('profile:wallet.balanceHint')}</p>
          </div>

          {!wallet?.entries.length ? (
            <p className='py-8 text-center text-sm text-muted-foreground'>{t('profile:wallet.empty')}</p>
          ) : (
            <div className='rounded-md border bg-white/50 overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('profile:wallet.columns.date')}</TableHead>
                    <TableHead>{t('profile:wallet.columns.type')}</TableHead>
                    <TableHead>{t('profile:wallet.columns.amount')}</TableHead>
                    <TableHead>{t('profile:wallet.columns.note')}</TableHead>
                    <TableHead>{t('profile:wallet.columns.runningBalance')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {wallet.entries.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell>{format(parseISO(entry.created_at), 'MMM d, yyyy HH:mm', { locale })}</TableCell>
                      <TableCell>
                        {entry.entry_type === 'credit' ? t('profile:wallet.credit') : t('profile:wallet.debit')}
                      </TableCell>
                      <TableCell>{formatPrice(entry.amount, 'COP')}</TableCell>
                      <TableCell className='max-w-xs truncate' title={entry.note}>
                        {entry.note}
                      </TableCell>
                      <TableCell>{formatPrice(entry.running_balance, 'COP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </>
      )}
    </Section>
  );
}

export const SecureWalletPage = SecurityGuard(WalletPage, {
  featureFlags: [FEATURE_FLAG.areUserPagesEnabled],
  requiresAuth: true,
  redirect: PageURLS.auth.login,
});
