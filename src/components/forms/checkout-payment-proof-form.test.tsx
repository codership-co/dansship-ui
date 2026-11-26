import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { CheckoutPaymentProofForm } from './checkout-payment-proof-form';
import { defaultCheckoutFormValues } from './checkout-review-plan-form';

import { PaymentMethod } from '@core/api';
import '@core/i18n';

function renderForm(onConfirmWithProof = vi.fn().mockResolvedValue(undefined)) {
  render(
    <CheckoutPaymentProofForm
      variant='event'
      hideSummary
      paymentMethod={PaymentMethod.TRANSFER}
      finalPrice={80000}
      amountToCharge={80000}
      walletAmountApplied={0}
      confirmLabel='Aprobar pago e inscribir'
      onClose={() => undefined}
      onSubmit={() => undefined}
      onConfirmWithProof={onConfirmWithProof}
    />,
  );

  return onConfirmWithProof;
}

describe('CheckoutPaymentProofForm (event variant)', () => {
  beforeAll(() => {
    vi.stubGlobal('URL', Object.assign(URL, { createObjectURL: () => 'blob:proof' }));
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

  it('enables the confirm action once a proof image is chosen and hands it to the caller', async () => {
    const onConfirm = renderForm();
    const confirm = screen.getByRole('button', { name: 'Aprobar pago e inscribir' });

    expect(confirm).toBeDisabled();

    const file = new File(['proof'], 'comprobante.png', { type: 'image/png' });

    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [file] } });
    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith(file));
  });

  it('refuses a file type the proof upload does not accept and says which file', async () => {
    renderForm();
    const sheet = new File(['proof'], 'comprobante.xlsx', { type: 'application/vnd.ms-excel' });

    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [sheet] } });

    expect(screen.getByRole('button', { name: 'Aprobar pago e inscribir' })).toBeDisabled();
    expect(await screen.findByRole('alert')).toHaveTextContent('comprobante.xlsx');
  });

  it('takes the type from the extension when the system reports none', async () => {
    const onConfirm = renderForm();
    const untyped = new File(['proof'], 'comprobante.JPG', { type: '' });

    fireEvent.change(document.querySelector('input[type=file]')!, { target: { files: [untyped] } });
    const confirm = screen.getByRole('button', { name: 'Aprobar pago e inscribir' });

    await waitFor(() => expect(confirm).toBeEnabled());
    fireEvent.click(confirm);
    await waitFor(() => expect(onConfirm).toHaveBeenCalled());
    expect(onConfirm.mock.calls[0][0].type).toBe('image/jpeg');
  });
});

describe('CheckoutPaymentProofForm plan summary', () => {
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

  const plan = {
    id: 'plan-1',
    name: 'Floreciendo Impulso',
    price: 161000,
    currency: 'COP',
    classes_included: 8,
    validity_days: 30,
  };

  function renderSummary(planExpiresOn: string | null) {
    render(
      <CheckoutPaymentProofForm
        plan={plan}
        checkoutData={{ ...defaultCheckoutFormValues, start_date: new Date(2026, 10, 26) }}
        paymentMethod={PaymentMethod.TRANSFER}
        finalPrice={161000}
        amountToCharge={161000}
        walletAmountApplied={0}
        planExpiresOn={planExpiresOn}
        onClose={() => undefined}
        onSubmit={() => undefined}
      />,
    );
  }

  it('shows the last day of the plan the server previewed', () => {
    renderSummary('2027-01-31');

    expect(screen.getByText('Vence el 31 de enero de 2027')).toBeInTheDocument();
  });

  it('shows no last day when the server did not send one', () => {
    renderSummary(null);

    expect(screen.queryByText(/Vence el/)).not.toBeInTheDocument();
  });
});
