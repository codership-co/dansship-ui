const TIME_ZONE = 'America/Bogota';
const LOCALE = 'es-CO';
const NON_BREAKING_SPACES = new RegExp('[\\u202f\\u00a0]', 'g');

export interface CheckoutEventDate {
  weekday: string;
  day: string;
  month: string;
  longLabel: string;
}

function normalizeSpaces(value: string) {
  return value.replace(NON_BREAKING_SPACES, ' ');
}

function capitalize(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function part(parts: Array<Intl.DateTimeFormatPart>, type: Intl.DateTimeFormatPartTypes) {
  return parts.find(item => item.type === type)?.value ?? '';
}

export function checkoutEventDate(startsAt?: string | null): CheckoutEventDate | null {
  if (!startsAt) {
    return null;
  }

  const date = new Date(startsAt);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const short = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).formatToParts(date);
  const long = new Intl.DateTimeFormat(LOCALE, {
    timeZone: TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).formatToParts(date);
  const time = normalizeSpaces(
    new Intl.DateTimeFormat(LOCALE, {
      timeZone: TIME_ZONE,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date),
  );
  const stripDot = (value: string) => value.replace(/\.$/, '');

  return {
    weekday: stripDot(part(short, 'weekday')).toUpperCase(),
    day: part(short, 'day'),
    month: stripDot(part(short, 'month')).toUpperCase(),
    longLabel: `${capitalize(stripDot(part(long, 'weekday')))}. ${part(long, 'day')} de ${part(long, 'month')} · ${time}`,
  };
}
