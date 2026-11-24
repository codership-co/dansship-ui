import { describe, expect, it } from 'vitest';

import { emptyTicket, ticketPayload, validateTickets } from './tickets';

const t = (key: string) => key;

describe('validateTickets', () => {
  it('refuses repeated emails, loose minors, too many minors and only minors', () => {
    const adult = (email: string) => ({ ...emptyTicket(), full_name: 'A', email });
    const minor = (attach: number | null) => ({
      ...emptyTicket(),
      full_name: 'N',
      is_minor: true,
      attach_to_index: attach,
    });

    expect(validateTickets([adult('a@x.com'), adult('A@x.com')], 3, t)).toEqual({ 1: 'eventos:tickets.emailTaken' });
    expect(validateTickets([adult('a@x.com'), minor(null)], 3, t)).toEqual({ 1: 'eventos:tickets.attachRequired' });
    expect(validateTickets([adult('a@x.com'), minor(0), minor(0)], 1, t)).toEqual({
      2: 'errors:codes.EVENT_TICKET_MINORS_LIMIT',
    });
    expect(validateTickets([minor(null)], 3, t)[0]).toBe('errors:codes.EVENT_TICKET_MINORS_ONLY');
    expect(validateTickets([adult('a@x.com'), minor(0)], 3, t)).toEqual({});
  });

  it('sends adults with email and minors attached to an adult', () => {
    expect(
      ticketPayload([
        { ...emptyTicket(), full_name: ' Laura ', email: 'laura@x.com ' },
        { ...emptyTicket(), full_name: 'Sofía', is_minor: true, attach_to_index: 0 },
      ]),
    ).toEqual([
      { full_name: 'Laura', is_minor: false, email: 'laura@x.com' },
      { full_name: 'Sofía', is_minor: true, attach_to_index: 0, family_minor_user_id: null },
    ]);
  });
});
