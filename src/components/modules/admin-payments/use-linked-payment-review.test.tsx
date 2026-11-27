import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLinkedPaymentReview } from './use-linked-payment-review';

import { PageURLS } from '@core/constants';

const getAdminPaymentDetail = vi.fn();
const toastError = vi.fn();

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('sonner', () => ({ toast: { error: (message: string) => toastError(message) } }));
vi.mock('@core/api', () => ({
  DansshipAPI: { paymentsAdmin: { getAdminPaymentDetail: (id: string) => getAdminPaymentDetail(id) } },
}));

let clear: () => void = () => undefined;

function Probe({ onOpen, enabled = true }: { onOpen: (intent: unknown) => void; enabled?: boolean }) {
  const { clearLinkedPayment } = useLinkedPaymentReview(onOpen, enabled);
  const location = useLocation();
  clear = clearLinkedPayment;

  return <span data-testid='search'>{location.search}</span>;
}

const renderAt = (url: string, onOpen = vi.fn(), enabled = true) => {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Probe onOpen={onOpen} enabled={enabled} />
    </MemoryRouter>,
  );

  return onOpen;
};

describe('useLinkedPaymentReview', () => {
  beforeEach(() => {
    getAdminPaymentDetail.mockReset();
    toastError.mockReset();
  });
  afterEach(cleanup);

  it('opens the payment named in the link and clears the param on close', async () => {
    const intent = { id: 'pay-1' };
    getAdminPaymentDetail.mockResolvedValue({ ok: true, data: intent });

    const onOpen = renderAt(PageURLS.admin.paymentReview('pay-1'));

    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(intent));
    expect(getAdminPaymentDetail).toHaveBeenCalledWith('pay-1');

    act(() => clear());
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/);
  });

  it('warns and clears the param when the payment cannot be loaded', async () => {
    getAdminPaymentDetail.mockResolvedValue({ ok: false, data: undefined });

    const onOpen = renderAt('/admin/payments?payment=missing&status=x');

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('payments:admin.linkedPaymentNotFound'));
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByTestId('search')).toHaveTextContent('?status=x');
  });

  it('does nothing without the param or when disabled', () => {
    renderAt('/admin/payments');
    cleanup();
    renderAt(PageURLS.admin.paymentReview('pay-1'), vi.fn(), false);

    expect(getAdminPaymentDetail).not.toHaveBeenCalled();
  });
});
