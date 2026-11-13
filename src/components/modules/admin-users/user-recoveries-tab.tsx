import { format } from 'date-fns';
import { Button } from 'polpo/components';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import {
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@components/ui';
import { useOrPermissions } from '@contexts';
import { DansshipAPI, type RecoverableClass } from '@core/api';
import { AdminPermissions } from '@core/permissions';
import { formatPrice } from '@helpers';
import { useCallablePromise, useDateLocale, useUserClassRecoveries } from '@hooks';

/** 360 "Recuperaciones": lost recoverable classes, paid recoveries and courtesy returns (ADR-056). */
export function UserRecoveriesTab({ userId }: { userId: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const { data, isLoading, reload } = useUserClassRecoveries(userId);
  const canGiveCourtesy = useOrPermissions(AdminPermissions.classCreditRefund);
  const [courtesyFor, setCourtesyFor] = useState<RecoverableClass | null>(null);
  const [reason, setReason] = useState('');
  const { call: reimburse, isLoading: isReimbursing } = useCallablePromise((bookingId: string, text: string) =>
    DansshipAPI.assistedAdmin.reimburseBooking(bookingId, { reason: text }),
  );
  const day = (value: string) => format(new Date(value), 'd MMM yyyy', { locale });

  if (isLoading && !data) {
    return (
      <div className='flex justify-center p-8'>
        <SpinnerLoader />
      </div>
    );
  }

  const lost = (data?.recoverable ?? []).flatMap(group =>
    group.classes.map(item => ({ item, planName: group.plan_name })),
  );

  const confirmCourtesy = async () => {
    if (!courtesyFor) return;

    if (!reason.trim()) {
      toast.error(t('recovery:admin.user.courtesyReasonRequired'));

      return;
    }

    const { ok } = await reimburse(courtesyFor.booking_id, reason.trim());

    if (!ok) {
      toast.error(t('admin:users.details.reimburseFailed'));

      return;
    }

    toast.success(t('admin:users.details.reimburseSuccess'));
    setCourtesyFor(null);
    setReason('');
    void reload();
  };

  return (
    <div className='grid gap-4'>
      <p className='m-0 text-sm text-muted-foreground'>{t('recovery:admin.user.intro')}</p>

      <Card>
        <CardHeader>
          <CardTitle>{t('recovery:admin.user.lostTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {lost.length === 0 ? (
            <p className='m-0 text-sm text-muted-foreground'>{t('recovery:admin.user.noLost')}</p>
          ) : (
            <ul className='m-0 grid list-none gap-3 p-0'>
              {lost.map(({ item, planName }) => (
                <li key={item.booking_id} className='flex flex-wrap items-center justify-between gap-2 text-sm'>
                  <span>
                    {item.class_name} · {day(item.class_start)} · {planName}{' '}
                    <Badge variant='outlineNeutral'>{t(`recovery:list.lossReason.${item.loss_reason}`)}</Badge>
                    {item.attendee_name ? <Badge className='ml-2'>{item.attendee_name}</Badge> : null}
                  </span>
                  {canGiveCourtesy ? (
                    <Button
                      color='primary'
                      variant='text'
                      size='small'
                      type='button'
                      onClick={() => setCourtesyFor(item)}
                    >
                      {t('recovery:admin.user.courtesyButton')}
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('recovery:admin.user.historyTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.recoveries.length && !data?.courtesy.length ? (
            <p className='m-0 text-sm text-muted-foreground'>{t('recovery:admin.user.noHistory')}</p>
          ) : (
            <div className='overflow-x-auto rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('recovery:admin.user.columns.date')}</TableHead>
                    <TableHead>{t('recovery:admin.user.columns.detail')}</TableHead>
                    <TableHead>{t('recovery:admin.user.columns.type')}</TableHead>
                    <TableHead>{t('recovery:admin.user.columns.status')}</TableHead>
                    <TableHead className='text-right'>{t('recovery:admin.user.columns.amount')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.recoveries.map(recovery => (
                    <TableRow key={recovery.id}>
                      <TableCell>{day(recovery.submitted_at)}</TableCell>
                      <TableCell>{t('recovery:admin.user.classesCount', { count: recovery.classes_count })}</TableCell>
                      <TableCell>
                        <Badge variant='outlineActive'>{t('recovery:admin.user.paid')}</Badge>
                      </TableCell>
                      <TableCell>{t(`recovery:admin.user.status.${recovery.status}`)}</TableCell>
                      <TableCell className='text-right'>{formatPrice(recovery.total_amount, 'COP')}</TableCell>
                    </TableRow>
                  ))}
                  {data?.courtesy.map(entry => (
                    <TableRow key={`${entry.booking_id}-${entry.created_at}`}>
                      <TableCell>{day(entry.created_at)}</TableCell>
                      <TableCell>
                        {t(`recovery:admin.user.courtesyAction.${entry.action}`)}
                        {entry.reason ? ` · ${entry.reason}` : ''}
                      </TableCell>
                      <TableCell>
                        <Badge variant='outlineNeutral'>{t('recovery:admin.user.courtesy')}</Badge>
                      </TableCell>
                      <TableCell>—</TableCell>
                      <TableCell className='text-right'>{formatPrice(0, 'COP')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={Boolean(courtesyFor)}
        onOpenChange={open => {
          if (!open && !isReimbursing) {
            setCourtesyFor(null);
            setReason('');
          }
        }}
        onConfirm={confirmCourtesy}
        title={t('recovery:admin.user.courtesyTitle')}
        description={
          <span className='grid gap-3'>
            <span>{t('recovery:admin.user.courtesyDescription')}</span>
            <Textarea
              aria-label={t('recovery:admin.user.courtesyReason')}
              placeholder={t('recovery:admin.user.courtesyReason')}
              rows={3}
              value={reason}
              onChange={event => setReason(event.target.value)}
            />
          </span>
        }
        confirmLabel={t('recovery:admin.user.courtesyConfirm')}
        isLoading={isReimbursing}
      />
    </div>
  );
}
