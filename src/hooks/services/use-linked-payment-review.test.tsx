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
  isAbortFailure: () => false,
  isDansshipTransportError: () => false,
}));

const PAYMENT_ID = '3f2b8c1e-9a4d-4e7b-8c2a-1d5e6f7a8b9c';
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
    const intent = { id: PAYMENT_ID };

    getAdminPaymentDetail.mockResolvedValue({ ok: true, data: intent, error: null, status: 200 });

    const onOpen = renderAt(PageURLS.admin.paymentReview(PAYMENT_ID));

    await waitFor(() => expect(onOpen).toHaveBeenCalledWith(intent));
    expect(getAdminPaymentDetail).toHaveBeenCalledWith(PAYMENT_ID);

    act(() => clear());
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/);
  });

  it('warns and drops the param when the payment does not exist', async () => {
    getAdminPaymentDetail.mockResolvedValue({ ok: false, data: null, error: {}, status: 404 });

    const onOpen = renderAt(`/admin/payments?payment=${PAYMENT_ID}&status=x`);

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('payments:admin.linkedPaymentNotFound'));
    expect(onOpen).not.toHaveBeenCalled();
    expect(screen.getByTestId('search')).toHaveTextContent('?status=x');
  });

  it('keeps the param on any other failure so a reload can retry', async () => {
    getAdminPaymentDetail.mockResolvedValue({ ok: false, data: null, error: {}, status: 502 });

    renderAt(PageURLS.admin.paymentReview(PAYMENT_ID));

    await waitFor(() => expect(toastError).toHaveBeenCalledWith('payments:admin.linkedPaymentLoadFailed'));
    expect(screen.getByTestId('search')).toHaveTextContent(`?payment=${PAYMENT_ID}`);
  });

  it('never sends a value that is not a payment id to the API', () => {
    renderAt(`/admin/payments?payment=${encodeURIComponent('../../admin/users/1')}`);

    expect(getAdminPaymentDetail).not.toHaveBeenCalled();
    expect(toastError).toHaveBeenCalledWith('payments:admin.linkedPaymentNotFound');
    expect(screen.getByTestId('search')).toHaveTextContent(/^$/);
  });

  it('does nothing without the param or when disabled', () => {
    renderAt('/admin/payments');
    cleanup();
    renderAt(PageURLS.admin.paymentReview(PAYMENT_ID), vi.fn(), false);

    expect(getAdminPaymentDetail).not.toHaveBeenCalled();
    expect(toastError).not.toHaveBeenCalled();
  });
});
