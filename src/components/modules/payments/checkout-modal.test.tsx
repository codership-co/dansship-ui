import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CheckoutModal } from './checkout-modal';

import '@core/i18n';

import type { PublicPlan } from '@core/api';

const basePlan: PublicPlan = {
  id: 'plan-1',
  name: 'Floreciendo Impulso',
  price: 230000,
  currency: 'COP',
  classes_included: 8,
  validity_days: 30,
  gift_claim: {
    monthly: { claim_days: 90, refund_to_wallet: false },
    quarterly: { claim_days: 90, refund_to_wallet: false },
  },
};

const fixedExpiryPlan: PublicPlan = {
  ...basePlan,
  promotion: {
    code: 'BLACK_FRIDAY_2026',
    label_key: 'subscriptions:discountBlackFriday',
    discount_percentage: 30,
    discount_modes: ['monthly'],
    original_price: 230000,
    promotional_price: 161000,
    start_rule: 'on_approval',
    terms_required: false,
    expires_on: '2027-01-31',
  },
  gift_claim: {
    monthly: { claim_days: 7, refund_to_wallet: true },
    quarterly: { claim_days: 90, refund_to_wallet: false },
  },
};

function renderModal(plan: PublicPlan) {
  return render(
    <MemoryRouter>
      <CheckoutModal isOpen onClose={vi.fn()} plan={plan} />
    </MemoryRouter>,
  );
}

describe('CheckoutModal plan validity', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    // jsdom has no element scrolling; the stepper scrolls its panes on every step.
    Element.prototype.scrollTo = vi.fn() as unknown as typeof Element.prototype.scrollTo;
  });

  afterEach(cleanup);

  it('keeps the validity days when the plan has no fixed last day', () => {
    renderModal(basePlan);

    expect(screen.getByText('Floreciendo Impulso · Válido por 30 días')).toBeInTheDocument();
  });

  it('shows the fixed last day the server sent for a discounted purchase', () => {
    renderModal(fixedExpiryPlan);

    expect(screen.getByText('Floreciendo Impulso · Vence el 31 de enero de 2027')).toBeInTheDocument();
  });

  it('goes back to 90 days for the quarterly mode, which keeps its own validity', () => {
    renderModal(fixedExpiryPlan);

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByText('Floreciendo Impulso · Válido por 90 días')).toBeInTheDocument();
  });
});
