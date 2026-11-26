import { postFileToPresignedForm } from '../common/put-file-to-presigned-url';
import { DansshipAPIError } from '../dansship.error';

import type {
  AnswerFileUpload,
  EventSignupStatus,
  FileAnswer,
  MyParticipationRow,
  ParticipantField,
  ParticipantTypeAdmin,
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

/** A Bogotá date (YYYY-MM-DD) and clock (HH:MM[:SS]) → ISO instant. */
export function bogotaDateTimeToIso(date: string, time: string): string {
  return `${date}T${time.slice(0, 5)}:00${BOGOTA_OFFSET}`;
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

  // «viernes 27 de noviembre» (Intl writes «viernes, 27 de noviembre»).
  return new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
    .format(new Date(iso))
    .replace(',', '');
}

/** «Sábado 12 de diciembre · 3:30 p. m.», in Bogotá: the start of an event (its end may be hidden). */
export function bogotaStartLabel(iso: string | null | undefined): string {
  if (!iso) {
    return '';
  }

  const day = bogotaDayLabel(iso);
  const time = new Intl.DateTimeFormat('es-CO', {
    timeZone: 'America/Bogota',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
    .format(new Date(iso))
    .replace(/\u00a0|\u202f/g, ' ');

  return `${day.charAt(0).toUpperCase()}${day.slice(1)} · ${time}`;
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
    const main = 'file_key' in value ? value.file_name : value.url;

    return value.note ? `${main} · ${value.note}` : main;
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

  if (status === 'in_review' || status === 'pending_payment' || status === 'payment_rejected') return 'review';

  return 'rejected';
}

/** The signer sees "No aprobada"; the admin sees "Rechazada". */
export function signupStatusLabel(status: EventSignupStatus, t: Translate, audience: 'signer' | 'admin'): string {
  return t(`eventos:participation.status.${audience}.${status}`);
}

/** Spanish copy for an API error, falling back to a generic message. */
export function participationErrorMessage(error: unknown, t: Translate, fallbackKey: string): string {
  if (error instanceof DansshipAPIError) {
    // A precise reason ("file_too_large", "field_window_closed"…) beats the code's general copy.
    const { reason } = participationErrorDetails(error);
    const byReason = reason ? t(`errors:reasons.${reason}`, { defaultValue: '' }) : '';

    if (byReason) {
      return byReason;
    }

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

/** Today's date in Bogotá as YYYY-MM-DD. */
function bogotaToday(now: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota' }).format(now);
}

/**
 * Installment lines "Pagar anticipo" / "Pagar siguiente cuota" opens: every unpaid line already due,
 * and at least the first unpaid one. The row does not say which (API gap G4), so the UI derives it.
 */
export function nextPayableSequences(
  row: Pick<MyParticipationRow, 'installments'>,
  now: Date = new Date(),
): Array<number> {
  const unpaid = (row.installments ?? [])
    .filter(line => line.status === 'pending' || line.status === 'overdue')
    .sort((left, right) => left.sequence - right.sequence);

  if (unpaid.length === 0) {
    return [];
  }

  const today = bogotaToday(now);
  const due = unpaid.filter(line => line.status === 'overdue' || line.due_date <= today);

  return (due.length > 0 ? due : unpaid.slice(0, 1)).map(line => line.sequence);
}

/**
 * Mis reservas rows of events configured by participant types. Legacy rows (`kind: "registration"`) keep
 * coming from `/events/registrations/me` until the unified endpoint carries their payment options (gap G3).
 */
export function configuredParticipationRows(
  rows: Array<MyParticipationRow> | null | undefined,
): Array<MyParticipationRow> {
  return (rows ?? []).filter(row => row.kind !== 'registration');
}

const DRAFT_TYPE_PREFIX = 'draft:';

/** A type added in the editor ("+ Agregar tipo de participante") that the API does not know yet. */
export const isDraftType = (type: Pick<ParticipantTypeAdmin, 'id'>) => type.id.startsWith(DRAFT_TYPE_PREFIX);

/**
 * A new type that only lives in the editor until "Guardar tipo": one person, full account, no approval,
 * free, counts toward the capacity, active. The API creates it on save.
 */
export function draftParticipantType(eventId: string, name: string, position: number): ParticipantTypeAdmin {
  return {
    id: `${DRAFT_TYPE_PREFIX}${crypto.randomUUID()}`,
    event_id: eventId,
    position,
    name,
    registration_options: [{ kind: 'single', label: null }],
    card_copy: { button_text: null, title: null, text: null, closing_message: null },
    requires_account: true,
    requires_approval: false,
    contribution_model: 'free',
    counts_toward_capacity: true,
    quota: null,
    condition_subject: 'holder',
    minors_allowed: false,
    minor_max_age: null,
    minors_per_adult_max: null,
    minors_count_toward_capacity: false,
    minor_price: null,
    closes_at: null,
    issues_entry_qr: false,
    is_active: true,
    fields: [],
    fees: [],
    pricing_model: 'per_person',
    packages: [],
    condition_discounts: [],
    payment_plan: [],
    installment_reminder_days: null,
    pay_later_deadline: null,
    email_settings: null,
    available_notices: [],
    donation_types: [],
    signup_count: 0,
    people_count: 0,
  };
}

/**
 * Uploads a file answer ("Archivo o enlace"): asks for the upload form, checks the size the server allows
 * (S3 enforces it too), posts the file and resolves with the answer to send.
 * Rejects with `Error('too_large')` before uploading.
 */
export async function uploadAnswerFile(
  file: File,
  requestUpload: () => Promise<AnswerFileUpload | null | undefined>,
): Promise<FileAnswer> {
  const target = await requestUpload();

  if (!target?.upload_url || !target.file_key) throw new Error('upload_url');

  if (file.size > target.max_bytes) throw new Error('too_large');

  await postFileToPresignedForm(file, target.upload_url, target.fields);

  return { file_key: target.file_key, file_name: file.name, content_type: file.type };
}
