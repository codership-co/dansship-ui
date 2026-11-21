import { DansshipAPIError } from '../dansship.error';

import type {
  EventSignupStatus,
  LandingParticipation,
  ParticipantField,
  ParticipantTypeAdmin,
  ParticipantTypeConfig,
  SignupAnswerValue,
} from './participation.models';

type Translate = (key: string, options?: Record<string, unknown>) => string;

/** Bogotá has no daylight saving time: its offset is always -05:00. */
const BOGOTA_OFFSET = '-05:00';

/** `datetime-local` value typed in Bogotá → ISO string the API stores in UTC. */
export function bogotaLocalToIso(local: string): string | null {
  if (!local) {
    return null;
  }

  const withSeconds = local.length === 16 ? `${local}:00` : local;

  return `${withSeconds}${BOGOTA_OFFSET}`;
}

/** ISO instant → `datetime-local` value as seen in Bogotá. */
export function isoToBogotaLocal(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const value = (type: string) => parts.find(part => part.type === type)?.value ?? '';

  return `${value('year')}-${value('month')}-${value('day')}T${value('hour')}:${value('minute')}`;
}

/** Long Spanish date as seen in Bogotá, e.g. "viernes 27 de noviembre". */
export function bogotaDayLabel(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }

  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date(iso));
}

/** The editable part of a type, as the PUT endpoint expects it. */
export function participantTypeConfig(type: ParticipantTypeAdmin): ParticipantTypeConfig {
  return {
    name: type.name,
    registration_mode: type.registration_mode,
    access_mode: type.access_mode,
    requires_account: type.requires_account,
    requires_approval: type.requires_approval,
    contribution_model: type.contribution_model,
    counts_toward_capacity: type.counts_toward_capacity,
    minors_allowed: type.minors_allowed,
    minor_max_age: type.minor_max_age,
    minors_per_adult_max: type.minors_per_adult_max,
    minors_count_toward_capacity: type.minors_count_toward_capacity,
    minor_price: type.minor_price,
    closes_at: type.closes_at,
    issues_entry_qr: type.issues_entry_qr,
    is_active: type.is_active,
    fields: type.fields.map(field => ({ ...field, options: { ...field.options } })),
    fees: type.fees.map(fee => ({ ...fee })),
    donation_types: type.donation_types.map(item => ({ ...item })),
  };
}

export function chargesMoney(model: ParticipantTypeConfig['contribution_model']): boolean {
  return model === 'money' || model === 'money_and_in_kind';
}

export function takesDonations(model: ParticipantTypeConfig['contribution_model']): boolean {
  return model === 'in_kind' || model === 'money_and_in_kind';
}

/** Shareable link of a link-only type: the same event page with its token. */
export function participantAccessLink(origin: string, slug: string, token: string | null): string | null {
  if (!token) {
    return null;
  }

  return `${origin}/eventos/${slug}?acceso=${encodeURIComponent(token)}`;
}

/** A field is shown when it has no rule or its source answer matches. */
export function isFieldVisible(field: ParticipantField, answers: Record<string, SignupAnswerValue>): boolean {
  const rule = field.visible_when;

  if (!rule) {
    return true;
  }

  const value = answers[rule.field_key];

  return Array.isArray(value) ? value.includes(rule.equals) : value === rule.equals;
}

/** Plain text of one answer for read-only views. */
export function answerText(value: SignupAnswerValue, t: Translate): string {
  if (value === null || value === undefined || value === '') {
    return '—';
  }

  if (typeof value === 'boolean') {
    return value ? t('eventos:participation.yes') : t('eventos:participation.no');
  }

  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(', ') : '—';
  }

  if (typeof value === 'object') {
    return value.note ? `${value.url} · ${value.note}` : value.url;
  }

  return value;
}

/** Admin-list display values come from the API as "yes"/"no" for check boxes. */
export function adminCellText(value: string | undefined, t: Translate): string {
  if (value === 'yes') return t('eventos:participation.yes');

  if (value === 'no') return t('eventos:participation.no');

  return value ? value : '—';
}

export type SignupStatusTone = 'review' | 'approved' | 'rejected';

export function signupStatusTone(status: EventSignupStatus): SignupStatusTone {
  if (status === 'approved' || status === 'confirmed') return 'approved';

  if (status === 'in_review' || status === 'pending_payment') return 'review';

  return 'rejected';
}

/** The signer sees "No aprobada"; the admin sees "Rechazada". */
export function signupStatusLabel(status: EventSignupStatus, t: Translate, audience: 'signer' | 'admin'): string {
  return t(`eventos:participation.status.${audience}.${status}`);
}

/** Spanish copy for an API error, falling back to a generic message. */
export function participationErrorMessage(error: unknown, t: Translate, fallbackKey: string): string {
  if (error instanceof DansshipAPIError) {
    const code = error.body.error_code;
    const message = t(`errors:codes.${code}`, { defaultValue: '' });

    if (message) {
      return message;
    }
  }

  return t(fallbackKey);
}

/** Details of a refused signup, so the form can point at the field or member. */
export function participationErrorDetails(error: unknown): { field_key?: string; index?: number; reason?: string } {
  if (!(error instanceof DansshipAPIError)) {
    return {};
  }

  const details: unknown = error.body.details;

  return details && typeof details === 'object' && !Array.isArray(details)
    ? (details as { field_key?: string; index?: number; reason?: string })
    : {};
}

/** The registration types (artists) and the ticket types the viewer can see on the landing. */
export function splitLandingTypes(participation: LandingParticipation | null | undefined) {
  const types = participation?.types ?? [];

  return {
    registrations: types.filter(type => type.registration_mode !== 'multi_ticket'),
    tickets: types.filter(type => type.registration_mode === 'multi_ticket'),
  };
}
