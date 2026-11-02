import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { UserPaymentDocumentsTab } from './user-payment-documents-tab';

import { DansshipAPI, type PaymentProfile } from '@core/api';
import '@core/i18n';

function mockProfile(overrides: Partial<PaymentProfile>) {
  const profile = {
    user_id: 'user-1',
    payment_type: 'hourly_classes',
    has_rut: true,
    has_bank_certificate: true,
    has_signature: true,
    has_social_security: false,
    social_security_applicable: false,
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
    data: { profile, documents: [], payable_document_id: null },
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
    mockProfile({ account_type: 'bre_b', bank_name: null, account_number: '3001234567' });
    render(<UserPaymentDocumentsTab userId='user-1' canVoid={false} />);

    expect(await screen.findByText('3001234567')).toBeInTheDocument();
    expect(screen.getAllByText('Llave')).toHaveLength(2);
    expect(screen.queryByText('Banco')).not.toBeInTheDocument();
    expect(screen.queryByText('Número de cuenta')).not.toBeInTheDocument();
  });
});
