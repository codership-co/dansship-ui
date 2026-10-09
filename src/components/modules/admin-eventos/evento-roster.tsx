import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { type EventRosterEntry } from '@core/api';
import { groupEventRosterByPurchase } from '@helpers';
import { useDateLocale } from '@hooks';

interface EventoRosterProps {
  rows: Array<EventRosterEntry>;
}

function sourceLabel(members: Array<EventRosterEntry>, t: (key: string, options?: Record<string, unknown>) => string) {
  const comboMember = members.find(member => member.source === 'combo');

  if (comboMember) {
    return comboMember.combo_name
      ? `${t('eventos:admin.rosterSourceCombo')}: ${comboMember.combo_name}`
      : t('eventos:admin.rosterSourceCombo');
  }

  return t('eventos:admin.rosterSourceDirect');
}

export function EventoRoster({ rows }: EventoRosterProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const groups = groupEventRosterByPurchase(rows);

  if (groups.length === 0) {
    return <p className='text-sm text-muted-foreground'>{t('eventos:admin.rosterEmpty')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('eventos:admin.name')}</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>{t('eventos:admin.columns.status')}</TableHead>
          <TableHead>{t('eventos:admin.rosterOrigin')}</TableHead>
          <TableHead>{t('eventos:admin.rosterRegisteredAt')}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map(group => {
          const registeredAt = group.members.map(member => member.created_at).sort()[0];

          return (
            <TableRow key={group.purchaseId}>
              <TableCell>
                <div className='grid gap-1'>
                  {group.members.length > 1 ? (
                    <p className='m-0 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase'>
                      {t('eventos:admin.rosterPair')}
                    </p>
                  ) : null}
                  {group.members.map(member => (
                    <p key={member.id} className='m-0 font-medium'>
                      {member.display_name}
                    </p>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className='grid gap-1'>
                  {group.members.map(member => (
                    <p key={member.id} className='m-0'>
                      {member.email}
                    </p>
                  ))}
                </div>
              </TableCell>
              <TableCell>
                <div className='grid gap-1'>
                  {group.members.map(member => (
                    <p key={member.id} className='m-0'>
                      {t(`eventos:admin.rosterStatus.${member.status}`, { defaultValue: member.status })}
                    </p>
                  ))}
                </div>
              </TableCell>
              <TableCell>{sourceLabel(group.members, t)}</TableCell>
              <TableCell>{registeredAt ? format(new Date(registeredAt), 'PPp', { locale }) : '—'}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
