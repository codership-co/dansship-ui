import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { SecureAdminPayrollPage } from './payroll.page';

import '@core/i18n';
import { PERMISSION } from '@core/permissions';

let granted: Array<string> = [];

vi.mock('@contexts', async importOriginal => {
  const actual = await importOriginal<typeof import('@contexts')>();

  return {
    ...actual,
    SecurityGuard: (Component: unknown) => Component,
    useOrPermissions: (permissions: Array<string>) => permissions.some(permission => granted.includes(permission)),
  };
});

vi.mock('@components/modules', () => ({
  PayrollLedger: () => <div>ledger</div>,
  PaymentAssignmentsPanel: () => <div>assignments</div>,
  PayrollAdjustmentsPanel: () => <div>adjustments</div>,
}));

function renderPage(url = '/admin/payroll') {
  render(
    <MemoryRouter initialEntries={[url]}>
      <SecureAdminPayrollPage />
    </MemoryRouter>,
  );
}

describe('PayrollPage tabs', () => {
  afterEach(cleanup);

  it('hides the adjustments tab without the permission', () => {
    granted = [PERMISSION.PAYROLL_READ, PERMISSION.INSTRUCTOR_PAY_RATE_MANAGE];
    renderPage();

    expect(screen.getByRole('tab', { name: 'Pagos' })).toBeTruthy();
    expect(screen.getByRole('tab', { name: 'Vinculación de pago' })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: 'Adicionales y anticipos' })).toBeNull();
  });

  it('opens with only the adjustments permission and shows just that tab', () => {
    granted = [PERMISSION.PAYROLL_ADJUSTMENTS_MANAGE];
    renderPage();

    expect(screen.getAllByRole('tab')).toHaveLength(1);
    expect(screen.getByText('adjustments')).toBeTruthy();
  });

  it('reads the tab from the URL', () => {
    granted = [PERMISSION.PAYROLL_READ, PERMISSION.PAYROLL_ADJUSTMENTS_MANAGE];
    renderPage('/admin/payroll?tab=adjustments');

    expect(screen.getByText('adjustments')).toBeTruthy();
    expect(screen.queryByText('ledger')).toBeNull();
  });

  it('falls back to the first allowed tab when the URL asks for one the user cannot see', () => {
    granted = [PERMISSION.PAYROLL_READ];
    renderPage('/admin/payroll?tab=adjustments');

    expect(screen.getByText('ledger')).toBeTruthy();
    expect(screen.queryByText('adjustments')).toBeNull();
  });
});
