import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SecurePaymentDocumentsPage } from './payment-documents.page';

import { DansshipAPI, type PaymentProfile } from '@core/api';
import '@core/i18n';

vi.mock('@contexts', async importOriginal => {
  const actual = await importOriginal<typeof import('@contexts')>();

  return {
    ...actual,
    SecurityGuard: (Component: unknown) => Component,
    useAuth: () => ({ user: { id: 'user-1', cuentaDeCobroEnabled: true } }),
  };
});

function ok<T>(data: T) {
  return { ok: true as const, data, status: 200, error: null };
}

function profile(overrides: Partial<PaymentProfile> = {}): PaymentProfile {
  return {
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
  } as PaymentProfile;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <SecurePaymentDocumentsPage />
    </MemoryRouter>,
  );
}

describe('PaymentDocumentsPage bank fields', () => {
  let updateProfile: ReturnType<typeof vi.spyOn>;

  function mockProfile(value: PaymentProfile) {
    vi.spyOn(DansshipAPI.instructorPayments, 'listPaymentDocuments').mockResolvedValue(
      ok({ profile: value, months: [] }) as never,
    );
  }

  beforeEach(() => {
    updateProfile = vi
      .spyOn(DansshipAPI.instructorPayments, 'updatePaymentProfile')
      .mockResolvedValue(ok(profile()) as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('offers savings, checking and Llave account types', async () => {
    mockProfile(profile());
    renderPage();

    const select = await screen.findByLabelText('Tipo de cuenta');
    const options = Array.from(select.querySelectorAll('option')).map(option => [option.value, option.textContent]);

    expect(options).toEqual([
      ['', 'Selecciona un tipo'],
      ['savings', 'Ahorros'],
      ['checking', 'Corriente'],
      ['bre_b', 'Llave'],
    ]);
  });

  it('keeps bank name and account number fields for savings', async () => {
    mockProfile(profile());
    renderPage();

    await waitFor(() => expect(screen.getByLabelText('Banco')).toHaveValue('Bancolombia'));
    expect(screen.getByLabelText('Número de cuenta')).toHaveValue('0011223344');
    expect(screen.queryByLabelText(/^Llave/)).not.toBeInTheDocument();
  });

  it('hides the bank field and relabels the number as Llave when Llave is selected', async () => {
    mockProfile(profile());
    renderPage();

    fireEvent.change(await screen.findByLabelText('Tipo de cuenta'), {
      target: { value: 'bre_b' },
    });

    expect(screen.queryByLabelText('Banco')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Número de cuenta')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Llave (cédula, celular, correo o código)')).toBeInTheDocument();
  });

  it('shows the Llave layout straight away for a saved bre_b profile', async () => {
    mockProfile(
      profile({
        account_type: 'bre_b',
        bank_name: null,
        account_number: '3001234567',
      }),
    );
    renderPage();

    await waitFor(() =>
      expect(screen.getByLabelText('Llave (cédula, celular, correo o código)')).toHaveValue('3001234567'),
    );
    expect(screen.queryByLabelText('Banco')).not.toBeInTheDocument();
  });

  it('saves bre_b with an empty bank name and the llave as account number', async () => {
    mockProfile(
      profile({
        account_type: 'bre_b',
        bank_name: 'Bancolombia',
        account_number: '',
      }),
    );
    renderPage();

    const llave = await screen.findByLabelText('Llave (cédula, celular, correo o código)');

    await waitFor(() => expect(screen.getByLabelText('Tipo de cuenta')).toHaveValue('bre_b'));
    fireEvent.change(llave, { target: { value: 'ana@correo.co' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos bancarios' }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        bank_name: '',
        account_type: 'bre_b',
        account_number: 'ana@correo.co',
      });
    });
  });

  it('saves the bank name for a regular account type', async () => {
    mockProfile(profile());
    renderPage();

    await waitFor(() => expect(screen.getByLabelText('Banco')).toHaveValue('Bancolombia'));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar datos bancarios' }));

    await waitFor(() => {
      expect(updateProfile).toHaveBeenCalledWith({
        bank_name: 'Bancolombia',
        account_type: 'savings',
        account_number: '0011223344',
      });
    });
  });

  it('never lists the planilla among the profile documents', async () => {
    mockProfile(profile({ payment_type: 'fixed_amount', has_social_security: true }));
    renderPage();

    await screen.findByText('Guardar datos bancarios');

    expect(screen.queryByText(/Planilla de seguridad social/)).not.toBeInTheDocument();
  });

  it('shows the planilla slot only for the month the team asked it for', async () => {
    const summary = (month: number, social_security: unknown) => ({
      year: 2026,
      month,
      status: 'available',
      missing_requirements: [],
      social_security,
      issued_document: null,
      documents: [],
      can_generate: true,
    });

    vi.spyOn(DansshipAPI.instructorPayments, 'listPaymentDocuments').mockResolvedValue(
      ok({
        profile: profile(),
        months: [
          summary(8, null),
          summary(7, {
            year: 2026,
            month: 7,
            required: true,
            uploaded: false,
            proof_year: 2026,
            proof_month: 7,
          }),
        ],
      }) as never,
    );
    renderPage();

    expect(await screen.findByText('Planilla de seguridad social de Julio 2026')).toBeInTheDocument();
    expect(screen.queryByText('Planilla de seguridad social de Agosto 2026')).not.toBeInTheDocument();
  });

  it('uploads the planilla of the month through the period endpoint', async () => {
    const upload = vi
      .spyOn(DansshipAPI.instructorPayments, 'uploadSocialSecurityProof')
      .mockResolvedValue(ok({}) as never);

    vi.spyOn(DansshipAPI.instructorPayments, 'listPaymentDocuments').mockResolvedValue(
      ok({
        profile: profile(),
        months: [
          {
            year: 2026,
            month: 7,
            status: 'blocked',
            missing_requirements: ['social_security'],
            social_security: {
              year: 2026,
              month: 7,
              required: true,
              uploaded: false,
              proof_year: 2026,
              proof_month: 7,
            },
            issued_document: null,
            documents: [],
            can_generate: false,
          },
        ],
      }) as never,
    );
    const { container } = renderPage();

    await screen.findByText('Planilla de seguridad social de Julio 2026');

    const file = new File(['x'], 'planilla.pdf', { type: 'application/pdf' });
    const inputs = container.querySelectorAll('input[type=file]');

    fireEvent.change(inputs[inputs.length - 1], { target: { files: [file] } });

    await waitFor(() => expect(upload).toHaveBeenCalledWith(2026, 7, file));
  });

  it('opens the dispute reason in a dialog and sends it after the confirmation', async () => {
    const issued = {
      id: 'doc-1',
      status: 'issued',
      payment_type: 'hourly_classes',
      period_year: 2026,
      period_month: 7,
      total_amount: 50000,
      void_reason: null,
      dispute_reason: null,
      line_items: [],
    };

    vi.spyOn(DansshipAPI.instructorPayments, 'listPaymentDocuments').mockResolvedValue(
      ok({
        profile: profile(),
        months: [
          {
            year: 2026,
            month: 7,
            status: 'issued',
            missing_requirements: [],
            issued_document: issued,
            documents: [issued],
            can_generate: false,
          },
        ],
      }) as never,
    );
    const dispute = vi
      .spyOn(DansshipAPI.instructorPayments, 'disputePaymentDocument')
      .mockResolvedValue(ok(issued) as never);
    renderPage();

    fireEvent.click((await screen.findAllByText('No estoy de acuerdo'))[0]);

    expect(await screen.findByRole('dialog')).toBeTruthy();

    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'Faltan horas' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continuar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Marcar en disputa' }));

    await waitFor(() => expect(dispute).toHaveBeenCalledWith('doc-1', 'Faltan horas'));
  });
});
