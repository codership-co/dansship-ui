import { format, isToday, isYesterday, parseISO } from 'date-fns';
import { ChangeEvent, DragEvent, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LuImage } from 'react-icons/lu';
import { Link } from 'react-router';
import { toast } from 'sonner';

import { DirectRegistrationForm } from './direct-registration-form';

import { Badge, Button } from '@components/ui';
import {
  DansshipAPI,
  type CollaboratorPaymentItem,
  type CollaboratorWorkshopSummary,
  type WorkshopRosterEntry,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn } from '@helpers';
import { useDateLocale } from '@hooks';

type Tab = 'roster' | 'payments' | 'register' | 'qr';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function money(amount: string | number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

const PENDING_REVIEW = 'pending_manual_review';

interface CollaboratorWorkshopProps {
  workshop: CollaboratorWorkshopSummary;
  roster: Array<WorkshopRosterEntry>;
  payments: Array<CollaboratorPaymentItem>;
  onRegistered: () => Promise<void>;
  onReviewed: () => Promise<void>;
  onQrSaved: (url: string | null) => void;
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  return parts
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function CollaboratorWorkshop({
  workshop,
  roster,
  payments,
  onRegistered,
  onReviewed,
  onQrSaved,
}: CollaboratorWorkshopProps) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const [tab, setTab] = useState<Tab>('roster');
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const pendingCount = payments.filter(payment => payment.status === PENDING_REVIEW).length;
  const paymentsByPurchase = useMemo(() => {
    const map = new Map<string, CollaboratorPaymentItem>();

    payments.forEach(payment => map.set(payment.purchase_id, payment));

    return map;
  }, [payments]);

  const review = async (paymentId: string, action: 'approve' | 'reject') => {
    setReviewingId(paymentId);
    const { ok } = await DansshipAPI.talleres.reviewCollaboratorPayment(workshop.id, paymentId, { action });
    setReviewingId(null);

    if (!ok) {
      toast.error(t('talleres:managed.reviewFailed'));

      return;
    }

    await onReviewed();
  };

  return (
    <div className='mx-auto grid max-w-5xl gap-6'>
      <div className='grid gap-3'>
        <Link className='w-fit text-sm font-semibold text-primary' to={PageURLS.managedWorkshops}>
          {`‹ ${t('talleres:managed.back')}`}
        </Link>
        <div className='flex flex-wrap items-center gap-3'>
          <Badge variant='outlineTertiary' size='small'>
            {t('talleres:managed.collaboratorBadge')}
          </Badge>
          <span className='text-sm font-medium text-primary'>
            {format(parseISO(workshop.starts_at), 'EEE. d MMM, yyyy', { locale }).toLowerCase()}
          </span>
        </div>
        <h1 className='m-0 font-title text-4xl leading-none font-bold text-foreground'>{workshop.name}</h1>
        <p className='m-0 text-sm text-muted-foreground'>
          {t('talleres:managed.summary', { enrolled: roster.length, pending: pendingCount })}
        </p>
      </div>

      <div className='grid grid-cols-4 gap-1 rounded-full bg-white p-1 shadow-sm'>
        {(
          [
            ['roster', t('talleres:managed.tabRoster')],
            ['payments', t('talleres:managed.tabPayments', { count: pendingCount })],
            ['register', t('talleres:managed.tabRegister')],
            ['qr', t('talleres:managed.tabQr')],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type='button'
            className={cn(
              'rounded-full px-3 py-2.5 text-sm font-semibold text-muted-foreground',
              tab === value && 'bg-primary text-primary-foreground',
            )}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'roster' ? (
        <div className='overflow-hidden rounded-3xl border bg-white'>
          {roster.length === 0 ? (
            <p className='p-6 text-sm text-muted-foreground'>{t('talleres:admin.rosterEmpty')}</p>
          ) : (
            roster.map(row => {
              const payment = paymentsByPurchase.get(row.purchase_id);
              const direct = row.source === 'direct' && !payment;
              const paid = row.status === 'confirmed';

              return (
                <div
                  key={row.id}
                  className='flex items-center justify-between gap-4 border-b px-4 py-4 last:border-b-0'
                >
                  <div className='flex min-w-0 items-center gap-3'>
                    <span className='grid size-11 shrink-0 place-items-center rounded-full bg-secondary text-sm font-semibold text-foreground'>
                      {initials(row.display_name || row.email)}
                    </span>
                    <div className='min-w-0'>
                      <p className='m-0 truncate font-semibold'>{row.display_name || row.email}</p>
                      <p className='m-0 truncate text-sm text-muted-foreground'>{row.email}</p>
                    </div>
                  </div>
                  <div className='flex shrink-0 flex-wrap justify-end gap-2'>
                    <Badge variant={direct ? 'outlineTertiary' : 'outlineNeutral'} size='small'>
                      {direct ? t('talleres:managed.sourceDirect') : t('talleres:managed.sourceCheckout')}
                    </Badge>
                    <Badge variant={paid ? 'outlineActive' : 'outlineNeutral'} size='small'>
                      {paid ? t('talleres:managed.paid') : t('talleres:managed.paymentPending')}
                    </Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {tab === 'payments' ? (
        <div className='grid gap-4'>
          {payments.length === 0 ? (
            <p className='text-sm text-muted-foreground'>{t('talleres:managed.paymentsEmpty')}</p>
          ) : null}
          {payments.map(payment => (
            <article key={payment.id} className='grid gap-4 rounded-3xl border bg-white p-4 sm:grid-cols-[auto_1fr]'>
              <ProofThumb payment={payment} label={t('talleres:managed.proof')} />
              <div className='grid gap-3'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='m-0 font-semibold'>{payment.payer_display_name || payment.payer_email}</p>
                    <p className='m-0 text-sm text-muted-foreground'>{payment.payer_email}</p>
                    <p className='m-0 mt-2 text-lg font-bold'>{money(payment.amount)}</p>
                    <p className='m-0 text-sm text-muted-foreground'>
                      <UploadedLabel at={payment.proof_uploaded_at ?? payment.created_at} />
                    </p>
                  </div>
                  <Badge
                    variant={
                      payment.status === 'approved'
                        ? 'outlineActive'
                        : payment.status === 'rejected'
                          ? 'destructive'
                          : 'outlineTertiary'
                    }
                    size='small'
                  >
                    {payment.status === 'approved'
                      ? t('talleres:managed.approved')
                      : payment.status === 'rejected'
                        ? t('talleres:managed.rejected')
                        : t('talleres:managed.toReview')}
                  </Badge>
                </div>
                {payment.status === PENDING_REVIEW ? (
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      disabled={reviewingId === payment.id}
                      onClick={() => void review(payment.id, 'approve')}
                    >
                      {t('talleres:managed.approve')}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={reviewingId === payment.id}
                      onClick={() => void review(payment.id, 'reject')}
                    >
                      {t('talleres:managed.reject')}
                    </Button>
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {tab === 'register' ? (
        <div className='max-w-xl rounded-3xl border bg-white p-5'>
          <h2 className='m-0 text-base font-bold'>{t('talleres:managed.registerTitle')}</h2>
          <p className='mt-1 mb-4 text-sm text-muted-foreground'>{t('talleres:managed.registerHelp')}</p>
          <DirectRegistrationForm
            layout='stacked'
            onSubmit={async payload => {
              const { ok } = await DansshipAPI.talleres.collaboratorRegister(workshop.id, payload);

              if (ok) {
                await onRegistered();
                setTab('roster');
              }

              return ok;
            }}
          />
        </div>
      ) : null}

      {tab === 'qr' ? (
        <QrPanel workshopId={workshop.id} previewUrl={workshop.payment_qr_url} onSaved={onQrSaved} />
      ) : null}
    </div>
  );
}

function UploadedLabel({ at }: { at: string }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const date = parseISO(at);
  const time = format(date, 'h:mm a', { locale }).replace('AM', 'a. m.').replace('PM', 'p. m.');

  if (isToday(date)) {
    return t('talleres:managed.uploadedToday', { time });
  }

  if (isYesterday(date)) {
    return t('talleres:managed.uploadedYesterday', { time });
  }

  return t('talleres:managed.uploadedOn', { date: format(date, 'd MMM', { locale }) });
}

function ProofThumb({ payment, label }: { payment: CollaboratorPaymentItem; label: string }) {
  const className =
    'grid size-28 place-items-center overflow-hidden rounded-2xl border border-dashed bg-muted/40 text-center text-xs text-muted-foreground';

  if (!payment.proof_view_url) {
    return (
      <div className={className}>
        <span className='grid justify-items-center gap-1 px-2'>
          <LuImage className='size-5' />
          {label}
        </span>
      </div>
    );
  }

  return (
    <a className={className} href={payment.proof_view_url} target='_blank' rel='noreferrer'>
      <img src={payment.proof_view_url} alt={label} className='size-full object-cover' />
    </a>
  );
}

function QrPanel({
  workshopId,
  previewUrl,
  onSaved,
}: {
  workshopId: string;
  previewUrl: string | null;
  onSaved: (url: string | null) => void;
}) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!IMAGE_TYPES.includes(file.type)) {
      toast.error(t('common:fileUpload.invalidType'));

      return;
    }

    setUploading(true);

    try {
      const { data, ok } = await DansshipAPI.talleres.uploadCollaboratorPaymentQr(workshopId, file);

      if (!ok || !data) {
        toast.error(t('talleres:managed.qrFailed'));

        return;
      }

      onSaved(data.payment_qr_url);
      toast.success(t('talleres:managed.qrSaved'));
    } catch {
      toast.error(t('talleres:managed.qrFailed'));
    } finally {
      setUploading(false);
    }
  };

  const onFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    void upload(file);
  };

  const onDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    void upload(event.dataTransfer.files[0]);
  };

  return (
    <div className='grid items-center gap-6 rounded-3xl border bg-white p-5 sm:grid-cols-[9rem_1fr]'>
      <label
        className='grid size-36 cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed bg-muted/40 text-center text-xs text-muted-foreground'
        onDragOver={event => event.preventDefault()}
        onDrop={onDrop}
      >
        {previewUrl ? (
          <img src={previewUrl} alt={t('talleres:managed.tabQr')} className='size-full object-contain' />
        ) : (
          <span className='grid justify-items-center gap-1 px-3'>
            <LuImage className='size-5' />
            {uploading ? t('talleres:admin.saving') : t('talleres:managed.qrDrop')}
          </span>
        )}
        <input className='sr-only' type='file' accept='image/jpeg,image/png,image/webp' onChange={onFile} />
      </label>
      <div>
        <h2 className='m-0 text-base font-bold'>{t('talleres:managed.tabQr')}</h2>
        <p className='mt-1 mb-0 text-sm text-muted-foreground'>{t('talleres:managed.qrHelp')}</p>
      </div>
    </div>
  );
}
