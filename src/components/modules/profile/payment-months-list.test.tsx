import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PaymentMonthsList } from './payment-months-list';

import '@core/i18n';
import { formatPrice } from '@helpers';

import type { PaymentDocument, PaymentMonthSummary } from '@core/api';

function document(overrides: Partial<PaymentDocument>): PaymentDocument {
  return {
    id: 'doc',
    status: 'issued',
    total_amount: 0,
    void_reason: null,
    dispute_reason: null,
    ...overrides,
  } as PaymentDocument;
}

function month(documents: Array<PaymentDocument>, overrides: Partial<PaymentMonthSummary> = {}): PaymentMonthSummary {
  return {
    year: 2026,
    month: 7,
    status: 'paid',
    missing_requirements: [],
    social_security: null,
    issued_document: documents[0] ?? null,
    documents,
    can_generate: false,
    ...overrides,
  };
}

function compact(value: string) {
  return value.replace(/\s/g, '');
}

function accountLine(index: number, status: string, amount: number) {
  const expected = compact(`Cuenta ${index} · ${status} · ${formatPrice(amount, 'COP')}`);

  return (_content: string, node: Element | null) =>
    node?.childElementCount === 0 && compact(node.textContent ?? '') === expected;
}

function standalonePrice(amount: number) {
  const expected = compact(formatPrice(amount, 'COP'));

  return (_content: string, node: Element | null) =>
    node?.childElementCount === 0 && compact(node.textContent ?? '') === expected;
}

const actions = {
  isGenerating: false,
  isConfirming: false,
  isOpeningDocument: false,
  onGenerate: vi.fn(),
  onConfirm: vi.fn(),
  onDispute: vi.fn(),
  onDownload: vi.fn(),
  isUploadingProof: false,
  isOpeningProof: false,
  onUploadProof: vi.fn(),
  onViewProof: vi.fn(),
};

describe('PaymentMonthsList month total', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps a voided account visible and leaves it out of the month total', () => {
    const issued = document({
      id: 'issued',
      status: 'issued',
      total_amount: 80000,
    });
    const voided = document({
      id: 'voided',
      status: 'voided',
      total_amount: 20000,
      void_reason: 'dato errado',
    });

    render(<PaymentMonthsList months={[month([issued, voided])]} {...actions} />);

    expect(screen.getAllByText(standalonePrice(80000))).toHaveLength(2);
    expect(screen.queryByText(standalonePrice(100000))).not.toBeInTheDocument();
    expect(screen.getAllByText(accountLine(2, 'Anulado', 20000))).toHaveLength(2);
    expect(screen.getAllByText('Anulado: dato errado')).toHaveLength(2);
  });

  it('shows an empty total when every account in the month is voided', () => {
    const voided = document({
      id: 'voided',
      status: 'voided',
      total_amount: 20000,
      void_reason: 'dato errado',
    });

    render(<PaymentMonthsList months={[month([voided])]} {...actions} />);

    expect(screen.getAllByText('—')).toHaveLength(2);
    expect(screen.getAllByText(accountLine(1, 'Anulado', 20000))).toHaveLength(2);
    expect(screen.getAllByText('Anulado: dato errado')).toHaveLength(2);
  });

  it('shows the mixed label and the partial-day line', () => {
    const mixed = document({
      id: 'mixed',
      status: 'issued',
      payment_type: 'mixed',
      total_amount: 1100000,
      calculation_snapshot: {
        components: [
          {
            payment_type: 'fixed_amount',
            covered_start: '2026-11-01',
            covered_end: '2026-11-15',
            days_covered: 15,
            days_in_month: 30,
          },
        ],
      },
    });

    render(<PaymentMonthsList months={[month([mixed], { month: 11 })]} {...actions} />);

    expect(screen.getAllByText('Fijo y por horas')).toHaveLength(2);
    expect(screen.getAllByText('Período cubierto: del 1 al 15 de noviembre de 2026 (15 de 30 días).')).toHaveLength(2);
  });

  it('shows neither the mixed label nor a partial-day line for a full month', () => {
    const full = document({
      id: 'full',
      status: 'paid',
      payment_type: 'fixed_amount',
      total_amount: 1800000,
      calculation_snapshot: {
        components: [
          {
            payment_type: 'fixed_amount',
            covered_start: '2026-07-01',
            covered_end: '2026-07-31',
            days_covered: 31,
            days_in_month: 31,
          },
        ],
      },
    });

    render(<PaymentMonthsList months={[month([full])]} {...actions} />);

    expect(screen.queryByText('Fijo y por horas')).not.toBeInTheDocument();
    expect(screen.queryByText(/Período cubierto/)).not.toBeInTheDocument();
  });
});

describe('PaymentMonthsList social security proof', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  const proof = {
    year: 2026,
    month: 7,
    required: true,
    uploaded: false,
    proof_year: 2026,
    proof_month: 7,
  };

  it('shows nothing about the planilla when the team did not ask for it', () => {
    render(<PaymentMonthsList months={[month([], { status: 'available' })]} {...actions} />);

    expect(screen.queryByText(/Planilla de seguridad social/)).not.toBeInTheDocument();
  });

  it('shows nothing once the request was withdrawn', () => {
    render(
      <PaymentMonthsList
        months={[
          month([], {
            status: 'available',
            social_security: { ...proof, required: false },
          }),
        ]}
        {...actions}
      />,
    );

    expect(screen.queryByText(/Planilla de seguridad social/)).not.toBeInTheDocument();
  });

  it('asks for the planilla of the month and uploads the chosen file', () => {
    const summary = month([], {
      status: 'blocked',
      social_security: proof,
      missing_requirements: ['social_security'],
    });
    const { container } = render(<PaymentMonthsList months={[summary]} {...actions} />);

    expect(screen.getByText('Planilla de seguridad social de Julio 2026')).toBeInTheDocument();

    const file = new File(['x'], 'planilla.pdf', { type: 'application/pdf' });

    fireEvent.change(container.querySelector('input[type=file]') as HTMLInputElement, { target: { files: [file] } });

    expect(actions.onUploadProof).toHaveBeenCalledWith(summary, file);
  });

  it('labels the planilla with the month it covers, not the billed one', () => {
    render(
      <PaymentMonthsList
        months={[
          month([], {
            status: 'blocked',
            social_security: { ...proof, proof_month: 6 },
          }),
        ]}
        {...actions}
      />,
    );

    expect(screen.getByText('Planilla de seguridad social de Junio 2026')).toBeInTheDocument();
  });

  it('lets the person open an uploaded planilla', () => {
    const summary = month([], {
      status: 'available',
      social_security: { ...proof, uploaded: true },
    });

    render(<PaymentMonthsList months={[summary]} {...actions} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ver archivo' }));

    expect(actions.onViewProof).toHaveBeenCalledWith(summary);
  });
});
