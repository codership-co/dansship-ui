import { Button } from 'polpo/components';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { PersonStatusBadge } from './participation-people-table';

import { SectionHeading } from '@components/containers';
import { SpinnerLoader } from '@components/loaders';
import { ConfirmDialog } from '@components/modals';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Label,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
} from '@components/ui';
import { answerText, DansshipAPI, participationErrorMessage, toNumber, type AdminSignupDetail } from '@core/api';
import { PageURLS } from '@core/constants';
import { formatDateTime, formatPrice } from '@helpers';
import { usePromise } from '@hooks';

type Decision = 'approve' | 'reject' | 'refunded' | 'not_refunded';

/**
 * One signup of any participant type for the admin: what was sent, the payment, the decision
 * (paid types are reviewed once paid), the refund outside the platform, the read-aloud copy and the note.
 */
export function SignupDetail({ eventId, signupId }: { eventId: string; signupId: string }) {
  const { t } = useTranslation();
  const { response, isLoading } = usePromise(() => DansshipAPI.participationAdmin.getSignup(signupId), true, [
    signupId,
  ]);
  const [detail, setDetail] = useState<AdminSignupDetail | null>(null);
  const [copies, setCopies] = useState<Record<string, string>>({});
  const [note, setNote] = useState('');
  const [decision, setDecision] = useState<Decision | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const data = response?.data;

    if (!data) return;

    setDetail(data);
    setCopies(
      Object.fromEntries(
        data.editable_copy_fields.map(key => {
          const original = data.raw_answers[key];

          return [key, data.admin_copies[key] ?? (typeof original === 'string' ? original : '')];
        }),
      ),
    );
    setNote(data.admin_note ?? '');
  }, [response?.data]);

  if (isLoading && !detail) {
    return <SpinnerLoader />;
  }

  if (!detail) {
    return <p className='text-muted-foreground'>{t('eventos:participation.detail.notFound')}</p>;
  }

  const apply = (next: AdminSignupDetail) => {
    setDetail(next);
    setNote(next.admin_note ?? '');
  };

  const decide = async () => {
    if (!decision) return;

    setBusy(true);
    try {
      const calls = {
        approve: () => DansshipAPI.participationAdmin.approve(signupId),
        reject: () => DansshipAPI.participationAdmin.reject(signupId),
        refunded: () => DansshipAPI.participationAdmin.setRefundedOutside(signupId, true),
        not_refunded: () => DansshipAPI.participationAdmin.setRefundedOutside(signupId, false),
      };
      const { ok, data, error } = await calls[decision]();

      if (!ok || !data) {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.detail.decisionFailed'));

        return;
      }

      apply(data);
      toast.success(t(DECISION_COPY[decision].success));
    } finally {
      setBusy(false);
      setDecision(null);
    }
  };

  const saveNotes = async () => {
    setBusy(true);
    try {
      const { ok, data, error } = await DansshipAPI.participationAdmin.updateAdminFields(signupId, {
        admin_copies: copies,
        admin_note: note,
      });

      if (!ok || !data) {
        toast.error(participationErrorMessage(error, t, 'eventos:participation.detail.saveFailed'));

        return;
      }

      apply(data);
      toast.success(t('eventos:participation.detail.saved'));
    } finally {
      setBusy(false);
    }
  };

  const toggleDonation = async (received: boolean) => {
    const { ok, data } = await DansshipAPI.participationAdmin.setDonationReceived(signupId, received);

    if (!ok || !data) {
      toast.error(t('eventos:participation.detail.saveFailed'));

      return;
    }

    apply(data);
  };

  const canApprove = detail.status === 'in_review';
  const approvedAmount = toNumber(detail.approved_amount ?? 0);
  const showsPayment = approvedAmount > 0 || Boolean(detail.refund_due) || Boolean(detail.refunded_outside_at);
  const canReject = detail.status === 'in_review' || detail.status === 'approved';
  const copyLabel = (key: string) => detail.answers.find(item => item.key === key)?.label ?? key;

  return (
    <div className='grid gap-5'>
      <div className='grid gap-1'>
        <Link
          className='text-sm font-semibold text-primary'
          to={`${PageURLS.admin.eventoEdit(eventId)}?tab=people`}
          viewTransition
        >
          {t('eventos:participation.detail.back')}
        </Link>
        <div className='flex flex-wrap items-center gap-2.5'>
          <SectionHeading className='mb-0' title={detail.signer_name} />
          <PersonStatusBadge row={detail} />
        </div>
        <p className='m-0 text-sm text-muted-foreground'>
          {t('eventos:participation.detail.submittedAt', {
            type: detail.participant_type_name,
            date: formatDateTime(detail.submitted_at, 'es'),
          })}
          {detail.edited_at
            ? ` · ${t('eventos:participation.detail.editedAt', { date: formatDateTime(detail.edited_at, 'es') })}`
            : ''}
        </p>
      </div>

      <div className='grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start'>
        <div className='grid min-w-0 gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('eventos:participation.detail.sent')}</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className='m-0 grid gap-3 sm:grid-cols-2'>
                {detail.answers.map(item => (
                  <div key={item.key} className='grid min-w-0 gap-0.5'>
                    <dt className='text-xs font-semibold text-muted-foreground'>{item.label}</dt>
                    <dd className='m-0 text-sm break-words whitespace-pre-wrap'>{answerText(item.value, t)}</dd>
                  </div>
                ))}
                <div className='grid gap-0.5'>
                  <dt className='text-xs font-semibold text-muted-foreground'>
                    {t('eventos:participation.detail.donations')}
                  </dt>
                  <dd className='m-0 text-sm'>{detail.donations.length ? detail.donations.join(', ') : '—'}</dd>
                </div>
                <div className='grid gap-0.5'>
                  <dt className='text-xs font-semibold text-muted-foreground'>
                    {t('eventos:participation.detail.contact')}
                  </dt>
                  <dd className='m-0 text-sm break-words'>
                    {[detail.signer_email, detail.signer_phone].filter(Boolean).join(' · ') || '—'}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {detail.members.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('eventos:participation.detail.members', { count: detail.members.length + 1 })}</CardTitle>
              </CardHeader>
              <CardContent className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('eventos:participation.detail.memberName')}</TableHead>
                      <TableHead>{t('eventos:participation.detail.memberEmail')}</TableHead>
                      <TableHead>{t('eventos:participation.detail.memberPhone')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className='font-semibold'>
                        {t('eventos:participation.detail.leaderName', { name: detail.signer_name })}
                      </TableCell>
                      <TableCell>{detail.signer_email ?? '—'}</TableCell>
                      <TableCell>{detail.signer_phone ?? '—'}</TableCell>
                    </TableRow>
                    {detail.members.map(member => (
                      <TableRow key={member.id}>
                        <TableCell>
                          {member.is_minor
                            ? member.age !== null
                              ? t('eventos:participation.detail.minorWithAge', {
                                  name: member.full_name,
                                  age: member.age,
                                })
                              : t('eventos:participation.detail.minor', { name: member.full_name })
                            : member.full_name}
                        </TableCell>
                        <TableCell>{member.email ?? '—'}</TableCell>
                        <TableCell>{member.phone ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t('eventos:participation.detail.adminTitle')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-4'>
              {detail.editable_copy_fields.map(key => (
                <div key={key} className='grid gap-2'>
                  <Label htmlFor={`copy-${key}`}>
                    {t('eventos:participation.detail.copyLabel', { label: copyLabel(key) })}
                  </Label>
                  <Textarea
                    id={`copy-${key}`}
                    rows={5}
                    maxLength={1000}
                    value={copies[key] ?? ''}
                    onChange={change => setCopies(current => ({ ...current, [key]: change.target.value }))}
                  />
                  <small className='text-xs text-muted-foreground'>
                    {t('eventos:participation.detail.copyHint', { count: (copies[key] ?? '').length })}
                  </small>
                </div>
              ))}
              <div className='grid gap-2'>
                <Label htmlFor='admin-note'>{t('eventos:participation.detail.note')}</Label>
                <Textarea
                  id='admin-note'
                  rows={3}
                  maxLength={2000}
                  value={note}
                  onChange={change => setNote(change.target.value)}
                />
                <small className='text-xs text-muted-foreground'>{t('eventos:participation.detail.noteHint')}</small>
              </div>
              <div className='flex justify-end'>
                <Button
                  type='button'
                  variant='outlined'
                  color='primary'
                  disabled={busy}
                  onClick={() => void saveNotes()}
                >
                  {t('eventos:participation.detail.saveNotes')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className='grid gap-4'>
          <Card>
            <CardHeader>
              <CardTitle>{t('eventos:participation.detail.decision')}</CardTitle>
            </CardHeader>
            <CardContent className='grid gap-3'>
              <PersonStatusBadge row={detail} />
              {detail.terms_acceptance ? (
                <small className='text-xs text-muted-foreground'>
                  {detail.terms_acceptance.source === 'admin'
                    ? t('eventos:participation.detail.termsByAdmin', {
                        version: detail.terms_acceptance.version,
                        date: formatDateTime(detail.terms_acceptance.accepted_at, 'es'),
                        name: detail.terms_acceptance.recorded_by_name ?? '',
                      })
                    : t('eventos:participation.detail.termsBySelf', {
                        version: detail.terms_acceptance.version,
                        date: formatDateTime(detail.terms_acceptance.accepted_at, 'es'),
                      })}
                </small>
              ) : null}
              {detail.reviewed_at ? (
                <small className='text-xs text-muted-foreground'>
                  {t('eventos:participation.detail.reviewedAt', { date: formatDateTime(detail.reviewed_at, 'es') })}
                </small>
              ) : null}
              <div className='flex flex-wrap gap-2'>
                <Button
                  type='button'
                  variant='solid'
                  color='primary'
                  disabled={!canApprove || busy}
                  onClick={() => setDecision('approve')}
                >
                  {t('eventos:participation.detail.approve')}
                </Button>
                <Button
                  type='button'
                  variant='solid'
                  color='alert'
                  disabled={!canReject || busy}
                  onClick={() => setDecision('reject')}
                >
                  {t('eventos:participation.detail.reject')}
                </Button>
              </div>
            </CardContent>
          </Card>
          {showsPayment ? (
            <Card>
              <CardHeader>
                <CardTitle>{t('eventos:participation.detail.payment')}</CardTitle>
              </CardHeader>
              <CardContent className='grid gap-3'>
                <p className='m-0 text-sm'>
                  {t('eventos:participation.detail.approvedAmount', { amount: formatPrice(approvedAmount, 'COP') })}
                </p>
                {detail.refund_due ? (
                  <>
                    <p className='m-0 text-sm text-muted-foreground'>
                      {t('eventos:participation.detail.refundDueHint')}
                    </p>
                    <Button
                      type='button'
                      variant='outlined'
                      color='primary'
                      disabled={busy}
                      onClick={() => setDecision('refunded')}
                    >
                      {t('eventos:participation.detail.markRefunded')}
                    </Button>
                  </>
                ) : null}
                {detail.refunded_outside_at ? (
                  <>
                    <p className='m-0 text-sm'>
                      {t('eventos:participation.detail.refundedAt', {
                        date: formatDateTime(detail.refunded_outside_at, 'es'),
                        name: detail.refunded_outside_by_name ?? '',
                      })}
                    </p>
                    <Button
                      type='button'
                      variant='flat'
                      color='secondary'
                      disabled={busy}
                      onClick={() => setDecision('not_refunded')}
                    >
                      {t('eventos:participation.detail.undoRefunded')}
                    </Button>
                  </>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
          <Card>
            <CardContent className='flex items-center justify-between gap-3 pt-6'>
              <span className='grid gap-0.5'>
                <span className='text-sm font-semibold'>{t('eventos:participation.detail.donationReceived')}</span>
                <small className='text-xs text-muted-foreground'>
                  {t('eventos:participation.detail.donationReceivedHint')}
                </small>
              </span>
              <Switch
                aria-label={t('eventos:participation.detail.donationReceived')}
                checked={detail.donation_received}
                onCheckedChange={value => void toggleDonation(value)}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={decision !== null}
        onOpenChange={open => {
          if (!open && !busy) setDecision(null);
        }}
        onConfirm={decide}
        isLoading={busy}
        title={decision ? t(DECISION_COPY[decision].title) : ''}
        description={decision ? t(DECISION_COPY[decision].description) : ''}
        confirmLabel={decision ? t(DECISION_COPY[decision].confirm) : ''}
        cancelLabel={t('eventos:participation.cancel')}
        confirmVariant={decision === 'reject' ? 'destructive' : 'default'}
      />
    </div>
  );
}

const DETAIL = 'eventos:participation.detail';

/** Copy of each confirmed admin action on a signup. */
const DECISION_COPY: Record<Decision, { title: string; description: string; confirm: string; success: string }> = {
  approve: {
    title: `${DETAIL}.approveTitle`,
    description: `${DETAIL}.approveDescription`,
    confirm: `${DETAIL}.approve`,
    success: `${DETAIL}.approved`,
  },
  reject: {
    title: `${DETAIL}.rejectTitle`,
    description: `${DETAIL}.rejectDescription`,
    confirm: `${DETAIL}.reject`,
    success: `${DETAIL}.rejected`,
  },
  refunded: {
    title: `${DETAIL}.refundedTitle`,
    description: `${DETAIL}.refundedDescription`,
    confirm: `${DETAIL}.markRefunded`,
    success: `${DETAIL}.refundedSaved`,
  },
  not_refunded: {
    title: `${DETAIL}.undoRefundedTitle`,
    description: `${DETAIL}.undoRefundedDescription`,
    confirm: `${DETAIL}.undoRefunded`,
    success: `${DETAIL}.undoRefundedSaved`,
  },
};
