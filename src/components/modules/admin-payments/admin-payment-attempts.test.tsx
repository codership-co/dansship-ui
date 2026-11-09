import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { AdminPaymentAttempts } from './admin-payment-attempts';

import { PaymentStatus } from '@core/api';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@hooks', () => ({ useDateLocale: () => undefined }));
vi.mock('@components/modules', () => ({
  PaymentStatusBadge: ({ status }: { status: string }) => <span>{`status:${status}`}</span>,
}));

const attempt = (overrides = {}) => ({
  gateway_transaction_id: 'pay-1',
  status: PaymentStatus.REJECTED,
  processed_at: '2026-11-09T13:39:41Z',
  card_brand: 'MASTERCARD',
  masked_pan: '**** 1369',
  ...overrides,
});

describe('AdminPaymentAttempts', () => {
  it('renders nothing without attempts or with a single one', () => {
    const { container, rerender } = render(<AdminPaymentAttempts />);
    expect(container).toBeEmptyDOMElement();

    rerender(<AdminPaymentAttempts attempts={[attempt()]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('lists every attempt with card, reference and status', () => {
    render(
      <AdminPaymentAttempts
        attempts={[
          attempt(),
          attempt({
            gateway_transaction_id: 'pay-2',
            status: PaymentStatus.APPROVED,
            card_brand: 'VISA',
            masked_pan: '**** 5051',
          }),
        ]}
      />,
    );

    expect(screen.getByText('payments:admin.attempts.title')).toBeInTheDocument();
    expect(screen.getByText('MASTERCARD **** 1369')).toBeInTheDocument();
    expect(screen.getByText('VISA **** 5051')).toBeInTheDocument();
    expect(screen.getByText('status:rejected')).toBeInTheDocument();
    expect(screen.getByText('status:approved')).toBeInTheDocument();
    expect(screen.getByText(/pay-2/)).toBeInTheDocument();
  });

  it('shows a fallback label when the attempt has no card data', () => {
    render(<AdminPaymentAttempts attempts={[attempt({ card_brand: null, masked_pan: null }), attempt()]} />);

    expect(screen.getByText('payments:admin.attempts.noCard')).toBeInTheDocument();
  });
});
