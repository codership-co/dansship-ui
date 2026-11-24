import { Button } from 'polpo/components';
import { useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

import { CheckoutPaymentProofForm } from '@components/forms/checkout-payment-proof-form';
import { DynamicFormSections } from '@components/modules/dynamic-form';
import {
  SIGNUP_OPTION_RENDERERS,
  initialSignupValues,
  optionLabel,
  toSignupApplication,
  validateSignup,
  validateTickets,
  type SignupFormValues,
} from '@components/modules/event-participation';
import { Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import {
  DansshipAPI,
  PaymentMethod,
  isFieldVisible,
  participationErrorMessage,
  type AdminEnrollmentPayload,
  type EnrollmentPayment,
  type ParticipantTypeAdmin,
  type PersonSearchResult,
  type SignupAnswerValue,
} from '@core/api';
import { cn, formatDateTime, formatPrice } from '@helpers';
import { useEventEnrollment, useEventTerms, usePromise, useSignupQuote } from '@hooks';

function SummaryRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={cn('flex items-center justify-between gap-4 px-5 py-3', strong && 'font-bold')}>
      <span>{label}</span>
      <span className='text-right'>{value}</span>
    </div>
  );
}

interface EventEnrollmentFormProps {
  eventId: string;
  eventName: string;
  person: PersonSearchResult;
  onEnrolled?: () => void;
}

/**
 * "+ Inscribir persona" for an event configured by participant types (enroll:event): type, option and
 * people, the quote (total, discount, deposit, balance), then "¿Ya pagó?" for paid types. Free types enroll
 * approved; this is the only way into a private event.
 */
export function EventEnrollmentForm({ eventId, eventName, person, onEnrolled }: EventEnrollmentFormProps) {
  const { t } = useTranslation();
  const { response: typesResponse } = usePromise(() => DansshipAPI.participationAdmin.listTypes(eventId), true, [
    eventId,
  ]);
  const { hasTerms } = useEventTerms(eventId);
  const types = useMemo(
    () => (typesResponse?.ok ? typesResponse.data.filter(item => item.is_active) : []),
    [typesResponse],
  );
  const [typeId, setTypeId] = useState('');
  // Each enrollment starts a fresh form (a new key) instead of resetting it.
  const [round, setRound] = useState(0);
  const [result, setResult] = useState<string | null>(null);
  const type: ParticipantTypeAdmin | undefined =
    types.find(item => item.id === typeId) ?? (types.length === 1 ? types[0] : undefined);

  if (!typesResponse) {
    return null;
  }

  if (types.length === 0) {
    return <p className='m-0 text-sm text-muted-foreground'>{t('assisted:event.enroll.noTypes')}</p>;
  }

  return (
    <div className='grid gap-5'>
      {types.length > 1 ? (
        <div className='grid gap-2'>
          <Label htmlFor='enroll-type'>{t('assisted:event.enroll.type')} *</Label>
          <Select value={type?.id ?? ''} onValueChange={setTypeId}>
            <SelectTrigger id='enroll-type' aria-label={t('assisted:event.enroll.type')}>
              <SelectValue placeholder={t('assisted:event.enroll.typePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {types.map(item => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {type ? (
        /*
         * A new type or a finished enrollment mounts a fresh form: `reset()` inside an effect leaves
         * `Controller` fields stuck under the React Compiler.
         */
        <TypeEnrollment
          key={`${type.id}:${round}`}
          type={type}
          eventId={eventId}
          eventName={eventName}
          person={person}
          hasTerms={hasTerms}
          onEnrolled={message => {
            setResult(message);
            setRound(current => current + 1);
            onEnrolled?.();
          }}
        />
      ) : null}
      {result ? <p className='m-0 text-sm text-active'>{result}</p> : null}
    </div>
  );
}

interface TypeEnrollmentProps {
  type: ParticipantTypeAdmin;
  eventId: string;
  eventName: string;
  person: PersonSearchResult;
  hasTerms: boolean;
  onEnrolled: (message: string) => void;
}

/** The enrollment form of one type: option and people, quote, payment and terms. */
function TypeEnrollment({ type, eventId, eventName, person, hasTerms, onEnrolled }: TypeEnrollmentProps) {
  const { t } = useTranslation();
  const { summary, isQuoting, quote } = useSignupQuote();
  const { enroll, isEnrolling } = useEventEnrollment(eventId);
  const [payment, setPayment] = useState<EnrollmentPayment>('paid');
  const [recordTerms, setRecordTerms] = useState(true);
  const [ticketErrors, setTicketErrors] = useState<Record<number, string>>({});
  const form = useForm<SignupFormValues>({
    defaultValues: initialSignupValues(type.fields, null, type.registration_options),
  });
  const { control, setError, clearErrors, getValues } = form;
  const values = useWatch({ control });

  const options = type.registration_options;
  const chosen = options.find(option => option.kind === values.registration_option) ?? null;
  const OptionFields = chosen ? SIGNUP_OPTION_RENDERERS[chosen.kind] : null;
  const visibleFields = type.fields.filter(
    field =>
      field.kind !== 'people' && isFieldVisible(field, (values.answers ?? {}) as Record<string, SignupAnswerValue>),
  );
  const minors = {
    allowed: type.minors_allowed,
    max_age: type.minor_max_age ?? null,
    per_adult_max: type.minors_per_adult_max ?? null,
    price: type.minor_price ?? null,
  };

  const payload = (paymentChoice: EnrollmentPayment | null): AdminEnrollmentPayload => {
    const application = toSignupApplication(getValues(), visibleFields, {
      participantTypeId: type.id,
      termsVersionId: null,
    });

    return {
      participant_type_id: type.id,
      user_id: person.id,
      registration_option: application.registration_option,
      answers: application.answers,
      members: application.members,
      tickets: application.tickets,
      partner_email: application.partner_email,
      package_id: application.package_id,
      people_count: application.people_count,
      donation_type_ids: application.donation_type_ids,
      payment: paymentChoice,
      record_terms_acceptance: hasTerms ? recordTerms : false,
    };
  };

  // The quote follows the choice: type, option, package and how many people.
  const quoteKey = JSON.stringify([
    type.id,
    values.registration_option,
    values.package_id,
    values.people_count,
    values.tickets?.length,
    values.members?.length,
    values.partner_email,
  ]);

  useEffect(() => {
    const body = payload(null);

    if (options.length > 1 && !values.registration_option) return;

    const handle = window.setTimeout(() => void quote({ kind: 'enrollment', eventId, payload: body }), 400);

    return () => window.clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteKey, eventId]);

  const checkForm = () => {
    clearErrors();
    setTicketErrors({});
    const current = getValues();
    const errors = validateSignup(current, visibleFields, t, chosen);
    const tickets =
      current.registration_option === 'multi_ticket' ? validateTickets(current.tickets, minors.per_adult_max, t) : {};

    Object.entries(errors).forEach(([path, message]) =>
      setError(path as Parameters<typeof setError>[0], { type: 'validate', message }),
    );
    setTicketErrors(tickets);

    return Object.keys(errors).length === 0 && Object.keys(tickets).length === 0;
  };

  const submit = async (paymentChoice: EnrollmentPayment | null, proof: File | null) => {
    if (!checkForm()) {
      toast.error(t('eventos:participation.form.fixErrors'));

      return;
    }

    const body = payload(paymentChoice);
    const outcome = await enroll(body, proof);

    if (!outcome.ok) {
      toast.error(participationErrorMessage(outcome.error, t, 'assisted:event.enroll.failed'));

      return;
    }

    toast.success(t('assisted:event.enroll.done'));
    onEnrolled(
      outcome.data.pay_by
        ? t('assisted:event.enroll.pendingUntil', { date: formatDateTime(outcome.data.pay_by, 'es') })
        : t('assisted:event.enroll.done'),
    );
  };

  const chargesMoney = Boolean(summary?.chargesMoney);

  return (
    <>
      {options.length > 1 ? (
        <div className='grid gap-2'>
          <Label htmlFor='enroll-option'>{t('eventos:participation.form.howSignUp')} *</Label>
          <Select
            value={values.registration_option ?? ''}
            onValueChange={value =>
              form.setValue('registration_option', value as SignupFormValues['registration_option'])
            }
          >
            <SelectTrigger id='enroll-option' aria-label={t('eventos:participation.form.howSignUp')}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.kind} value={option.kind}>
                  {optionLabel(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {type.pricing_model === 'package' ? (
        <div className='grid gap-2'>
          <Label htmlFor='enroll-package'>{t('eventos:participation.form.package')} *</Label>
          <Select value={values.package_id ?? ''} onValueChange={value => form.setValue('package_id', value)}>
            <SelectTrigger id='enroll-package' aria-label={t('eventos:participation.form.package')}>
              <SelectValue placeholder={t('eventos:participation.form.packagePlaceholder')} />
            </SelectTrigger>
            <SelectContent>
              {type.packages.map(item => (
                <SelectItem key={item.id ?? item.name} value={item.id ?? ''}>
                  {t('eventos:participation.form.packageOption', {
                    name: item.name,
                    price: formatPrice(Number(item.base_price), 'COP'),
                    people: item.included_people,
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : null}

      {OptionFields && chosen ? (
        <OptionFields control={control} option={chosen} minors={minors} familyMinors={[]} ticketErrors={ticketErrors} />
      ) : null}

      <DynamicFormSections control={control} name='answers' items={visibleFields} columns={1} />

      {summary ? (
        <div className='divide-y divide-border overflow-hidden rounded-2xl border border-border bg-white'>
          <SummaryRow label={t('assisted:event.summary.event')} value={eventName} />
          <SummaryRow label={t('assisted:event.enroll.type')} value={type.name} />
          {summary.discountPercent ? (
            <SummaryRow label={t('assisted:event.enroll.discount')} value={`${summary.discountPercent} %`} />
          ) : null}
          <SummaryRow
            label={t('assisted:event.enroll.total')}
            value={chargesMoney ? formatPrice(summary.total, 'COP') : t('eventos:participation.free')}
            strong
          />
          {chargesMoney && summary.balance > 0 ? (
            <>
              <SummaryRow label={t('assisted:event.enroll.deposit')} value={formatPrice(summary.deposit, 'COP')} />
              <SummaryRow label={t('assisted:event.enroll.balance')} value={formatPrice(summary.balance, 'COP')} />
            </>
          ) : null}
        </div>
      ) : isQuoting ? (
        <p className='m-0 text-sm text-muted-foreground'>{t('assisted:common.loading')}</p>
      ) : null}

      {hasTerms ? (
        <div className='flex items-start gap-2'>
          <Checkbox id='enroll-terms' checked={recordTerms} onCheckedChange={value => setRecordTerms(value === true)} />
          <Label htmlFor='enroll-terms' className='leading-snug'>
            {t('assisted:event.enroll.recordTerms')}
          </Label>
        </div>
      ) : null}

      {chargesMoney ? (
        <div className='grid gap-2'>
          <p className='m-0 text-sm font-semibold'>{t('assisted:event.enroll.alreadyPaid')} *</p>
          <div className='flex flex-wrap gap-2' role='radiogroup' aria-label={t('assisted:event.enroll.alreadyPaid')}>
            {(['paid', 'pay_later'] as const).map(choice => (
              <Button
                key={choice}
                type='button'
                role='radio'
                aria-checked={payment === choice}
                variant={payment === choice ? 'solid' : 'outlined'}
                color='primary'
                onClick={() => setPayment(choice)}
              >
                {t(`assisted:event.enroll.payment.${choice}`)}
              </Button>
            ))}
          </div>
          {payment === 'pay_later' ? (
            <small className='text-xs text-muted-foreground'>{t('assisted:event.enroll.payLaterHint')}</small>
          ) : null}
        </div>
      ) : null}

      {chargesMoney && payment === 'paid' && summary ? (
        <CheckoutPaymentProofForm
          variant='event'
          allowPdfProof
          hideSummary
          paymentMethod={PaymentMethod.TRANSFER}
          finalPrice={summary.deposit}
          amountToCharge={summary.deposit}
          walletAmountApplied={0}
          confirmLabel={t('assisted:event.approveAndEnroll')}
          onClose={() => undefined}
          onConfirmWithProof={file => submit('paid', file)}
          onSubmit={() => undefined}
        />
      ) : (
        <div className='flex justify-end'>
          <Button
            type='button'
            variant='solid'
            color='primary'
            isLoading={isEnrolling}
            disabled={!summary}
            onClick={() => void submit(chargesMoney ? 'pay_later' : null, null)}
          >
            {chargesMoney ? t('assisted:event.enroll.enrollPending') : t('assisted:event.enroll.enroll')}
          </Button>
        </div>
      )}
    </>
  );
}
