import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

export function UserBenefitsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading } = usePromise(() => DansshipAPI.benefitsAdmin.listGrants({ user_id: userId }), !!userId);
  const grants = response?.data ?? [];

  if (isLoading) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  if (!grants.length) {
    return <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:users.details.emptyBenefits')}</p>;
  }

  return (
    <div className='rounded-md border bg-white/50'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:users.details.columns.benefit')}</TableHead>
            <TableHead>{t('common:status')}</TableHead>
            <TableHead>{t('admin:users.details.columns.grantedAt')}</TableHead>
            <TableHead>{t('admin:users.details.columns.expires')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {grants.map(grant => (
            <TableRow key={grant.id}>
              <TableCell>{grant.benefit_definition?.name ?? grant.benefit_definition?.code ?? '-'}</TableCell>
              <TableCell>{grant.status}</TableCell>
              <TableCell>{format(parseISO(grant.granted_at), 'MMM d, yyyy', { locale })}</TableCell>
              <TableCell>
                {grant.expires_at ? format(parseISO(grant.expires_at), 'MMM d, yyyy', { locale }) : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
