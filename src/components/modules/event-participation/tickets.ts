import type { TicketInputPayload } from '@core/api';

/** One ticket being filled in ("Varias entradas por compra"). */
export interface TicketDraft {
  full_name: string;
  email: string;
  is_minor: boolean;
  attach_to_index: number | null;
  family_minor_user_id: string | null;
}

export function emptyTicket(): TicketDraft {
  return { full_name: '', email: '', is_minor: false, attach_to_index: null, family_minor_user_id: null };
}

/** Client checks before asking the server; the server stays the source of truth. Returns errors by ticket. */
export function validateTickets(
  tickets: Array<TicketDraft>,
  perAdultMax: number | null,
  t: (key: string, options?: Record<string, unknown>) => string,
): Record<number, string> {
  const errors: Record<number, string> = {};
  const emails = new Map<string, number>();
  const minorsByAdult = new Map<number, number>();

  tickets.forEach((ticket, index) => {
    if (!ticket.full_name.trim()) {
      errors[index] = t('eventos:tickets.nameRequired');

      return;
    }

    if (ticket.is_minor) {
      const target = ticket.attach_to_index;

      if (target === null || tickets[target]?.is_minor !== false) {
        errors[index] = t('eventos:tickets.attachRequired');

        return;
      }

      const count = (minorsByAdult.get(target) ?? 0) + 1;

      minorsByAdult.set(target, count);

      if (perAdultMax !== null && count > perAdultMax) {
        errors[index] = t('errors:codes.EVENT_TICKET_MINORS_LIMIT');
      }

      return;
    }

    const email = ticket.email.trim().toLowerCase();

    if (!email.includes('@')) {
      errors[index] = t('eventos:participation.form.emailInvalid');
    } else if (emails.has(email)) {
      errors[index] = t('eventos:tickets.emailTaken');
    } else {
      emails.set(email, index);
    }
  });

  if (tickets.length > 0 && tickets.every(ticket => ticket.is_minor)) {
    errors[0] = t('errors:codes.EVENT_TICKET_MINORS_ONLY');
  }

  return errors;
}

export function ticketPayload(tickets: Array<TicketDraft>): Array<TicketInputPayload> {
  return tickets.map(ticket =>
    ticket.is_minor
      ? {
          full_name: ticket.full_name.trim(),
          is_minor: true,
          attach_to_index: ticket.attach_to_index,
          family_minor_user_id: ticket.family_minor_user_id,
        }
      : { full_name: ticket.full_name.trim(), is_minor: false, email: ticket.email.trim() },
  );
}
