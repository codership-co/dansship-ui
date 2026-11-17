import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PromotionCostCard } from './promotion-cost-card';

import { DansshipAPI, type PromotionCostReport } from '@core/api';
import '@core/i18n';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const report: PromotionCostReport = {
  totals: {
    purchases: 3,
    normal_price_total: '630000.00',
    collected: '441000.00',
    cash_collected: '401000.00',
    wallet_applied: '40000.00',
    given_up: '189000.00',
  },
  rows: [
    {
      promotion_code: 'BLACK_FRIDAY_2026',
      plan_id: 'a',
      plan_name: 'Floreciendo Impulso',
      purchases: 2,
      unit_normal_price: '230000.00',
      normal_price_total: '460000.00',
      collected: '322000.00',
      cash_collected: '282000.00',
      wallet_applied: '40000.00',
      given_up: '138000.00',
    },
    {
      promotion_code: 'BLACK_FRIDAY_2026',
      plan_id: 'b',
      plan_name: 'Explorando Impulso',
      purchases: 1,
      unit_normal_price: '170000.00',
      normal_price_total: '170000.00',
      collected: '119000.00',
      cash_collected: '119000.00',
      wallet_applied: '0.00',
      given_up: '51000.00',
    },
  ],
  refunded_gifts: { gift_count: 2, amount: '322000.00' },
  without_discount: { purchase_count: 5, collected: '3105000.00' },
};

describe('PromotionCostCard', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows the KPIs, one row per plan, the quarterly count and the refunded gifts apart', () => {
    render(<PromotionCostCard report={report} startDate='2026-11-26' endDate='2026-11-30' />);

    expect(screen.getByText('Costo de campaña')).toBeInTheDocument();
    expect(screen.getByText('Compras con descuento')).toBeInTheDocument();
    expect(screen.getByText('Floreciendo Impulso')).toBeInTheDocument();
    expect(screen.getByText('Explorando Impulso')).toBeInTheDocument();
    expect(screen.getByText('-$138.000')).toBeInTheDocument();
    expect(screen.getAllByText('-$189.000').length).toBeGreaterThan(0);
    expect(screen.getByText('2 · $322.000')).toBeInTheDocument();
    expect(screen.getByText('Trimestral (sin descuento)')).toBeInTheDocument();
  });

  it('omits the quarterly row when no quarterly purchase happened', () => {
    render(
      <PromotionCostCard
        report={{ ...report, without_discount: { purchase_count: 0, collected: '0.00' } }}
        startDate='2026-11-26'
        endDate='2026-11-30'
      />,
    );

    expect(screen.queryByText('Trimestral (sin descuento)')).not.toBeInTheDocument();
  });

  it('exports the CSV for the applied date range', async () => {
    const exportCsv = vi.spyOn(DansshipAPI.reportsAdmin, 'exportPromotionCostCsv').mockResolvedValue(undefined);

    render(<PromotionCostCard report={report} startDate='2026-11-26' endDate='2026-11-30' />);
    fireEvent.click(screen.getByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(exportCsv).toHaveBeenCalledWith('2026-11-26', '2026-11-30'));
  });
});
