import { cleanup, render, screen } from '@testing-library/react';
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
    issued_document: documents[0] ?? null,
    documents,
    can_generate: false,
    ...overrides,
  };
}

function compact(value: string) {
  return value.replace(/\s/g, '');
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
};

describe('PaymentMonthsList month total', () => {
  afterEach(() => {
    cleanup();
  });

  it('keeps a voided account visible and leaves it out of the month total', () => {
    const issued = document({ id: 'issued', status: 'issued', total_amount: 80000 });
    const voided = document({
      id: 'voided',
      status: 'voided',
      total_amount: 20000,
      void_reason: 'dato errado',
    });

    render(<PaymentMonthsList months={[month([issued, voided])]} {...actions} />);

    expect(screen.getAllByText(standalonePrice(80000))).toHaveLength(2);
    expect(screen.queryByText(standalonePrice(100000))).not.toBeInTheDocument();
    expect(screen.getAllByText('Cuenta 2 · Anulado · $ 20.000,00', { exact: false })).toHaveLength(2);
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
    expect(screen.getAllByText('Cuenta 1 · Anulado · $ 20.000,00', { exact: false })).toHaveLength(2);
    expect(screen.getAllByText('Anulado: dato errado')).toHaveLength(2);
  });
});
