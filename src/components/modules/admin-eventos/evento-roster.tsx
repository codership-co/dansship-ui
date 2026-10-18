import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@components/ui';
import { DansshipAPI, DansshipAPIError, type EventRosterEntry, type RegistrationInstallment } from '@core/api';
import { formatPrice, groupEventRosterByPurchase } from '@helpers';
import { useDateLocale } from '@hooks';

interface EventoRosterProps {
  rows: Array<EventRosterEntry>;
  eventId?: string;
  canWithdraw?: boolean;
  onWithdrawn?: () => void;
}

function installmentStatusLabel(status: string, t: (key: string) => string) {
  return t(`bookings:installmentStatus.${status}`);
}

function paidByLabel(
  installment: RegistrationInstallment,
  t: (key: string, options?: Record<string, unknown>) => string,
) {
  if (installment.status !== 'paid') {
    return null;
  }

  if (installment.registered_by_name) {
    return t('eventos:admin.registeredByAdmin', { name: installment.registered_by_name });
  }

  return t('eventos:admin.registeredByStudent');
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

export function EventoRoster({ rows, eventId, canWithdraw = false, onWithdrawn }: EventoRosterProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const groups = groupEventRosterByPurchase(rows);
  const showInstallments = rows.some(row => (row.installments?.length ?? 0) > 0);
  const [pending, setPending] = useState<EventRosterEntry | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);

  const confirmWithdraw = async () => {
    if (!pending || !eventId) {
      return;
    }

    setWithdrawing(true);

    try {
      const result = await DansshipAPI.eventosAdmin.withdrawRegistrant(eventId, pending.id);

      if (!result.ok) {
        const code = result.error instanceof DansshipAPIError ? result.error.body.error_code : '';
        toast.error(code || t('eventos:admin.withdrawFailed'));

        return;
      }

      toast.success(t('eventos:admin.withdrawSaved'));
      setPending(null);
      onWithdrawn?.();
    } finally {
      setWithdrawing(false);
    }
  };

  if (groups.length === 0) {
    return <p className='text-sm text-muted-foreground'>{t('eventos:admin.rosterEmpty')}</p>;
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('eventos:admin.name')}</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>{t('eventos:admin.columns.status')}</TableHead>
            {showInstallments ? <TableHead>{t('eventos:admin.installments')}</TableHead> : null}
            <TableHead>{t('eventos:admin.rosterOrigin')}</TableHead>
            <TableHead>{t('eventos:admin.rosterRegisteredAt')}</TableHead>
            {canWithdraw ? <TableHead /> : null}
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
                {showInstallments ? (
                  <TableCell>
                    <div className='grid gap-2'>
                      {group.members.map(member => (
                        <div key={member.id} className='grid gap-1'>
                          {(member.installments ?? []).map(installment => (
                            <p key={installment.sequence} className='m-0 text-xs'>
                              {t('eventos:admin.installmentQuoteLine', {
                                sequence: installment.sequence,
                                amount: formatPrice(Number(installment.amount), 'COP'),
                                due: installment.due_date,
                                status: installmentStatusLabel(installment.status, t),
                              })}
                              {paidByLabel(installment, t) ? ` · ${paidByLabel(installment, t)}` : ''}
                            </p>
                          ))}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                ) : null}
                <TableCell>{sourceLabel(group.members, t)}</TableCell>
                <TableCell>{registeredAt ? format(new Date(registeredAt), 'PPp', { locale }) : '—'}</TableCell>
                {canWithdraw ? (
                  <TableCell>
                    <div className='grid gap-1'>
                      {group.members
                        .filter(member => member.status === 'confirmed')
                        .map(member => (
                          <Button
                            color='primary'
                            variant='outlined'
                            size='small'
                            key={member.id}
                            type='button'
                            onClick={() => setPending(member)}
                          >
                            {t('eventos:admin.withdraw')}
                          </Button>
                        ))}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
      <Dialog open={pending !== null} onOpenChange={open => !withdrawing && !open && setPending(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('eventos:admin.withdrawTitle')}</DialogTitle>
            <DialogDescription>{t('eventos:admin.withdrawBody')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              color='primary'
              variant='outlined'
              type='button'
              disabled={withdrawing}
              onClick={() => setPending(null)}
            >
              {t('eventos:admin.withdrawCancel')}
            </Button>
            <Button
              color='primary'
              variant='solid'
              type='button'
              disabled={withdrawing}
              onClick={() => void confirmWithdraw()}
            >
              {t('eventos:admin.withdrawConfirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
