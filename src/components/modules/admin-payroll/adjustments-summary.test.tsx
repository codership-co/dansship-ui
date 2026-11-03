import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { AdjustmentsSummary } from './adjustments-summary';

import '@core/i18n';

describe('AdjustmentsSummary', () => {
  afterEach(cleanup);

  it('shows both tiles with amounts and counts', () => {
    render(
      <AdjustmentsSummary
        summary={{
          pending_extras_amount: 30000,
          pending_extras_count: 2,
          advances_balance_amount: 80000,
          advances_balance_count: 1,
        }}
      />,
    );

    expect(screen.getByText('Adicionales pendientes')).toBeTruthy();
    expect(screen.getByText('Anticipos por descontar')).toBeTruthy();
    expect(screen.getByText('2 pendientes')).toBeTruthy();
    expect(screen.getByText('1 con saldo')).toBeTruthy();
    expect(screen.getByText(/30\.000/)).toBeTruthy();
    expect(screen.getByText(/80\.000/)).toBeTruthy();
  });
});
