import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { type WorkshopRosterEntry } from '@core/api';
import { groupWorkshopRosterByPurchase } from '@helpers';
import { useDateLocale } from '@hooks';

interface TallerRosterProps {
  rows: Array<WorkshopRosterEntry>;
}

function sourceLabel(
  members: Array<WorkshopRosterEntry>,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  const comboMember = members.find(member => member.source === 'combo');

  if (comboMember) {
    return comboMember.combo_name
      ? `${t('talleres:admin.rosterSourceCombo')}: ${comboMember.combo_name}`
      : t('talleres:admin.rosterSourceCombo');
  }

  return t('talleres:admin.rosterSourceDirect');
}

export function TallerRoster({ rows }: TallerRosterProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const groups = groupWorkshopRosterByPurchase(rows);

  if (groups.length === 0) {
    return <p className='text-sm text-muted-foreground'>{t('talleres:admin.rosterEmpty')}</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t('talleres:admin.name')}</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>{t('talleres:admin.columns.status')}</TableHead>
          <TableHead>{t('talleres:admin.rosterOrigin')}</TableHead>
          <TableHead>{t('talleres:admin.rosterRegisteredAt')}</TableHead>
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
                      {t('talleres:admin.rosterPair')}
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
                      {t(`talleres:admin.rosterStatus.${member.status}`, { defaultValue: member.status })}
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
