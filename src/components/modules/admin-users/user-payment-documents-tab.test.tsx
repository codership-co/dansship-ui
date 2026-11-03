import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UserPaymentDocumentsTab } from './user-payment-documents-tab';

import { DansshipAPI, type PaymentProfile, type SocialSecurityPeriodStatus } from '@core/api';
import '@core/i18n';

function mockProfile(overrides: Partial<PaymentProfile>, periods: Array<SocialSecurityPeriodStatus> = []) {
  const profile = {
    user_id: 'user-1',
    payment_type: 'hourly_classes',
    has_rut: true,
    has_bank_certificate: true,
    has_signature: true,
    has_social_security: false,
    bank_name: 'Bancolombia',
    account_type: 'savings',
    account_number: '0011223344',
    is_complete: true,
    missing_requirements: [],
    cuenta_de_cobro_enabled: true,
    ...overrides,
  };

  vi.spyOn(DansshipAPI.instructorPaymentsAdmin, 'getUserPaymentDocuments').mockResolvedValue({
    ok: true,
    data: {
      profile,
      documents: [],
      payable_document_id: null,
      social_security_periods: periods,
    },
  } as never);
}

describe('UserPaymentDocumentsTab account details', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows bank, account type and account number for savings', async () => {
    mockProfile({});
    render(<UserPaymentDocumentsTab userId='user-1' canVoid={false} />);

    expect(await screen.findByText('Ahorros')).toBeInTheDocument();
    expect(screen.getByText('Banco')).toBeInTheDocument();
    expect(screen.getByText('Bancolombia')).toBeInTheDocument();
    expect(screen.getByText('Número de cuenta')).toBeInTheDocument();
  });

  it('shows Llave as the type, hides the bank and labels the number as Llave', async () => {
    mockProfile({
      account_type: 'bre_b',
      bank_name: null,
      account_number: '3001234567',
    });
    render(<UserPaymentDocumentsTab userId='user-1' canVoid={false} />);

    expect(await screen.findByText('3001234567')).toBeInTheDocument();
    expect(screen.getAllByText('Llave')).toHaveLength(2);
    expect(screen.queryByText('Banco')).not.toBeInTheDocument();
    expect(screen.queryByText('Número de cuenta')).not.toBeInTheDocument();
  });
});

describe('UserPaymentDocumentsTab social security periods', () => {
  const period = (overrides: Partial<SocialSecurityPeriodStatus> = {}): SocialSecurityPeriodStatus => ({
    year: 2026,
    month: 7,
    required: true,
    uploaded: false,
    proof_year: 2026,
    proof_month: 7,
    ...overrides,
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('says nothing was requested when there are no periods', async () => {
    mockProfile({});
    render(
      <MemoryRouter>
        <UserPaymentDocumentsTab userId='user-1' canVoid={false} canManagePayRate />
      </MemoryRouter>,
    );

    expect(await screen.findByText('No se ha pedido la planilla de ningún periodo.')).toBeInTheDocument();
  });

  it('lists each period with its status', async () => {
    mockProfile({}, [period(), period({ month: 6, uploaded: true }), period({ month: 5, required: false })]);
    render(
      <MemoryRouter>
        <UserPaymentDocumentsTab userId='user-1' canVoid={false} canManagePayRate />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Cargada')).toBeInTheDocument();
    expect(screen.getByText('Ya no se pide')).toBeInTheDocument();
  });

  it('asks for the selected month and refreshes the list', async () => {
    mockProfile({});
    const ask = vi
      .spyOn(DansshipAPI.instructorPaymentsAdmin, 'setSocialSecurityRequirement')
      .mockResolvedValue({ ok: true, data: period() } as never);
    render(
      <MemoryRouter>
        <UserPaymentDocumentsTab userId='user-1' canVoid={false} canManagePayRate />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Pedir planilla' }));

    await waitFor(() => expect(ask).toHaveBeenCalledWith('user-1', expect.any(Number), expect.any(Number), true));
  });

  it('withdraws a pending request', async () => {
    mockProfile({}, [period()]);
    const ask = vi.spyOn(DansshipAPI.instructorPaymentsAdmin, 'setSocialSecurityRequirement').mockResolvedValue({
      ok: true,
      data: period({ required: false }),
    } as never);
    render(
      <MemoryRouter>
        <UserPaymentDocumentsTab userId='user-1' canVoid={false} canManagePayRate />
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'Dejar de pedir' }));

    await waitFor(() => expect(ask).toHaveBeenCalledWith('user-1', 2026, 7, false));
  });

  it('opens an uploaded planilla', async () => {
    mockProfile({}, [period({ uploaded: true })]);
    const view = vi.spyOn(DansshipAPI.instructorPaymentsAdmin, 'getSocialSecurityProofViewUrl').mockResolvedValue({
      ok: true,
      data: { view_url: 'https://s3.example/x', expires_in: 60 },
    } as never);
    vi.spyOn(window, 'open').mockReturnValue(null);
    render(<UserPaymentDocumentsTab userId='user-1' canVoid={false} />);

    fireEvent.click(await screen.findByRole('button', { name: 'Ver archivo' }));

    await waitFor(() => expect(view).toHaveBeenCalledWith('user-1', 2026, 7));
  });

  it('hides the request controls without the pay rate permission', async () => {
    mockProfile({}, [period()]);
    render(<UserPaymentDocumentsTab userId='user-1' canVoid={false} />);

    await screen.findByText('Pendiente');

    expect(screen.queryByRole('button', { name: 'Pedir planilla' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Dejar de pedir' })).not.toBeInTheDocument();
  });

  it('only offers the old profile file when one exists', async () => {
    mockProfile({ has_social_security: false });
    const { unmount } = render(<UserPaymentDocumentsTab userId='user-1' canVoid={false} />);

    await screen.findByText('Ahorros');
    expect(screen.queryByRole('button', { name: /archivo anterior/ })).not.toBeInTheDocument();
    unmount();

    mockProfile({ has_social_security: true });
    render(<UserPaymentDocumentsTab userId='user-1' canVoid={false} />);

    expect(await screen.findByRole('button', { name: /archivo anterior/ })).toBeInTheDocument();
  });
});
