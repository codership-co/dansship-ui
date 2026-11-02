import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PayrollFilters, getDefaultPayrollFilters } from './payroll-filters';

import '@core/i18n';

describe('getDefaultPayrollFilters', () => {
  it('starts on the first day of the previous month and ends today in Bogotá', () => {
    // 2026-11-01 03:00 UTC is still 31 Oct in Bogotá.
    const defaults = getDefaultPayrollFilters(new Date('2026-11-01T03:00:00Z'));

    expect(defaults).toEqual({ q: '', status: 'all', dateField: 'issued', from: '2026-09-01', to: '2026-10-31' });
  });

  it('wraps the previous month across years', () => {
    expect(getDefaultPayrollFilters(new Date('2027-01-15T12:00:00Z')).from).toBe('2026-12-01');
  });
});

describe('PayrollFilters', () => {
  afterEach(cleanup);

  const renderFilters = (values = getDefaultPayrollFilters(), onChange = vi.fn(), canExport = true) => {
    render(
      <PayrollFilters
        values={values}
        onChange={onChange}
        onExport={vi.fn()}
        canExport={canExport}
        isExporting={false}
      />,
    );

    return onChange;
  };

  it('is collapsed by default and expands on toggle', () => {
    renderFilters();

    expect(screen.queryByLabelText('Persona')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));

    expect(screen.getByLabelText('Persona')).toBeTruthy();
  });

  it('shows reset only when values differ from the defaults', () => {
    const { unmount } = render(
      <PayrollFilters
        values={getDefaultPayrollFilters()}
        onChange={vi.fn()}
        onExport={vi.fn()}
        canExport
        isExporting={false}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    expect(screen.queryByText('Restablecer filtros')).toBeNull();
    unmount();

    const onChange = renderFilters({ ...getDefaultPayrollFilters(), status: 'paid' });

    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    fireEvent.click(screen.getByText('Restablecer filtros'));

    expect(onChange).toHaveBeenCalledWith(getDefaultPayrollFilters());
  });

  it('disables the export when the list is empty', () => {
    renderFilters(getDefaultPayrollFilters(), vi.fn(), false);

    expect((screen.getByText('Descargar CSV').closest('button') as HTMLButtonElement).disabled).toBe(true);
  });
});
