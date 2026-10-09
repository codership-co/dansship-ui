import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { formatMoney } from '@components/modules/admin-reports/report-date-range';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI, type AdminUserEventRegistration } from '@core/api';
import { useDateLocale, usePromise } from '@hooks';

export function UserEventsTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { response, isLoading } = usePromise(() => DansshipAPI.eventosAdmin.listUserRegistrations(userId), !!userId);
  const rows = response?.data ?? [];

  if (isLoading) {
    return (
      <div className='grid place-content-center py-12'>
        <SpinnerLoader message={t('admin:users.details.loading')} />
      </div>
    );
  }

  if (!rows.length) {
    return <p className='py-8 text-center text-sm text-muted-foreground'>{t('admin:users.details.emptyEventos')}</p>;
  }

  return (
    <div className='rounded-md border bg-white/50'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('admin:users.details.columns.evento')}</TableHead>
            <TableHead>{t('admin:users.details.columns.startTime')}</TableHead>
            <TableHead>{t('common:status')}</TableHead>
            <TableHead>{t('admin:users.details.columns.origin')}</TableHead>
            <TableHead className='text-right'>{t('admin:users.details.columns.ticketPrice')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(row => (
            <TableRow key={row.id}>
              <TableCell>{row.type_label ? `${row.type_label}: ${row.event_name}` : row.event_name}</TableCell>
              <TableCell>
                {format(parseISO(row.starts_at), 'MMM d, yyyy HH:mm', {
                  locale,
                })}
              </TableCell>
              <TableCell>{t(`eventos:admin.rosterStatus.${row.status}`)}</TableCell>
              <TableCell>{originLabel(row, t)}</TableCell>
              <TableCell className='text-right'>{formatMoney(row.resolved_price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function originLabel(row: AdminUserEventRegistration, t: ReturnType<typeof useTranslation>['t']) {
  if (row.source !== 'combo') {
    return t('eventos:admin.rosterSourceDirect');
  }

  const comboLabel = row.combo_name
    ? `${t('eventos:admin.rosterSourceCombo')}: ${row.combo_name}`
    : t('eventos:admin.rosterSourceCombo');
  const siblings = row.combo_events.map(item => item.name).filter(Boolean);

  if (!siblings.length) {
    return comboLabel;
  }

  return `${comboLabel} · ${t('admin:users.details.comboAlsoIncludes', { names: siblings.join(', ') })}`;
}
