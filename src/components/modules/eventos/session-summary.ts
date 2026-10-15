import type { EventLanding } from '@core/api';

const WEEKDAYS = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábados', 'domingos'];

function clockLabel(value: string) {
  const [hourText, minuteText] = value.split(':');
  const hour = Number(hourText);
  const minute = minuteText ?? '00';
  const suffix = hour >= 12 ? 'pm' : 'am';
  const twelve = hour % 12 || 12;

  return `${twelve}:${minute} ${suffix}`;
}

export function sessionSummaryText(
  landing: Pick<EventLanding, 'session_summary'>,
  translate: (key: string, options?: Record<string, unknown>) => string,
) {
  const summary = landing.session_summary;

  if (!summary || summary.extra_count < 1) {
    return null;
  }

  if (summary.weekday === null || summary.weekday === undefined || !summary.start_time || !summary.end_time) {
    return translate('eventos:landing.sessionCount', { count: summary.extra_count });
  }

  return translate('eventos:landing.sessionCountWithTime', {
    count: summary.extra_count,
    weekday: WEEKDAYS[summary.weekday] ?? '',
    start: clockLabel(summary.start_time),
    end: clockLabel(summary.end_time),
  });
}
