import { useTranslation } from 'react-i18next';

import { SpinnerLoader } from '@components/loaders';
import { Card, CardContent, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import { DansshipAPI } from '@core/api';
import { formatPrice } from '@helpers';
import { usePromise } from '@hooks';

function StatCard({ title, value, detail }: { title: string; value: string; detail?: string }) {
  return (
    <Card>
      <CardContent className='grid gap-1 pt-6'>
        <p className='m-0 text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase'>{title}</p>
        <p className='m-0 font-title text-2xl font-bold'>{value}</p>
        {detail ? <p className='m-0 text-xs text-muted-foreground'>{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

/** "Resumen": seats against capacity, registrations, people in the room, revenue and donations. */
export function ParticipationSummaryPanel({ eventId }: { eventId: string }) {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.participationAdmin.getSummary(eventId), true, [eventId]);

  if (isLoading && !response) {
    return <SpinnerLoader />;
  }

  const summary = response?.data;

  if (!summary) {
    return <p className='text-alert-600'>{t('eventos:participation.summary.loadFailed')}</p>;
  }

  const people = summary.expected_people;

  return (
    <div className='grid gap-4'>
      <div className='grid gap-3 sm:grid-cols-2 lg:grid-cols-4'>
        <StatCard
          title={t('eventos:participation.summary.seats')}
          value={`${summary.capacity.held} / ${summary.capacity.capacity}`}
          detail={t('eventos:participation.summary.freeSeats', { count: summary.capacity.free })}
        />
        {summary.registrations.map(row => (
          <StatCard
            key={row.participant_type_id}
            title={t('eventos:participation.summary.registrations', { name: row.name })}
            value={String(row.total)}
            detail={t('eventos:participation.summary.registrationsDetail', {
              approved: row.approved,
              review: row.in_review,
              rejected: row.not_approved,
            })}
          />
        ))}
        <StatCard
          title={t('eventos:participation.summary.expected')}
          value={String(people.total)}
          detail={t('eventos:participation.summary.expectedDetail', {
            tickets: people.tickets,
            minors: people.ticket_minors,
            performers: people.performers,
            members: people.members,
          })}
        />
        <StatCard
          title={t('eventos:participation.summary.revenue')}
          value={formatPrice(Number(summary.revenue.total), 'COP')}
          detail={t('eventos:participation.summary.revenueDetail', {
            approved: formatPrice(Number(summary.revenue.approved), 'COP'),
            review: formatPrice(Number(summary.revenue.in_review), 'COP'),
          })}
        />
      </div>
      <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.summary.capacityHint')}</p>
      {summary.revenue.by_fee.length > 0 ? (
        <Card>
          <CardContent className='grid gap-2 pt-6'>
            <p className='m-0 font-semibold'>{t('eventos:participation.summary.byFee')}</p>
            {summary.revenue.by_fee.map(row => (
              <div key={`${row.label}-${row.amount}`} className='flex justify-between gap-3 text-sm'>
                <span>
                  {t('eventos:participation.summary.feeLine', {
                    count: row.count,
                    price: formatPrice(Number(row.amount), 'COP'),
                  })}
                </span>
                <span className='font-semibold'>{formatPrice(Number(row.total), 'COP')}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}
      {summary.donations.length > 0 ? (
        <Card>
          <CardContent className='grid gap-2 pt-6'>
            <p className='m-0 font-semibold'>{t('eventos:participation.summary.donations')}</p>
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('eventos:participation.summary.donationType')}</TableHead>
                    <TableHead>{t('eventos:participation.summary.committed')}</TableHead>
                    <TableHead>{t('eventos:participation.summary.received')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.donations.map(row => (
                    <TableRow key={row.donation_type_id}>
                      <TableCell>{row.label}</TableCell>
                      <TableCell>
                        {t('eventos:participation.summary.committedCount', { count: row.committed })}
                      </TableCell>
                      <TableCell>{row.received}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
