import type {
  MySignup,
  ParticipantField,
  SignupAnswerValue,
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
  answers: Record<string, SignupAnswerValue>;
  members: Array<MemberDraft>;
  donation_type_ids: Array<string>;
  accepted_terms: boolean;
}

type Translate = (key: string, options?: Record<string, unknown>) => string;

export function emptyAnswer(field: ParticipantField): SignupAnswerValue {
  if (field.kind === 'checkbox') return false;

  if (field.kind === 'multi_choice') return [];

  if (field.kind === 'link') return { url: '', note: '' };

  return '';
}

export function initialSignupValues(fields: Array<ParticipantField>, signup?: MySignup | null): SignupFormValues {
  const answers: Record<string, SignupAnswerValue> = {};

  fields.forEach(field => {
    if (field.kind === 'people') return;

    const saved = signup?.raw_answers[field.key];

    answers[field.key] =
      field.kind === 'link' && saved && typeof saved === 'object' && !Array.isArray(saved)
        ? { url: saved.url ?? '', note: saved.note ?? '' }
        : (saved ?? emptyAnswer(field));
  });

  return {
    answers,
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

function isEmpty(field: ParticipantField, value: SignupAnswerValue): boolean {
  if (value === null || value === undefined) return true;

  if (field.kind === 'checkbox') return value !== true;

  if (Array.isArray(value)) return value.length === 0;

  if (typeof value === 'object') return !value.url?.trim();

  return typeof value === 'string' && !value.trim();
}

/** Client-side checks that mirror the server (which stays the source of truth). Keys are form paths. */
export function validateSignup(
  values: SignupFormValues,
  visibleFields: Array<ParticipantField>,
  t: Translate,
): Record<string, string> {
  const errors: Record<string, string> = {};

  visibleFields.forEach(field => {
    if (field.kind === 'people') {
      if (field.required && values.members.length === 0) {
        errors.members = t('eventos:participation.form.membersRequired');
      }

      return;
    }

    const value = values.answers[field.key];
    const path = field.kind === 'link' ? `answers.${field.key}.url` : `answers.${field.key}`;

    if (field.required && isEmpty(field, value)) {
      errors[path] = t('validation:required');

      return;
    }

    if (field.kind === 'long_text' && typeof value === 'string') {
      const max = field.options.max_length ?? 1000;

      if (value.length > max) errors[path] = t('eventos:participation.form.tooLong', { max });
    }
  });

  values.members.forEach((member, index) => {
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
  extra: { termsVersionId: string | null; accessToken: string | null },
): SignupSubmitPayload {
  const answers: Record<string, SignupAnswerValue> = {};
  const showsMembers = visibleFields.some(field => field.kind === 'people');

  visibleFields.forEach(field => {
    if (field.kind === 'people') return;

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
    access_token: extra.accessToken,
  };
}
