import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import {
  CheckoutPayForm,
  defaultCheckoutFormValues,
  DefaultPaymentData,
  type PaymentData,
} from './checkout-review-plan-form';

import { PaymentMethod, type PublicPlan } from '@core/api';
import '@core/i18n';

const plan: PublicPlan = {
  id: 'plan-1',
  name: 'Floreciendo Impulso',
  price: 230000,
  currency: 'COP',
  classes_included: 8,
  validity_days: 30,
};

const TERMS = {
  version_id: 'terms-v2',
  version: 2,
  title: 'Black Friday 2026',
  file_url: 'https://cdn.example.com/misc/promotion-terms/bf/terms.pdf',
};

const promotionPayment: PaymentData = {
  ...DefaultPaymentData,
  isValid: true,
  applied: true,
  baseAmount: 135294,
  taxAmount: 25706,
  originalPrice: 230000,
  finalPrice: 161000,
  walletAmountApplied: 40000,
  amountToCharge: 121000,
  appliedDiscounts: [
    {
      code: 'BLACK_FRIDAY_2026',
      name: 'Black Friday 2026',
      type: 'percentage_discount',
      value: 30,
      calculatedAmount: 69000,
      labelKey: 'subscriptions:discountBlackFriday',
    },
  ],
  promotion: {
    code: 'BLACK_FRIDAY_2026',
    labelKey: 'subscriptions:discountBlackFriday',
    discountPercentage: 30,
    originalPrice: 230000,
    promotionalPrice: 161000,
    startRule: 'on_approval',
    ignoredInputs: [],
    terms: TERMS,
  },
};

function Harness({ paymentData, onSubmit = vi.fn() }: { paymentData: PaymentData; onSubmit?: () => void }) {
  const [accepted, setAccepted] = useState<string | null>(null);

  return (
    <CheckoutPayForm
      plan={plan}
      checkoutData={defaultCheckoutFormValues}
      paymentData={paymentData}
      paymentMethod={PaymentMethod.TRANSFER}
      onPaymentMethodChange={() => undefined}
      isWalletCovered={false}
      acceptedTermsVersionId={accepted}
      onAcceptedTermsVersionChange={setAccepted}
      onBack={() => undefined}
      onSubmit={onSubmit}
    />
  );
}

const nextButton = () => screen.getByRole('button', { name: /Siguiente/ });

describe('CheckoutPayForm with a promotion', () => {
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

  it('shows the promotion discount line with the percentage from the API, the wallet and the old price', () => {
    render(<Harness paymentData={promotionPayment} />);

    expect(screen.getByText('Descuento Black Friday (30 %)')).toBeInTheDocument();
    expect(screen.getByText('Saldo de billetera aplicado')).toBeInTheDocument();
    expect(screen.getByText(/Antes/)).toHaveTextContent('230.000');
  });

  it('asks for the promotion terms next to the general terms and needs both to continue', () => {
    render(<Harness paymentData={promotionPayment} />);

    const general = screen.getByRole('checkbox', { name: /términos y condiciones de servicio/ });
    const promotion = screen.getByRole('checkbox', { name: /términos de esta promoción/ });

    expect(nextButton()).toBeDisabled();

    fireEvent.click(general);
    expect(nextButton()).toBeDisabled();

    fireEvent.click(promotion);
    expect(nextButton()).toBeEnabled();

    fireEvent.click(promotion);
    expect(nextButton()).toBeDisabled();
  });

  it('links the promotion terms PDF from the API in a new tab without accepting them', () => {
    render(<Harness paymentData={promotionPayment} />);

    const link = screen.getByRole('link', { name: 'términos de esta promoción' });

    expect(link).toHaveAttribute('href', TERMS.file_url);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));

    fireEvent.click(link);
    expect(screen.getByRole('checkbox', { name: /términos de esta promoción/ })).not.toBeChecked();
  });

  it('shows no promotion checkbox when the promotion has no terms text', () => {
    render(
      <Harness
        paymentData={{
          ...promotionPayment,
          promotion: { ...promotionPayment.promotion!, terms: null },
        }}
      />,
    );

    expect(screen.queryByRole('checkbox', { name: /términos de esta promoción/ })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones de servicio/ }));
    expect(nextButton()).toBeEnabled();
  });

  it('shows no promotion checkbox without a promotion', () => {
    render(
      <Harness paymentData={{ ...DefaultPaymentData, isValid: true, finalPrice: 230000, amountToCharge: 230000 }} />,
    );

    expect(screen.getAllByRole('checkbox')).toHaveLength(1);
  });
});
