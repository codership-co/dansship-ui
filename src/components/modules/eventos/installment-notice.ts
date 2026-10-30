import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

import type { EventOfferingKind } from '@core/api';

type Translate = (key: string, options?: Record<string, unknown>) => string;

export interface PaymentNoticeInput {
  kind: EventOfferingKind;
  installmentDueDates?: Array<string> | null;
  hasInstallmentAmounts: boolean;
  surface: 'landing' | 'checkout';
}

function calendarDate(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function dueLabel(isoDate: string, t: Translate): string | null {
  const date = calendarDate(isoDate);

  if (!date) {
    return null;
  }

  return t('eventos:landing.installmentDueDate', {
    day: date.getDate(),
    month: format(date, 'MMMM', { locale: es }),
  });
}

function ordinalLabel(index: number, t: Translate): string {
  const key = `eventos:landing.installmentOrdinal.${index + 1}`;
  const label = t(key);

  if (label === key || label.endsWith(`installmentOrdinal.${index + 1}`)) {
    return t('eventos:landing.installmentOrdinalFallback', { count: index + 1 });
  }

  return label;
}

function scheduleClause(dates: Array<string>, t: Translate): string | null {
  const clauses = dates.map((isoDate, index) => {
    const date = dueLabel(isoDate, t);

    if (!date) {
      return null;
    }

    return t(index === 0 ? 'eventos:landing.installmentDueFirst' : 'eventos:landing.installmentDueNext', {
      ordinal: ordinalLabel(index, t),
      date,
    });
  });

  if (clauses.some(clause => clause === null)) {
    return null;
  }

  const phrases = clauses as Array<string>;

  if (phrases.length === 1) {
    return phrases[0];
  }

  const join = t('eventos:landing.installmentDueJoin');
  const head = phrases.slice(0, -1).join(', ');

  return `${head} ${join} ${phrases[phrases.length - 1]}`;
}

function singlePaymentCopy(input: PaymentNoticeInput, t: Translate): string {
  if (input.surface === 'checkout') {
    return t('eventos:checkout.nonRefundableNote');
  }

  return input.kind === 'combo' ? t('eventos:landing.nonRefundableCombo') : t('eventos:landing.nonRefundable');
}

export function paymentNotice(input: PaymentNoticeInput, t: Translate): string | null {
  const dates = (input.installmentDueDates ?? []).filter(date => date.length > 0);

  if (dates.length > 0) {
    const schedule = scheduleClause(dates, t);

    if (!schedule) {
      return null;
    }

    const notice = t('eventos:landing.installmentNotice', { count: dates.length, schedule });

    if (dates.length < 2) {
      return notice;
    }

    return `${notice} ${t('eventos:landing.installmentChoiceNote')}`;
  }

  if (input.kind !== 'combo' && input.hasInstallmentAmounts) {
    return null;
  }

  return singlePaymentCopy(input, t);
}

export function landingHasInstallmentAmounts(
  priceRows: Array<{ installment_amounts?: Array<string | number> }>,
): boolean {
  return priceRows.some(row => (row.installment_amounts?.length ?? 0) > 0);
}
