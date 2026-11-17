import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CheckoutPurchaseModeForm } from './checkout-purchase-mode-form';
import { defaultCheckoutFormValues } from './checkout-review-plan-form';

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

const promotionalPlan: PublicPlan = {
  ...basePlan,
  promotion: {
    code: 'BLACK_FRIDAY_2026',
    label_key: 'subscriptions:discountBlackFriday',
    discount_percentage: 30,
    discount_modes: ['monthly'],
    original_price: 230000,
    promotional_price: 161000,
    start_rule: 'on_approval',
    terms_required: true,
  },
  gift_claim: {
    monthly: { claim_days: 7, refund_to_wallet: true },
    quarterly: { claim_days: 90, refund_to_wallet: false },
  },
};

const START_DATE_LABEL = 'Fecha de Inicio del Plan';
const START_NOTE = 'Durante Black Friday tu plan empieza apenas se apruebe el pago.';
const QUARTERLY_NOTE = 'El pago trimestral conserva su 10 %. El 30 % de Black Friday aplica solo a planes mensuales.';

function renderForm(plan: PublicPlan) {
  return render(
    <CheckoutPurchaseModeForm
      plan={plan}
      onCancel={vi.fn()}
      onSubmit={vi.fn().mockResolvedValue(undefined)}
      defaultFormValues={defaultCheckoutFormValues}
    />,
  );
}

const codePlaceholder = () => i18n.t('subscriptions:discountCodePlaceholder');

describe('CheckoutPurchaseModeForm inside a promotion', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(cleanup);

  it('is exactly the normal form without a promotion: start date and code fields', () => {
    renderForm(basePlan);

    expect(screen.getByText(START_DATE_LABEL)).toBeInTheDocument();
    expect(screen.getByText('¿Tienes un código?')).toBeInTheDocument();
    expect(screen.queryByText(START_NOTE)).not.toBeInTheDocument();
  });

  it('hides the start date and the codes for a monthly purchase and says when the plan starts', () => {
    renderForm(promotionalPlan);

    expect(screen.queryByText(START_DATE_LABEL)).not.toBeInTheDocument();
    expect(screen.getByText(START_NOTE)).toBeInTheDocument();
    expect(screen.queryByText('¿Tienes un código?')).not.toBeInTheDocument();
    expect(screen.queryByPlaceholderText(codePlaceholder())).not.toBeInTheDocument();
  });

  it('keeps the start date hidden but gives the codes back for the quarterly mode, with only its own note', () => {
    renderForm(promotionalPlan);

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.getByText(QUARTERLY_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(START_DATE_LABEL)).not.toBeInTheDocument();
    expect(screen.queryByText(START_NOTE)).not.toBeInTheDocument();
    expect(screen.getByText('¿Tienes un código?')).toBeInTheDocument();
  });

  it('does not show the quarterly note outside a promotion', () => {
    renderForm(basePlan);

    fireEvent.click(screen.getByRole('switch'));

    expect(screen.queryByText(QUARTERLY_NOTE)).not.toBeInTheDocument();
  });

  it('shows 7 days and the wallet return for a monthly gift, and hides the discount code', () => {
    renderForm(promotionalPlan);

    fireEvent.click(screen.getByRole('button', { name: 'Regalo' }));

    expect(screen.getByText('La destinataria tiene 7 días para reclamar tu regalo.')).toBeInTheDocument();
    expect(screen.getByText(/lo pagado vuelve a tu billetera/)).toBeInTheDocument();
    expect(screen.getByText('El plan empieza cuando el destinatario reclame el regalo.')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(codePlaceholder())).not.toBeInTheDocument();
  });

  it('shows 90 days and no refund for a quarterly gift inside the window', () => {
    renderForm(promotionalPlan);

    fireEvent.click(screen.getByRole('switch'));
    fireEvent.click(screen.getByRole('button', { name: 'Regalo' }));

    expect(screen.getByText('La destinataria tiene 90 días para reclamar tu regalo.')).toBeInTheDocument();
    expect(screen.getByText(/no se devuelve el dinero/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(codePlaceholder())).toBeInTheDocument();
  });

  it('shows the claim days of a gift outside any promotion, as the server gives them', () => {
    renderForm(basePlan);

    fireEvent.click(screen.getByRole('button', { name: 'Regalo' }));

    expect(screen.getByText('La destinataria tiene 90 días para reclamar tu regalo.')).toBeInTheDocument();
    expect(screen.getByText(/no se devuelve el dinero/)).toBeInTheDocument();
  });

  it('does not invent a claim policy the server did not send', () => {
    renderForm({ ...basePlan, gift_claim: undefined });

    fireEvent.click(screen.getByRole('button', { name: 'Regalo' }));

    expect(screen.queryByText(/para reclamar tu regalo/)).not.toBeInTheDocument();
  });
});
