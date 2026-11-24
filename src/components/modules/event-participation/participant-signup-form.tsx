import { Button } from 'polpo/components';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { LuInfo } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import {
  initialSignupValues,
  toSignupApplication,
  toSignupPayload,
  validateSignup,
  type SignupFormValues,
} from './signup-form-values';
import { SIGNUP_OPTION_RENDERERS, optionLabel } from './signup-option-renderers';
import { choiceRowClass, EVENT_CARD, EVENT_FIELDS } from './signup-styles';
import { validateTickets } from './tickets';

import { SectionHeading } from '@components/containers';
import { CheckRow, DynamicFormSections } from '@components/modules/dynamic-form';
import { SignupCheckoutModal } from '@components/modules/eventos/signup-checkout-modal';
import { PromotionTermsLink } from '@components/modules/payments/promotion-terms-link';
import { Checkbox, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui';
import {
  bogotaDayLabel,
  bogotaStartLabel,
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  isFieldVisible,
  participationErrorDetails,
  participationErrorMessage,
  type EventLanding,
  type LandingParticipantType,
  type MySignup,
  type ParticipantForm,
  type SignupApplication,
  type SignupQuote,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatPrice } from '@helpers';

interface ParticipantSignupFormProps {
  form: ParticipantForm;
  /** The event page data: packages, remaining seats and the payment QR for the checkout. */
  landing?: EventLanding | null;
  /** Present when editing an existing registration. */
  signup?: MySignup | null;
  /** The admin's "Previsualizar": the whole flow runs, but nothing is submitted and no payment is taken. */
  preview?: boolean;
}

type PendingCheckout = { application: SignupApplication; quote: SignupQuote };

/**
 * The one signup flow of any participant type: "¿Cómo te inscribes?", the chosen option's people
 * (registry by `kind`), the type's form, donations and the event terms. Free types are submitted here;
 * paid types continue in the checkout modal (REVIEW, PAY).
 */
export function ParticipantSignupForm({ form, landing, signup, preview = false }: ParticipantSignupFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [ticketErrors, setTicketErrors] = useState<Record<number, string>>({});
  const [checkout, setCheckout] = useState<PendingCheckout | null>(null);
  const options = useMemo(() => form.registration_options ?? [], [form.registration_options]);
  const defaultValues = useMemo(
    () => initialSignupValues(form.fields, signup, options),
    [form.fields, signup, options],
  );
  const { control, handleSubmit, setError, clearErrors, setValue } = useForm<SignupFormValues>({ defaultValues });
  const [answers, donations, acceptedTerms, chosenKind, packageId] = useWatch({
    control,
    name: ['answers', 'donation_type_ids', 'accepted_terms', 'registration_option', 'package_id'],
  });
  const landingType: LandingParticipantType | undefined = landing?.participation?.types.find(
    item => item.id === form.participant_type_id,
  );
  const packages = landingType?.pricing_model === 'package' ? landingType.packages : [];
  // The `people` field kind no longer decides whether members are asked: the chosen option does.
  const visibleFields = form.fields.filter(field => field.kind !== 'people' && isFieldVisible(field, answers ?? {}));
  const chosen = options.find(option => option.kind === chosenKind) ?? null;
  const OptionFields = chosen ? SIGNUP_OPTION_RENDERERS[chosen.kind] : null;
  const closesLabel = bogotaDayLabel(form.closes_at);
  const editing = Boolean(signup);
  const eventUrl = preview ? PageURLS.eventoPreview(form.event_slug) : PageURLS.eventoLanding(form.event_slug);

  const markServerError = (error: unknown) => {
    const details = participationErrorDetails(error) as {
      field_key?: string;
      index?: number;
      indexes?: Array<number>;
    };
    const message = participationErrorMessage(error, t, 'eventos:participation.form.submitFailed');
    const code = error instanceof DansshipAPIError ? error.body.error_code : '';

    if (code === DANSSHIP_ERROR_CODE.EVENT_TICKET_EMAIL_TAKEN && details.indexes) {
      setTicketErrors(Object.fromEntries(details.indexes.map(index => [index, t('eventos:tickets.emailTaken')])));
    } else if (
      details.field_key === 'tickets' ||
      (chosenKind === 'multi_ticket' && typeof details.index === 'number')
    ) {
      setTicketErrors({ [details.index ?? 0]: message });
    } else if (details.field_key === 'members' && typeof details.index === 'number') {
      setError(`members.${details.index}.full_name`, {
        type: 'server',
        message,
      });
    } else if (details.field_key === 'partner_email' || details.field_key === 'registration_option') {
      setError(details.field_key, { type: 'server', message });
    } else if (details.field_key && details.field_key !== 'members' && details.field_key !== 'donations') {
      setError(`answers.${details.field_key}`, { type: 'server', message });
    }

    toast.error(message);
  };

  const submit = async (values: SignupFormValues) => {
    clearErrors();
    setTicketErrors({});

    if (options.length > 1 && !values.registration_option) {
      setError('registration_option', {
        type: 'validate',
        message: t('errors:codes.EVENT_REGISTRATION_OPTION_REQUIRED'),
      });
      toast.error(t('eventos:participation.form.fixErrors'));

      return;
    }

    const errors = validateSignup(values, visibleFields, t, chosen);
    const foundTickets =
      values.registration_option === 'multi_ticket'
        ? validateTickets(values.tickets, form.minors.per_adult_max, t)
        : {};

    if (packages.length > 0 && !values.package_id) {
      errors.package_id = t('validation:required');
    }

    if (Object.keys(errors).length > 0 || Object.keys(foundTickets).length > 0) {
      Object.entries(errors).forEach(([path, message]) =>
        setError(path as Parameters<typeof setError>[0], {
          type: 'validate',
          message,
        }),
      );
      setTicketErrors(foundTickets);
      toast.error(t('eventos:participation.form.fixErrors'));

      return;
    }

    if (form.terms && !values.accepted_terms) {
      toast.error(t('errors:codes.EVENT_TERMS_NOT_ACCEPTED'));

      return;
    }

    setSubmitting(true);
    try {
      if (signup) {
        const payload = toSignupPayload(values, visibleFields, {
          termsVersionId: form.terms?.version_id ?? null,
        });
        const { ok, data, error } = await DansshipAPI.participation.update(signup.id, payload);

        if (!ok || !data) {
          markServerError(error);

          return;
        }

        toast.success(t('eventos:participation.form.updated'));
        navigate(PageURLS.profile.signup(data.id), { viewTransition: true });

        return;
      }

      const application = toSignupApplication(values, visibleFields, {
        participantTypeId: form.participant_type_id,
        termsVersionId: form.terms?.version_id ?? null,
      });
      // One quote for every type: it says whether the signup charges money.
      const quote = await DansshipAPI.participation.quoteSignup(form.event_slug, application, preview);

      if (!quote.ok || !quote.data) {
        markServerError(quote.error);

        return;
      }

      if (quote.data.charges_money) {
        setCheckout({ application, quote: quote.data });

        return;
      }

      if (preview) {
        toast.success(t('eventos:previewMode.freeDone'));
        navigate(eventUrl, { viewTransition: true });

        return;
      }

      const { ok, error } = await DansshipAPI.participation.submitSignup(form.event_slug, application);

      if (!ok) {
        markServerError(error);

        return;
      }

      toast.success(t('eventos:participation.form.submitted'));
      navigate(PageURLS.profile.bookings, { viewTransition: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (form.state === 'closed' && !editing) {
    return (
      <div className={cn('grid gap-3 p-5 text-center', EVENT_CARD)}>
        <p className='m-0 font-semibold'>{t('eventos:participation.card.closedTitle')}</p>
        <p className='m-0 text-sm text-muted-foreground'>
          {landingType?.card_copy.closing_message || t('eventos:participation.card.closedText')}
        </p>
      </div>
    );
  }

  const donationOptions = form.donation_types;

  return (
    <form className={cn('grid gap-5', EVENT_FIELDS)} onSubmit={handleSubmit(submit)} noValidate>
      <div className='grid gap-1'>
        <Link className='text-sm font-semibold text-primary' to={eventUrl} viewTransition>
          {t('eventos:participation.form.back', { name: form.event_name })}
        </Link>
        <SectionHeading
          className='mb-0'
          title={
            editing
              ? t('eventos:participation.form.editTitle')
              : landingType?.card_copy.title ||
                t('eventos:participation.form.titleFor', {
                  name: form.participant_type_name,
                })
          }
          subtitle={[form.event_name, bogotaStartLabel(form.starts_at), form.place_label].filter(Boolean).join(' · ')}
        />
      </div>
      <p className='m-0 flex items-start gap-2.5 rounded-xl bg-secondary px-3.5 py-3 text-sm'>
        <LuInfo className='mt-0.5 size-4 flex-none' aria-hidden />
        <span>
          {t('eventos:participation.form.intro', { name: form.signer_name })}
          {closesLabel ? ` ${t('eventos:participation.form.editUntil', { date: closesLabel })}` : ''}
        </span>
      </p>

      {options.length > 1 ? (
        <Controller
          control={control}
          name='registration_option'
          render={({ field, fieldState }) => (
            <section className={cn('grid gap-4 p-4 sm:p-5', EVENT_CARD)}>
              <h3 id='signup-how' className='m-0 text-base font-semibold'>
                {t('eventos:participation.form.howSignUp')}
              </h3>
              <div className='grid gap-3 sm:grid-cols-2' role='radiogroup' aria-labelledby='signup-how'>
                {options.map(option => {
                  const on = field.value === option.kind;

                  return (
                    <button
                      key={option.kind}
                      type='button'
                      role='radio'
                      aria-checked={on}
                      aria-labelledby={`signup-option-${option.kind}`}
                      aria-describedby={`signup-option-${option.kind}-hint`}
                      disabled={editing}
                      onClick={() => field.onChange(option.kind)}
                      className={cn(
                        'flex min-h-16 items-center gap-3 rounded-xl border px-4 py-3 text-left focus-visible:outline-2 focus-visible:outline-primary',
                        choiceRowClass(on),
                      )}
                    >
                      <span
                        aria-hidden
                        className={cn(
                          'grid size-4 flex-none place-items-center rounded-full border-2',
                          on ? 'border-primary' : 'border-muted-foreground',
                        )}
                      >
                        {on ? <span className='size-2 rounded-full bg-primary' /> : null}
                      </span>
                      <span className='grid gap-0.5'>
                        <span id={`signup-option-${option.kind}`} className='text-sm font-medium'>
                          {optionLabel(option, t)}
                        </span>
                        <span id={`signup-option-${option.kind}-hint`} className='text-xs text-muted-foreground'>
                          {t(`eventos:participation.registrationOptions.${option.kind}.hint`)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              {fieldState.error ? <small className='text-alert-600'>{fieldState.error.message}</small> : null}
            </section>
          )}
        />
      ) : null}

      {packages.length > 0 ? (
        <Controller
          control={control}
          name='package_id'
          render={({ field, fieldState }) => (
            <section className={cn('grid gap-2 p-4 sm:p-5', EVENT_CARD)}>
              <Label htmlFor='signup-package'>{t('eventos:participation.form.package')} *</Label>
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id='signup-package' aria-label={t('eventos:participation.form.package')}>
                  <SelectValue placeholder={t('eventos:participation.form.packagePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {packages.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {t('eventos:participation.form.packageOption', {
                        name: item.name,
                        price: formatPrice(Number(item.base_price), 'COP'),
                        people: item.included_people,
                      })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {packageId ? (
                <small className='text-xs text-muted-foreground'>
                  {t('eventos:participation.form.packageExtra', {
                    price: formatPrice(
                      Number(packages.find(item => item.id === packageId)?.additional_person_price ?? 0),
                      'COP',
                    ),
                  })}
                </small>
              ) : null}
              {fieldState.error ? <small className='text-alert-600'>{fieldState.error.message}</small> : null}
            </section>
          )}
        />
      ) : null}

      {OptionFields && chosen ? (
        <OptionFields
          control={control}
          option={chosen}
          minors={form.minors}
          familyMinors={form.family_minors}
          remaining={landing?.participation?.remaining ?? null}
          ticketErrors={ticketErrors}
        />
      ) : null}

      <DynamicFormSections control={control} name='answers' items={visibleFields} />

      {form.takes_donations && donationOptions.length > 0 ? (
        <section className={cn('grid gap-3 p-4 sm:p-5', EVENT_CARD)}>
          <div className='grid gap-1'>
            <h3 className='m-0 text-base font-semibold'>{t('eventos:participation.form.donationsTitle')}</h3>
            <p className='m-0 text-xs text-muted-foreground'>{t('eventos:participation.form.donationsHint')}</p>
          </div>
          <div className='grid gap-2.5'>
            {donationOptions.map(option => (
              <CheckRow
                key={option.id}
                id={`donation-${option.id}`}
                label={option.label}
                checked={(donations ?? []).includes(option.id)}
                onChange={on =>
                  setValue(
                    'donation_type_ids',
                    on ? [...(donations ?? []), option.id] : (donations ?? []).filter(item => item !== option.id),
                  )
                }
              />
            ))}
          </div>
        </section>
      ) : null}

      {form.terms ? (
        <div className='flex items-start gap-2'>
          <Checkbox
            id='signup-terms'
            checked={acceptedTerms}
            onCheckedChange={value => setValue('accepted_terms', value === true)}
          />
          <Label htmlFor='signup-terms' className='leading-snug'>
            <Trans
              i18nKey='eventos:participation.form.terms'
              components={{
                LinkTerms: <PromotionTermsLink terms={form.terms} />,
              }}
            />
          </Label>
        </div>
      ) : null}

      <div className='sticky bottom-0 flex flex-wrap justify-end gap-3 border-t border-border bg-background py-3'>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          onClick={() =>
            navigate(signup ? PageURLS.profile.signup(signup.id) : eventUrl, {
              viewTransition: true,
            })
          }
        >
          {t('eventos:participation.cancel')}
        </Button>
        <Button
          type='submit'
          variant='solid'
          color='primary'
          isLoading={submitting}
          disabled={Boolean(form.terms) && !acceptedTerms}
        >
          {editing
            ? t('eventos:participation.form.saveChanges')
            : landingType?.card_copy.button_text || t('eventos:participation.form.submit')}
        </Button>
      </div>

      {landing && checkout ? (
        <SignupCheckoutModal
          landing={landing}
          isOpen
          application={checkout.application}
          quote={checkout.quote}
          preview={preview}
          onClose={() => setCheckout(null)}
          onRefused={error => {
            setCheckout(null);
            markServerError(error);
          }}
        />
      ) : null}
    </form>
  );
}
