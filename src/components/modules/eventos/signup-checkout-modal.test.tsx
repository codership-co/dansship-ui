import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SignupCheckoutModal } from './signup-checkout-modal';

import { DansshipAPI, type EventLanding, type SignupApplication, type SignupQuote } from '@core/api';
import '@core/i18n';

vi.mock('@contexts', () => ({
  useAuth: () => ({ isAuthenticated: true, ready: true, user: { managedUsersEnabled: false } }),
  useOrPermissions: () => true,
}));

const landing = {
  kind: 'event',
  slug: 'despedida',
  name: 'Despedida de Ana',
  starts_at: '2026-12-20T20:00:00Z',
  price_rows: [],
  components: [],
  remaining: 20,
  capacity: 20,
  payment_qr_url: null,
} as unknown as EventLanding;

const application: SignupApplication = {
  participant_type_id: 'type-1',
  registration_option: 'group_booking',
  answers: {},
  members: [],
  tickets: [],
  package_id: 'pkg-1',
  people_count: 8,
  donation_type_ids: [],
  accepted_terms: true,
  terms_version_id: null,
};

const quote: SignupQuote = {
  charges_money: true,
  lines: [{ index: 0, full_name: 'Ana', is_minor: false, email: null, attach_to_index: null, price: 1064000 }],
  total: 1064000,
  totals: {
    final_price: 532000,
    base_amount: 447059,
    tax_amount: 84941,
    wallet_amount_applied: 0,
    amount_to_charge: 532000,
  },
};

function renderModal(props: Partial<Parameters<typeof SignupCheckoutModal>[0]> = {}) {
  return render(
    <MemoryRouter>
      <SignupCheckoutModal
        landing={landing}
        isOpen
        onClose={() => undefined}
        application={application}
        quote={quote}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe('SignupCheckoutModal', () => {
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
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('reviews the quoted lines with what is paid today and the balance, never the reason', () => {
    renderModal();

    expect(screen.getAllByText('Ana').length).toBeGreaterThan(0);
    expect(screen.getByText('Pagas hoy')).toBeVisible();
    expect(screen.getByText('Saldo (según las cuotas)')).toBeVisible();
    expect(screen.queryByText(/Comunidad/)).toBeNull();
  });

  it('goes to the payment step from the review', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente →' }));

    await waitFor(() => expect(screen.getAllByText(/1\.064\.000|532\.000/).length).toBeGreaterThan(0));
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

    renderModal({ application: null, quote: null, repayPurchaseId: 'purchase-1' });

    expect(await screen.findByText(/No pudimos aprobar tu comprobante anterior/)).toBeVisible();
    expect(screen.getByText('Andrés')).toBeVisible();
  });
});
