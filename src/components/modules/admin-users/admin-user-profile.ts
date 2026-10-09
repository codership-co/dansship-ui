import type { BasicProfileFormValues } from '@components/forms/basic-profile-form';
import type { HealthDataFormValues } from '@components/forms/health-profile-form';
import type { PreferencesProfileFormValues } from '@components/forms/preferences-profile-form';

export function formatProfileDate(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');

  return `${value.getFullYear()}-${month}-${day}`;
}

export function parseProfileDate(value: string | null | undefined) {
  if (!value) {
    return undefined;
  }

  const [year, month, day] = value.slice(0, 10).split('-').map(Number);

  if (!year || !month || !day) {
    return undefined;
  }

  return new Date(year, month - 1, day);
}

function withoutEmpty(values: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value !== '' && value !== undefined && value !== null),
  );
}

export function toProfilePayload(values: BasicProfileFormValues) {
  return {
    full_name: values.full_name,
    phone_country_code: values.phone_country_code,
    phone_number: values.phone_number,
    document_type: values.document_type,
    document_value: values.document_value,
    birth_date: formatProfileDate(values.birth_date),
    city: values.city || null,
    address: values.address || null,
    guardian_first_name: values.guardian_first_name || null,
    guardian_last_name: values.guardian_last_name || null,
    guardian_phone_country_code: values.guardian_phone_country_code || null,
    guardian_phone_number: values.guardian_phone_number || null,
  };
}

export function toHealthPayload(values: HealthDataFormValues) {
  return withoutEmpty(values);
}

export function toPreferencesPayload(values: PreferencesProfileFormValues) {
  return {
    heard_about_us: values.heard_about_us || null,
    goals: values.goals,
    disciplines: values.disciplines,
    current_level: values.current_level || null,
    preferred_schedules: values.preferred_schedules,
  };
}
