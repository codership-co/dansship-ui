import { format } from 'date-fns';
import { ActionModal, Button } from 'polpo/components';
import { useMemo, useRef, useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { LuCreditCard, LuList } from 'react-icons/lu';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { FormStepperLayout } from '@components/layouts/form-stepper-layout';
import { SpinnerLoader } from '@components/loaders';
import { CollapsibleTotal } from '@components/modules/payments/collapsible-total';
import { PaymentAcceptance } from '@components/modules/payments/payment-acceptance';
import {
  DansshipAPI,
  classRecoveryErrorKey,
  PaymentMethod,
  selectedRecoveryLines,
  type ClassRecovery,
  type ClassRecoveryPreview,
  type RecoverableSubscription,
  type RecoverySelection,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatPrice } from '@helpers';
import { useDateLocale, useMediaQuery, usePromise } from '@hooks';

interface RecoveryCheckoutModalProps {
  isOpen: boolean;
  selection: RecoverySelection;
  /** The list the selection was made from; used to describe what is being paid. */
  groups: Array<RecoverableSubscription>;
  onClose: () => void;
  /** Called after a recovery was created, so the list can refresh. */
  onSubmitted: () => void;
}

enum CheckoutStep {
  REVIEW = 'REVIEW',
  PAY = 'PAY',
}

const PANE_BODY = 'px-4 pt-4 pb-6 sm:px-8 md:pt-12 md:pr-8 md:pl-12';
const PANE_FOOTER = 'px-4 sm:px-8 md:py-4 md:pr-8 md:pl-12';
const FOOTER =
  'sticky bottom-0 mt-auto flex gap-2 border-t border-border bg-white pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:justify-end';

function RecoveryResult({ recovery, onClose }: { recovery: ClassRecovery; onClose: () => void }) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const navigate = useNavigate();
  const day = (value: string | null) => (value ? format(new Date(value), 'PPP', { locale }) : '');

  return (
    <section className='mx-auto grid max-w-xl gap-4 px-4 py-8 sm:px-8'>
      <h3 className='m-0'>{t(`recovery:result.${recovery.status}.title`)}</h3>
      <p className='m-0 text-muted-foreground'>
        {t(`recovery:result.${recovery.status}.description`, { date: day(recovery.usable_until) })}
      </p>
      {recovery.status === 'approved' && recovery.reactivated_until ? (
        <p className='m-0 font-semibold'>
          {t('recovery:result.reactivated', { date: day(recovery.reactivated_until) })}
        </p>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        {recovery.status === 'returned_to_wallet' ? (
          <Button
            color='primary'
            variant='outlined'
            type='button'
            onClick={() => navigate(PageURLS.profile.wallet, { viewTransition: true })}
          >
            {t('recovery:result.goToWallet')}
          </Button>
        ) : null}
        <Button color='primary' variant='solid' type='button' onClick={onClose}>
          {t('recovery:result.done')}
        </Button>
      </div>
    </section>
  );
}

function SelectedLines({ groups, selection }: Pick<RecoveryCheckoutModalProps, 'groups' | 'selection'>) {
  const { t } = useTranslation();
  const locale = useDateLocale();
  const lines = useMemo(() => selectedRecoveryLines(groups, selection), [groups, selection]);

  return (
    <ul className='m-0 grid list-none gap-2 p-0'>
      {lines.map(line => (
        <li key={line.key} className='flex items-start justify-between gap-3 rounded-2xl bg-secondary-100 p-3.5'>
          <div className='grid min-w-0 gap-0.5'>
            <span className='font-title font-semibold break-words'>
              {line.kind === 'unused_credit'
                ? t('recovery:checkout.unusedLine', { count: line.quantity })
                : (line.className ?? t('recovery:list.classFallback'))}
            </span>
            <span className='text-sm break-words text-muted-foreground'>
              {line.classStart ? `${format(new Date(line.classStart), 'EEE d MMM · HH:mm', { locale })} · ` : ''}
              {line.attendeeName ? `${line.attendeeName} · ` : ''}
              {line.planName}
            </span>
          </div>
          <span className='shrink-0 font-semibold'>{formatPrice(line.unitPrice * line.quantity, 'COP')}</span>
        </li>
      ))}
    </ul>
  );
}

interface CheckoutBodyProps extends Pick<RecoveryCheckoutModalProps, 'groups' | 'selection' | 'onClose'> {
  preview: ClassRecoveryPreview;
  onSubmitted: (recovery: ClassRecovery | null) => void;
}

function RecoveryCheckoutBody({ preview, groups, selection, onClose, onSubmitted }: CheckoutBodyProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<CheckoutStep>(CheckoutStep.REVIEW);
  const [accepted, setAccepted] = useState(false);
  // Kept until the proof upload finishes; the result view replaces the form after.
  const created = useRef<ClassRecovery | null>(null);
  const isWalletCovered = preview.amount_to_charge === 0;
  const paymentMethod = isWalletCovered ? PaymentMethod.WALLET : PaymentMethod.TRANSFER;

  const total = (
    <CollapsibleTotal
      subtitle={t('recovery:checkout.value', { amount: formatPrice(preview.total_amount, 'COP') })}
      amount={preview.amount_to_charge}
      baseAmount={preview.total_amount - preview.tax_amount}
      taxAmount={preview.tax_amount}
      walletAmountApplied={preview.wallet_applied}
    />
  );

  const reviewForm = (
    <div className='flex min-h-full shrink-0 flex-col'>
      <div className={cn('flex flex-1 flex-col gap-4', PANE_BODY)}>
        <header className='grid gap-1'>
          <h3 className='m-0'>{t('recovery:checkout.title')}</h3>
          <p className='m-0 text-muted-foreground'>
            {t('recovery:checkout.usableFor', { count: preview.extension_days })}
          </p>
        </header>
        <SelectedLines groups={groups} selection={selection} />
        {/* Flat on purpose: the next step repeats the total with its breakdown. */}
        <p className='m-0 flex items-baseline justify-between gap-4 border-t border-border pt-4'>
          <span className='text-muted-foreground'>
            {t('recovery:checkout.total')} · {t('recovery:list.taxIncluded')}
          </span>
          <strong className='text-xl'>{formatPrice(preview.total_amount, 'COP')}</strong>
        </p>
      </div>
      <div className={cn(FOOTER, PANE_FOOTER)}>
        <Button type='button' color='primary' variant='outlined' className='flex-1 md:flex-none' onClick={onClose}>
          {t('recovery:checkout.cancel')}
        </Button>
        <Button
          type='button'
          color='primary'
          variant='solid'
          className='flex-1 md:flex-none'
          onClick={() => setStep(CheckoutStep.PAY)}
        >
          {t('recovery:checkout.next')}
        </Button>
      </div>
    </div>
  );

  const payForm = (
    <div className='flex min-h-full shrink-0 flex-col'>
      <CheckoutPaymentProofForm
        variant='event'
        hideSummary
        paymentMethod={paymentMethod}
        finalPrice={preview.total_amount}
        amountToCharge={preview.amount_to_charge}
        walletAmountApplied={preview.wallet_applied}
        confirmLabel={t('recovery:checkout.submit')}
        canConfirm={accepted}
        bodyClassName={cn('flex-1', PANE_BODY)}
        footerClassName={PANE_FOOTER}
        topSlot={
          <>
            {total}
            {isWalletCovered ? (
              <p className='m-0 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm font-semibold text-primary'>
                {t('subscriptions:walletFullyCoveredNote')}
              </p>
            ) : null}
          </>
        }
        acceptance={
          <PaymentAcceptance
            accepted={accepted}
            onAcceptedChange={setAccepted}
            title={t('recovery:checkout.beforeConfirm')}
          >
            <Trans
              i18nKey='recovery:checkout.accept'
              components={{
                LinkTerms: (
                  <a
                    target='_blank'
                    rel='noreferrer'
                    href={PageURLS.legalClassRecoveryTerms}
                    className='font-semibold text-primary underline-offset-4 hover:underline'
                  />
                ),
              }}
            />
          </PaymentAcceptance>
        }
        onClose={onClose}
        onBack={() => setStep(CheckoutStep.REVIEW)}
        onCreateIntent={async () => {
          if (!accepted) {
            toast.error(t('recovery:checkout.acceptRequired'));

            return null;
          }

          const result = await DansshipAPI.classRecovery.create({ ...selection, payment_method_type: paymentMethod });

          if (!result.ok || !result.data.payment_intent_id) {
            toast.error(t(classRecoveryErrorKey(result.error)));

            return null;
          }

          created.current = result.data;

          return result.data.payment_intent_id;
        }}
        onSubmit={async () => {
          const recoveryId = created.current?.id;
          const latest = recoveryId ? await DansshipAPI.classRecovery.get(recoveryId) : null;

          onSubmitted(latest?.ok ? latest.data : created.current);
        }}
      />
    </div>
  );

  const steps = [
    {
      title: t('recovery:checkout.reviewTitle'),
      subtitle: '',
      step: CheckoutStep.REVIEW,
      Icon: LuList,
      form: reviewForm,
    },
    {
      title: t('recovery:checkout.payTitle'),
      subtitle: '',
      step: CheckoutStep.PAY,
      Icon: LuCreditCard,
      form: payForm,
    },
  ];

  return (
    <section
      className='m-auto h-auto w-full max-w-full overflow-x-clip border-0 bg-transparent p-0 shadow-none sm:w-[96dvw] sm:max-w-[96dvw] xl:max-w-7xl'
      data-sentry-mask
    >
      <FormStepperLayout
        className={cn(
          'm-auto min-w-0 overflow-x-clip overflow-y-auto rounded-none sm:rounded-xl',
          'w-full max-w-full',
          'h-dvh md:h-[80dvh]',
          'max-h-dvh sm:max-h-[96dvh]',
        )}
        steps={steps}
        currentStep={step}
        hideStepHeading
        compactMobileStrip
      />
    </section>
  );
}

function RecoveryCheckoutContent({
  selection: openedWith,
  groups: groupsOpenedWith,
  onClose,
  onSubmitted,
}: Omit<RecoveryCheckoutModalProps, 'isOpen'>) {
  const { t } = useTranslation();
  /*
   * What is quoted, shown and paid must stay the same while the modal is open,
   * even if the list behind it refreshes (tab refocus, another approval).
   */
  const [selection] = useState(openedWith);
  const [groups] = useState(groupsOpenedWith);
  const [recovery, setRecovery] = useState<ClassRecovery | null>(null);
  const { response, isLoading } = usePromise(() => DansshipAPI.classRecovery.preview(selection));
  const preview = response?.data;

  if (recovery) {
    return <RecoveryResult recovery={recovery} onClose={onClose} />;
  }

  if (isLoading || !response) {
    return (
      <div className='grid place-content-center py-16'>
        <SpinnerLoader message={t('recovery:checkout.loading')} />
      </div>
    );
  }

  if (!preview) {
    return (
      <p className='m-0 px-4 py-8 text-center text-muted-foreground'>{t(classRecoveryErrorKey(response.error))}</p>
    );
  }

  return (
    <RecoveryCheckoutBody
      preview={preview}
      groups={groups}
      selection={selection}
      onClose={onClose}
      onSubmitted={submitted => {
        onSubmitted();

        if (submitted) {
          setRecovery(submitted);
        } else {
          onClose();
        }
      }}
    />
  );
}

export function RecoveryCheckoutModal({ isOpen, selection, groups, onClose, onSubmitted }: RecoveryCheckoutModalProps) {
  // The floating icon collides with the step strip on small screens.
  const showIcon = useMediaQuery('(min-width: 768px)');

  return (
    <ActionModal
      closeOnClickOutside={false}
      windowOffset={0}
      backCard
      lineOnTop
      icon={showIcon ? LuCreditCard : undefined}
      isOpen={isOpen}
      onClose={onClose}
      className='w-dvw max-w-[100dvw] overflow-x-clip p-0 rounded-none sm:w-[96dvw] sm:max-w-[96dvw] sm:rounded-xl xl:max-w-7xl'
    >
      {isOpen ? (
        <RecoveryCheckoutContent selection={selection} groups={groups} onClose={onClose} onSubmitted={onSubmitted} />
      ) : null}
    </ActionModal>
  );
}
