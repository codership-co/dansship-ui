import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuDownload } from 'react-icons/lu';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { SpinnerLoader } from '@components/loaders';
import { AdminPaymentReviewModal } from '@components/modules/admin-payments';
import { Badge, Input, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui';
import {
  adminCellText,
  DansshipAPI,
  type AdminPaymentReviewPayload,
  type PaymentIntent,
  signupStatusLabel,
  signupStatusTone,
  type ParticipationPeopleQuery,
  type ParticipationPersonRow,
  type PeopleFilterChip,
  type PeopleStatusGroup,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatPrice } from '@helpers';
import { usePromise } from '@hooks';

const SELECT_CLASS = 'h-10 rounded-md border border-input bg-background px-3 text-sm';
const TONE_BADGE = { approved: 'outlineActive', review: 'outlineWarning', rejected: 'outlineNeutral' } as const;

function chipKey(chip: Pick<PeopleFilterChip, 'kind' | 'participant_type_id'>) {
  return `${chip.kind}:${chip.participant_type_id ?? ''}`;
}

export function PersonStatusBadge({ row }: { row: Pick<ParticipationPersonRow, 'status'> }) {
  const { t } = useTranslation();

  return (
    <Badge variant={TONE_BADGE[signupStatusTone(row.status)]} size='small'>
      {signupStatusLabel(row.status, t, 'admin')}
    </Badge>
  );
}

function roleLabel(row: ParticipationPersonRow, t: (key: string, options?: Record<string, unknown>) => string) {
  if (row.role === 'member') {
    return row.is_minor
      ? t('eventos:participation.people.minorMember', { name: row.leader_name ?? '' })
      : t('eventos:participation.people.member', { title: row.signup_title ?? '' });
  }

  if (row.role === 'holder' && row.member_count > 1) {
    return t('eventos:participation.people.leader', { type: row.participant_type_name });
  }

  return row.participant_type_name;
}

/** "Inscritos": every person of the event with type and status filters, search and CSV. */
export function ParticipationPeopleTable({ eventId, eventSlug }: { eventId: string; eventSlug: string }) {
  const { t } = useTranslation();
  const [chip, setChip] = useState<Pick<PeopleFilterChip, 'kind' | 'participant_type_id'>>({
    kind: 'all',
    participant_type_id: null,
  });
  const [status, setStatus] = useState<PeopleStatusGroup | ''>('');
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const handle = window.setTimeout(() => setQuery(search), 300);

    return () => window.clearTimeout(handle);
  }, [search]);

  const filters: ParticipationPeopleQuery = {
    kind: chip.kind,
    participant_type_id: chip.participant_type_id,
    status: status || null,
    q: query || null,
  };
  const [reviewIntent, setReviewIntent] = useState<PaymentIntent | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const { response, isLoading, reFetch } = usePromise(
    () => DansshipAPI.participationAdmin.listPeople(eventId, filters),
    true,
    [eventId, chip.kind, chip.participant_type_id, status, query],
  );
  const data = response?.data;
  const holders = chip.kind === 'holders';
  const members = chip.kind === 'members';
  const tickets = chip.kind === 'tickets';

  const exportCsv = async () => {
    setDownloading(true);
    try {
      await DansshipAPI.participationAdmin.downloadPeopleCsv(eventId, filters, `inscritos-${eventSlug}.csv`);
    } catch {
      toast.error(t('eventos:participation.people.csvFailed'));
    } finally {
      setDownloading(false);
    }
  };

  /** "Revisar comprobante": the existing payment review, opened from the ticket row. */
  const openReview = async (intentId: string) => {
    const { ok, data } = await DansshipAPI.paymentsAdmin.getAdminPaymentDetail(intentId);

    if (!ok || !data) {
      toast.error(t('eventos:participation.people.reviewFailed'));

      return;
    }

    setReviewIntent(data);
  };

  const review = async (id: string, payload: AdminPaymentReviewPayload) => {
    setReviewing(true);
    try {
      const { ok } = await DansshipAPI.paymentsAdmin.reviewPayment(id, payload);

      if (ok) {
        toast.success(t('payments:admin.reviewSuccess'));
        setReviewIntent(null);
        await reFetch();
      } else {
        toast.error(t('payments:admin.reviewFailedDesc'));
      }
    } finally {
      setReviewing(false);
    }
  };

  const chipLabel = (item: PeopleFilterChip) =>
    item.kind === 'all'
      ? t('eventos:participation.people.all')
      : item.kind === 'members'
        ? t('eventos:participation.people.members')
        : (item.participant_type_name ?? '');

  return (
    <div className='grid gap-4'>
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex flex-wrap gap-2' role='group' aria-label={t('eventos:participation.people.typeFilter')}>
          {(data?.filters ?? []).map(item => {
            const active = chipKey(item) === chipKey(chip);

            return (
              <button
                key={chipKey(item)}
                type='button'
                aria-pressed={active}
                onClick={() => setChip({ kind: item.kind, participant_type_id: item.participant_type_id })}
                className={cn(
                  'rounded-full border px-3 py-1.5 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary',
                  active ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white',
                )}
              >
                {chipLabel(item)} · {item.count}
              </button>
            );
          })}
        </div>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          disabled={downloading}
          onClick={() => void exportCsv()}
        >
          <LuDownload className='size-4' aria-hidden />
          {t('eventos:participation.people.exportCsv')}
        </Button>
      </div>
      <div className='grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]'>
        <Input
          type='search'
          value={search}
          placeholder={t('eventos:participation.people.search')}
          aria-label={t('eventos:participation.people.search')}
          onChange={change => setSearch(change.target.value)}
        />
        <select
          aria-label={t('eventos:participation.people.statusFilter')}
          className={SELECT_CLASS}
          value={status}
          onChange={change => setStatus(change.target.value as PeopleStatusGroup | '')}
        >
          <option value=''>{t('eventos:participation.people.allStatuses')}</option>
          <option value='review'>{t('eventos:participation.people.statusReview')}</option>
          <option value='approved'>{t('eventos:participation.people.statusApproved')}</option>
          <option value='not_approved'>{t('eventos:participation.people.statusRejected')}</option>
        </select>
      </div>
      {isLoading && !data ? (
        <SpinnerLoader />
      ) : !data || data.rows.length === 0 ? (
        <p className='rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground'>
          {t('eventos:participation.people.empty')}
        </p>
      ) : (
        <div className='overflow-x-auto rounded-xl border border-border bg-white'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('eventos:participation.people.person')}</TableHead>
                {holders ? (
                  data.columns.map(column => <TableHead key={column.key}>{column.label}</TableHead>)
                ) : members ? (
                  <>
                    <TableHead>{t('eventos:participation.people.phone')}</TableHead>
                    <TableHead>{t('eventos:participation.people.group')}</TableHead>
                    <TableHead>{t('eventos:participation.people.leaderColumn')}</TableHead>
                  </>
                ) : tickets ? (
                  <>
                    <TableHead>{t('eventos:participation.people.buyer')}</TableHead>
                    <TableHead>{t('eventos:participation.people.fee')}</TableHead>
                  </>
                ) : (
                  <TableHead>{t('eventos:participation.people.type')}</TableHead>
                )}
                {holders ? (
                  <>
                    <TableHead>{t('eventos:participation.people.groupSize')}</TableHead>
                    <TableHead>{t('eventos:participation.people.donations')}</TableHead>
                    <TableHead>{t('eventos:participation.people.donationReceived')}</TableHead>
                  </>
                ) : null}
                <TableHead>{t('eventos:participation.people.status')}</TableHead>
                <TableHead>
                  <span className='sr-only'>{t('eventos:participation.people.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.rows.map(row => (
                <TableRow key={row.person_id}>
                  <TableCell className='min-w-48'>
                    <p className='m-0 font-semibold'>{row.full_name}</p>
                    <p className='m-0 text-xs text-muted-foreground'>
                      {row.email ??
                        (row.age !== null
                          ? t('eventos:participation.people.noEmailAge', { age: row.age })
                          : t('eventos:participation.people.noEmail'))}
                    </p>
                  </TableCell>
                  {holders ? (
                    data.columns.map(column => (
                      <TableCell key={column.key}>{adminCellText(row.answers[column.key], t)}</TableCell>
                    ))
                  ) : members ? (
                    <>
                      <TableCell>{row.phone ?? '—'}</TableCell>
                      <TableCell>{row.signup_title ?? '—'}</TableCell>
                      <TableCell>{row.leader_name ?? '—'}</TableCell>
                    </>
                  ) : tickets ? (
                    <>
                      <TableCell>
                        {row.is_minor && row.attached_to_name
                          ? t('eventos:participation.people.entersWith', { name: row.attached_to_name })
                          : (row.buyer_name ?? '—')}
                      </TableCell>
                      <TableCell>
                        {row.amount !== null ? formatPrice(Number(row.amount), 'COP') : t('eventos:participation.free')}
                      </TableCell>
                    </>
                  ) : (
                    <TableCell>{roleLabel(row, t)}</TableCell>
                  )}
                  {holders ? (
                    <>
                      <TableCell>
                        {row.member_count > 1
                          ? t('eventos:participation.people.groupOf', {
                              count: row.member_count,
                              minors: row.minor_count,
                            })
                          : t('eventos:participation.people.solo')}
                      </TableCell>
                      <TableCell>{row.donations.length ? row.donations.join(', ') : '—'}</TableCell>
                      <TableCell>
                        {row.donation_received ? t('eventos:participation.yes') : t('eventos:participation.no')}
                      </TableCell>
                    </>
                  ) : null}
                  <TableCell>
                    <PersonStatusBadge row={row} />
                  </TableCell>
                  <TableCell className='text-right'>
                    {row.role === 'ticket' &&
                    row.payment_intent_id &&
                    row.payment_status === 'pending_manual_review' &&
                    !row.is_minor ? (
                      <Button
                        type='button'
                        variant='text'
                        color='primary'
                        size='small'
                        onClick={() => void openReview(row.payment_intent_id ?? '')}
                      >
                        {t('eventos:participation.people.reviewProof')}
                      </Button>
                    ) : null}
                    {row.role === 'holder' ? (
                      <Link
                        className='text-sm font-semibold whitespace-nowrap text-primary'
                        to={PageURLS.admin.eventoSignup(eventId, row.signup_id)}
                        viewTransition
                      >
                        {t('eventos:participation.people.viewDetail')}
                      </Link>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.people.hint')}</p>
      <AdminPaymentReviewModal
        open={Boolean(reviewIntent)}
        intent={reviewIntent}
        onOpenChange={open => {
          if (!open) setReviewIntent(null);
        }}
        onReview={review}
        isReviewing={reviewing}
        onSynced={() => void reFetch()}
      />
    </div>
  );
}
