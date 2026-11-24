import { emptyTicket, ticketPayload, type TicketDraft } from './tickets';

import { answerErrorPath, emptyAnswer, isAnswerEmpty, isAnswerItem } from '@components/modules/dynamic-form/form-items';

import type {
  MySignup,
  ParticipantField,
  RegistrationOption,
  RegistrationOptionKind,
  SignupAnswerValue,
  SignupApplication,
  SignupMemberPayload,
  SignupSubmitPayload,
} from '@core/api';

export interface MemberDraft {
  full_name: string;
  is_minor: boolean;
  email: string;
  phone: string;
  family_minor_user_id: string;
}

export interface SignupFormValues {
  /** "¿Cómo te inscribes?": the chosen option; the people inputs come from it. */
  registration_option: RegistrationOptionKind | '';
  answers: Record<string, SignupAnswerValue>;
  members: Array<MemberDraft>;
  tickets: Array<TicketDraft>;
  partner_email: string;
  package_id: string;
  people_count: string;
  donation_type_ids: Array<string>;
  accepted_terms: boolean;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function initialSignupValues(
  fields: Array<ParticipantField>,
  signup?: MySignup | null,
  options: Array<RegistrationOption> = [],
): SignupFormValues {
  const answers: Record<string, SignupAnswerValue> = {};

  fields.forEach(field => {
    if (!isAnswerItem(field)) return;

    const saved = signup?.raw_answers[field.key];

    answers[field.key] =
      field.kind === 'link' && saved && typeof saved === 'object' && !Array.isArray(saved)
        ? { url: saved.url ?? '', note: saved.note ?? '' }
        : (saved ?? (emptyAnswer(field) as SignupAnswerValue));
  });

  return {
    registration_option: signup?.registration_option ?? (options.length === 1 ? options[0].kind : ''),
    answers,
    tickets: [emptyTicket()],
    partner_email: '',
    package_id: '',
    people_count: '',
    members: (signup?.members ?? []).map(member => ({
      full_name: member.full_name,
      is_minor: member.is_minor,
      email: member.email ?? '',
      phone: member.phone ?? '',
      family_minor_user_id: member.family_minor_user_id ?? '',
    })),
    donation_type_ids: signup?.donation_type_ids ?? [],
    accepted_terms: false,
  };
}

const isEmpty = (field: ParticipantField, value: SignupAnswerValue) => isAnswerEmpty(field, value);

/** Client-side checks that mirror the server (which stays the source of truth). Keys are form paths. */
export function validateSignup(
  values: SignupFormValues,
  visibleFields: Array<ParticipantField>,
  t: Translate,
  option?: RegistrationOption | null,
): Record<string, string> {
  const errors: Record<string, string> = {};

  visibleFields.forEach(field => {
    if (!isAnswerItem(field)) return;

    const value = values.answers[field.key];
    const path = answerErrorPath('answers', field);

    if (field.required && isEmpty(field, value)) {
      errors[path] = t('validation:required');

      return;
    }

    if (field.kind === 'long_text' && typeof value === 'string') {
      const max = field.options.max_length ?? 1000;

      if (value.length > max) errors[path] = t('eventos:participation.form.tooLong', { max });
    }
  });

  if (values.registration_option === 'group' && option?.members_required !== false && values.members.length === 0) {
    errors.members = t('eventos:participation.form.membersRequired');
  }

  if (values.registration_option === 'pair' && !values.partner_email.includes('@')) {
    errors.partner_email = t('eventos:participation.form.emailInvalid');
  }

  if (values.registration_option === 'group_booking' && !(Number(values.people_count) > 0)) {
    errors.people_count = t('validation:required');
  }

  (values.registration_option === 'group' ? values.members : []).forEach((member, index) => {
    if (!member.full_name.trim()) {
      errors[`members.${index}.full_name`] = t('validation:required');
    }

    if (!member.is_minor) {
      if (!member.email.includes('@')) errors[`members.${index}.email`] = t('eventos:participation.form.emailInvalid');

      if (!member.phone.trim()) errors[`members.${index}.phone`] = t('validation:required');
    }
  });

  return errors;
}

/** Only the answers of visible fields, trimmed; empty optional answers are left out. */
export function toSignupPayload(
  values: SignupFormValues,
  visibleFields: Array<ParticipantField>,
  extra: { termsVersionId: string | null },
): SignupSubmitPayload {
  const answers: Record<string, SignupAnswerValue> = {};
  // Members come from the chosen option ("En grupo"), not from a form field.
  const showsMembers = values.registration_option === 'group';

  visibleFields.forEach(field => {
    if (!isAnswerItem(field)) return;

    const value = values.answers[field.key];

    if (isEmpty(field, value) && field.kind !== 'checkbox') return;

    if (typeof value === 'string') {
      answers[field.key] = value.trim();
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      answers[field.key] = { url: value.url.trim(), note: value.note?.trim() || null };
    } else {
      answers[field.key] = value;
    }
  });

  const members: Array<SignupMemberPayload> = showsMembers
    ? values.members.map(member =>
        member.is_minor
          ? {
              full_name: member.full_name.trim(),
              is_minor: true,
              family_minor_user_id: member.family_minor_user_id || null,
            }
          : {
              full_name: member.full_name.trim(),
              is_minor: false,
              email: member.email.trim(),
              phone: member.phone.trim(),
            },
      )
    : [];

  return {
    answers,
    members,
    donation_type_ids: values.donation_type_ids,
    accepted_terms: values.accepted_terms,
    terms_version_id: extra.termsVersionId,
    ...(values.registration_option ? { registration_option: values.registration_option } : {}),
  };
}

/** The one signup body (`POST /events/by-slug/{slug}/signups[/quote]`): people come from the chosen option. */
export function toSignupApplication(
  values: SignupFormValues,
  visibleFields: Array<ParticipantField>,
  extra: { participantTypeId: string; termsVersionId: string | null },
): SignupApplication {
  const base = toSignupPayload(values, visibleFields, { termsVersionId: extra.termsVersionId });
  const option = values.registration_option;

  return {
    participant_type_id: extra.participantTypeId,
    registration_option: option || null,
    answers: base.answers,
    members: base.members,
    tickets: option === 'multi_ticket' ? ticketPayload(values.tickets) : [],
    partner_email: option === 'pair' ? values.partner_email.trim() : null,
    package_id: values.package_id || null,
    people_count: option === 'group_booking' && values.people_count ? Number(values.people_count) : null,
    donation_type_ids: base.donation_type_ids,
    accepted_terms: base.accepted_terms,
    terms_version_id: base.terms_version_id,
  };
}
