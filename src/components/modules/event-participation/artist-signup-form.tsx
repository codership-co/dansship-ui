import { Button } from 'polpo/components';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import { Trans, useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { toast } from 'sonner';

import { GroupMembersFields } from './group-members-fields';
import { initialSignupValues, toSignupPayload, validateSignup, type SignupFormValues } from './signup-form-values';

import { SectionHeading } from '@components/containers';
import { TextareaField, TextField } from '@components/form-fields';
import { PromotionTermsLink } from '@components/modules/payments/promotion-terms-link';
import { Checkbox, Label } from '@components/ui';
import {
  bogotaDayLabel,
  DansshipAPI,
  isFieldVisible,
  participationErrorDetails,
  participationErrorMessage,
  type MySignup,
  type ParticipantField,
  type ParticipantForm,
} from '@core/api';
import { PageURLS } from '@core/constants';
import { cn, formatDateTime } from '@helpers';

function ChoiceChips({
  control,
  field,
  multiple,
}: {
  control: Control<SignupFormValues>;
  field: ParticipantField;
  multiple: boolean;
}) {
  return (
    <Controller
      control={control}
      name={`answers.${field.key}`}
      render={({ field: input, fieldState }) => {
        const selected = multiple ? (Array.isArray(input.value) ? input.value : []) : input.value;
        const isOn = (choice: string) =>
          multiple ? (selected as Array<string>).includes(choice) : selected === choice;

        return (
          <fieldset className='m-0 grid gap-2 border-0 p-0'>
            <legend className='mb-2 text-sm font-medium'>{field.label}</legend>
            <div className='flex flex-wrap gap-2' role={multiple ? 'group' : 'radiogroup'}>
              {(field.options.choices ?? []).map(choice => (
                <button
                  key={choice}
                  type='button'
                  role={multiple ? 'checkbox' : 'radio'}
                  aria-checked={isOn(choice)}
                  onClick={() => {
                    if (multiple) {
                      const current = selected as Array<string>;
                      input.onChange(isOn(choice) ? current.filter(item => item !== choice) : [...current, choice]);
                    } else {
                      input.onChange(choice);
                    }
                  }}
                  className={cn(
                    'min-h-11 rounded-full border px-4 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary',
                    isOn(choice) ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-white',
                  )}
                >
                  {choice}
                </button>
              ))}
            </div>
            {fieldState.error ? <small className='text-alert-600'>{fieldState.error.message}</small> : null}
          </fieldset>
        );
      }}
    />
  );
}

function AnswerField({ control, field }: { control: Control<SignupFormValues>; field: ParticipantField }) {
  const { t } = useTranslation();
  const value = useWatch({ control, name: `answers.${field.key}` });

  if (field.kind === 'choice' || field.kind === 'multi_choice') {
    return <ChoiceChips control={control} field={field} multiple={field.kind === 'multi_choice'} />;
  }

  if (field.kind === 'short_text') {
    return <TextField control={control} name={`answers.${field.key}`} label={field.label} maxLength={200} />;
  }

  if (field.kind === 'long_text') {
    const max = field.options.max_length ?? 1000;
    const length = typeof value === 'string' ? value.length : 0;

    return (
      <div className='grid gap-1'>
        <TextareaField control={control} name={`answers.${field.key}`} label={field.label} rows={5} maxLength={max} />
        <small className='text-right text-xs text-muted-foreground'>
          {t('eventos:participation.form.counter', { count: length, max })}
        </small>
      </div>
    );
  }

  if (field.kind === 'link') {
    return (
      <div className='grid gap-3'>
        <div className='grid gap-1'>
          <TextField
            control={control}
            name={`answers.${field.key}.url`}
            type='url'
            label={field.label}
            placeholder='https://'
            maxLength={500}
          />
          <small className='text-xs text-muted-foreground'>{t('eventos:participation.form.linkHint')}</small>
        </div>
        {field.options.with_note ? (
          <TextField
            control={control}
            name={`answers.${field.key}.note`}
            label={t('eventos:participation.form.linkNote')}
            maxLength={300}
          />
        ) : null}
      </div>
    );
  }

  if (field.kind === 'checkbox') {
    return (
      <Controller
        control={control}
        name={`answers.${field.key}`}
        render={({ field: input, fieldState }) => (
          <div className='grid gap-1'>
            <div className='flex items-start gap-2'>
              <Checkbox
                id={`answer-${field.key}`}
                checked={input.value === true}
                onCheckedChange={checked => input.onChange(checked === true)}
              />
              <Label htmlFor={`answer-${field.key}`} className='leading-snug'>
                {field.label}
              </Label>
            </div>
            {fieldState.error ? <small className='text-alert-600'>{fieldState.error.message}</small> : null}
          </div>
        )}
      />
    );
  }

  return null;
}

interface ArtistSignupFormProps {
  form: ParticipantForm;
  accessToken: string | null;
  /** Present when editing an existing registration. */
  signup?: MySignup | null;
}

/** Registration form of a registration type (artists), built from the type's fields. */
export function ArtistSignupForm({ form, accessToken, signup }: ArtistSignupFormProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const defaultValues = useMemo(() => initialSignupValues(form.fields, signup), [form.fields, signup]);
  const { control, handleSubmit, setError, clearErrors, setValue } = useForm<SignupFormValues>({ defaultValues });
  const answers = useWatch({ control, name: 'answers' });
  const donations = useWatch({ control, name: 'donation_type_ids' });
  const acceptedTerms = useWatch({ control, name: 'accepted_terms' });
  const visibleFields = form.fields.filter(field => isFieldVisible(field, answers ?? {}));
  const closesLabel = bogotaDayLabel(form.closes_at);
  const editing = Boolean(signup);

  const submit = async (values: SignupFormValues) => {
    clearErrors();
    const errors = validateSignup(values, visibleFields, t);

    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([path, message]) =>
        setError(path as Parameters<typeof setError>[0], { type: 'validate', message }),
      );
      toast.error(t('eventos:participation.form.fixErrors'));

      return;
    }

    if (form.terms && !values.accepted_terms) {
      toast.error(t('errors:codes.EVENT_TERMS_NOT_ACCEPTED'));

      return;
    }

    setSubmitting(true);
    try {
      const payload = toSignupPayload(values, visibleFields, {
        termsVersionId: form.terms?.version_id ?? null,
        accessToken,
      });
      const { ok, data, error } = signup
        ? await DansshipAPI.participation.update(signup.id, payload)
        : await DansshipAPI.participation.submit(form.participant_type_id, payload);

      if (!ok || !data) {
        const details = participationErrorDetails(error);

        if (details.field_key === 'members' && typeof details.index === 'number') {
          setError(`members.${details.index}.full_name`, {
            type: 'server',
            message: participationErrorMessage(error, t, 'eventos:participation.form.submitFailed'),
          });
        } else if (details.field_key && details.field_key !== 'members' && details.field_key !== 'donations') {
          setError(`answers.${details.field_key}`, {
            type: 'server',
            message: participationErrorMessage(error, t, 'eventos:participation.form.submitFailed'),
          });
        }

        toast.error(participationErrorMessage(error, t, 'eventos:participation.form.submitFailed'));

        return;
      }

      toast.success(editing ? t('eventos:participation.form.updated') : t('eventos:participation.form.submitted'));
      navigate(editing ? PageURLS.profile.signup(data.id) : PageURLS.profile.bookings, { viewTransition: true });
    } finally {
      setSubmitting(false);
    }
  };

  if (form.state === 'closed' && !editing) {
    return (
      <div className='grid gap-3 rounded-[14px] border bg-white p-5 text-center'>
        <p className='m-0 font-semibold'>{t('eventos:participation.card.closedTitle')}</p>
        <p className='m-0 text-sm text-muted-foreground'>{t('eventos:participation.card.closedText')}</p>
      </div>
    );
  }

  const membersField = visibleFields.find(field => field.kind === 'people');
  const donationOptions = form.donation_types;

  return (
    <form className='grid gap-6' onSubmit={handleSubmit(submit)} noValidate>
      <div className='grid gap-1'>
        <Link
          className='text-sm font-semibold text-primary'
          to={PageURLS.eventoLanding(form.event_slug)}
          viewTransition
        >
          {t('eventos:participation.form.back', { name: form.event_name })}
        </Link>
        <SectionHeading
          className='mb-0'
          title={editing ? t('eventos:participation.form.editTitle') : t('eventos:participation.form.title')}
          subtitle={[form.event_name, formatDateTime(form.starts_at, 'es'), form.place_label]
            .filter(Boolean)
            .join(' · ')}
        />
      </div>
      <p className='m-0 rounded-xl bg-secondary p-3 text-sm'>
        {t('eventos:participation.form.intro', { name: form.signer_name })}
        {closesLabel ? ` ${t('eventos:participation.form.editUntil', { date: closesLabel })}` : ''}
      </p>

      <section className='grid gap-4 rounded-[14px] border bg-white p-4'>
        {visibleFields
          .filter(field => field.kind !== 'people')
          .map(field => (
            <AnswerField key={field.key} control={control} field={field} />
          ))}
      </section>

      {membersField ? (
        <Controller
          control={control}
          name='members'
          render={({ fieldState }) => (
            <div className='grid gap-1'>
              <GroupMembersFields
                control={control}
                label={membersField.label}
                familyMinors={form.family_minors}
                minorsAllowed={form.minors.allowed}
                maxPeople={membersField.options.max_people ?? 30}
              />
              {fieldState.error ? <small className='text-alert-600'>{fieldState.error.message}</small> : null}
            </div>
          )}
        />
      ) : null}

      {form.takes_donations && donationOptions.length > 0 ? (
        <section className='grid gap-2 rounded-[14px] border bg-white p-4'>
          <h3 className='m-0 text-base font-semibold'>{t('eventos:participation.form.donationsTitle')}</h3>
          <p className='m-0 text-sm text-muted-foreground'>{t('eventos:participation.form.donationsHint')}</p>
          <div className='grid gap-2 sm:grid-cols-2'>
            {donationOptions.map(option => {
              const checked = (donations ?? []).includes(option.id);

              return (
                <label
                  key={option.id}
                  className='flex min-h-11 items-center gap-2 rounded-lg border border-border px-3'
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={value =>
                      setValue(
                        'donation_type_ids',
                        value === true
                          ? [...(donations ?? []), option.id]
                          : (donations ?? []).filter(item => item !== option.id),
                      )
                    }
                  />
                  <span className='text-sm'>{option.label}</span>
                </label>
              );
            })}
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
              components={{ LinkTerms: <PromotionTermsLink terms={form.terms} /> }}
            />
          </Label>
        </div>
      ) : null}

      <div className='sticky bottom-0 flex flex-wrap justify-end gap-3 border-t bg-white py-3'>
        <Button
          type='button'
          variant='outlined'
          color='primary'
          onClick={() =>
            navigate(signup ? PageURLS.profile.signup(signup.id) : PageURLS.eventoLanding(form.event_slug), {
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
          disabled={submitting || (Boolean(form.terms) && !acceptedTerms)}
        >
          {editing ? t('eventos:participation.form.saveChanges') : t('eventos:participation.form.submit')}
        </Button>
      </div>
    </form>
  );
}
