import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { emptyTicket, TicketCheckoutModal, validateTickets } from './ticket-checkout-modal';

import {
  DANSSHIP_ERROR_CATEGORY,
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  type EventLanding,
  type LandingParticipantType,
} from '@core/api';
import '@core/i18n';

vi.mock('@contexts', () => ({
  useAuth: () => ({ isAuthenticated: true, ready: true, user: { managedUsersEnabled: false } }),
  useOrPermissions: () => true,
}));

const t = (key: string) => key;

const guests: LandingParticipantType = {
  id: 'guests',
  name: 'Invitados',
  registration_mode: 'multi_ticket',
  state: 'open',
  closes_at: null,
  requires_account: true,
  fees: [{ label: 'Entrada general', price: '10000' }],
  minors: { allowed: true, max_age: 12, per_adult_max: 3, price: '0' },
  terms: null,
  my_signup_id: null,
};

const landing = {
  kind: 'event',
  slug: 'clausura',
  name: 'Clausura Dansship',
  type: 'showcase',
  price_rows: [],
  components: [],
  remaining: 100,
  capacity: 100,
  participation: { types: [guests], remaining: 100, capacity: 100 },
} as unknown as EventLanding;

function emailTaken() {
  const body = {
    category: DANSSHIP_ERROR_CATEGORY.CONFLICT,
    error_code: DANSSHIP_ERROR_CODE.EVENT_TICKET_EMAIL_TAKEN,
    message: 'taken',
    status: 409,
    timestamp: '',
    path: '',
    details: { indexes: [0] },
    request_id: null,
    trace_id: null,
  } as unknown as ConstructorParameters<typeof DansshipAPIError>[0];

  return { ok: false, data: null, status: 409, error: new DansshipAPIError(body, 409, 'taken') } as never;
}

function renderModal(props: Partial<Parameters<typeof TicketCheckoutModal>[0]> = {}) {
  return render(
    <MemoryRouter>
      <TicketCheckoutModal landing={landing} ticketType={guests} isOpen onClose={() => undefined} {...props} />
    </MemoryRouter>,
  );
}

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
});

describe('TicketCheckoutModal', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.participation, 'quoteTickets').mockResolvedValue({
      ok: true,
      status: 200,
      error: null,
      data: {
        tickets: [
          { index: 0, full_name: 'Laura', is_minor: false, email: 'laura@x.com', attach_to_index: null, price: 5000 },
          { index: 1, full_name: 'Sofía', is_minor: true, email: null, attach_to_index: 0, price: 0 },
        ],
        totals: {
          final_price: 5000,
          base_amount: 4202,
          tax_amount: 798,
          wallet_amount_applied: 0,
          amount_to_charge: 5000,
        },
      },
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('asks the server for each ticket price and shows them without the reason', async () => {
    renderModal();

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Laura' } });
    fireEvent.change(screen.getByLabelText('Correo de quien asiste'), { target: { value: 'laura@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Agregar una entrada' }));
    fireEvent.click(screen.getAllByRole('checkbox', { name: 'Es menor de 12 años' })[1]);
    fireEvent.change(screen.getByLabelText('Nombre del menor'), { target: { value: 'Sofía' } });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }));

    await waitFor(() => expect(DansshipAPI.participation.quoteTickets).toHaveBeenCalledTimes(1));
    expect(DansshipAPI.participation.quoteTickets).toHaveBeenCalledWith('clausura', {
      participant_type_id: 'guests',
      tickets: [
        { full_name: 'Laura', is_minor: false, email: 'laura@x.com' },
        { full_name: 'Sofía', is_minor: true, attach_to_index: 0, family_minor_user_id: null },
      ],
    });
    expect(await screen.findByText('Sofía (menor)')).toBeVisible();
    expect(screen.queryByText(/Comunidad/)).toBeNull();
  });

  it('marks the ticket whose email already has a ticket', async () => {
    vi.mocked(DansshipAPI.participation.quoteTickets).mockResolvedValue(emailTaken());
    renderModal();

    fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Laura' } });
    fireEvent.change(screen.getByLabelText('Correo de quien asiste'), { target: { value: 'laura@x.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Este correo ya tiene una entrada.');
  });

  it('opens the payment step of a rejected purchase with the notice', async () => {
    vi.spyOn(DansshipAPI.participation, 'getTicketPurchase').mockResolvedValue({
      ok: true,
      status: 200,
      error: null,
      data: {
        purchase_id: 'purchase-1',
        signup_id: 'signup-1',
        event_id: 'event-1',
        event_name: 'Clausura Dansship',
        event_slug: 'clausura',
        participant_type_id: 'guests',
        status: 'payment_rejected',
        tickets: [
          { index: 0, full_name: 'Andrés', is_minor: false, email: 'a@x.com', attach_to_index: null, price: 10000 },
        ],
        totals: {
          final_price: 10000,
          base_amount: 8403,
          tax_amount: 1597,
          wallet_amount_applied: 0,
          amount_to_charge: 10000,
        },
        payment_intent_id: 'intent-1',
        payment_status: 'rejected',
        repayable: true,
        terms: null,
      },
    } as never);

    renderModal({ repayPurchaseId: 'purchase-1' });

    expect(await screen.findByText(/No pudimos aprobar tu comprobante anterior/)).toBeVisible();
    expect(screen.getByText('Andrés')).toBeVisible();
  });
});
