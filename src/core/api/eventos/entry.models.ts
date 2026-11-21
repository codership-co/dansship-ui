/** Entry QR and door validation (ADR-064 Part 2). Mirrors `entry_schema.py`. No price ever. */

export interface EntryMinor {
  person_id: string;
  full_name: string;
  entered_at: string | null;
}

export interface EntryEventInfo {
  id: string;
  name: string;
  starts_at: string;
  place: string | null;
}

/** What the QR screen shows. `code` is filled only by the code endpoints. */
export interface EntryPass {
  person_id: string;
  holder_name: string;
  email: string | null;
  type_name: string;
  event: EntryEventInfo;
  minors: Array<EntryMinor>;
  entered_at: string | null;
  server_time: string;
  code: string | null;
  refresh_at: string | null;
  refresh_seconds: number | null;
  rotation_seconds: number | null;
}

export interface EntryGroupCount {
  entered: number;
  expected: number;
}

export interface EntryCounters {
  guests: EntryGroupCount;
  minors: EntryGroupCount;
  artists: EntryGroupCount;
}

export interface DoorEvent {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  place: string | null;
  entry_opens_at: string;
  entry_closes_at: string;
  is_open: boolean;
  counters: EntryCounters;
}

export type EntryPersonKind = 'guest' | 'artist';

export interface DoorPerson {
  person_id: string;
  full_name: string;
  type_name: string;
  kind: EntryPersonKind;
  entered_at: string | null;
  validated_by_name: string | null;
  minors: Array<EntryMinor>;
}

export type EntryScanStatus = 'valid' | 'already_used' | 'invalid';

export interface EntryScanResult {
  status: EntryScanStatus;
  reason: string | null;
  person: DoorPerson | null;
}

export interface DoorDonation {
  signup_id: string;
  labels: Array<string>;
  received_at: string | null;
}

export interface DoorSearchRow {
  person_id: string;
  full_name: string;
  email: string | null;
  type_name: string;
  kind: EntryPersonKind;
  can_enter: boolean;
  reason: string | null;
  entered_at: string | null;
  validated_by_name: string | null;
  minors: Array<EntryMinor>;
  donation: DoorDonation | null;
}

export interface AdminPersonUpdatePayload {
  full_name?: string;
  email?: string;
}

export interface AdminEventPerson {
  person_id: string;
  full_name: string;
  email: string | null;
  has_active_pass: boolean;
  entered_at: string | null;
}

export interface EntryWindow {
  opens_at: string;
  closes_at: string;
  is_override: boolean;
}

export interface EntryWindowPayload {
  opens_at: string | null;
  closes_at: string | null;
}
