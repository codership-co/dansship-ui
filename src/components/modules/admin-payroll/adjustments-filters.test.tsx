import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AdjustmentsFilters, getDefaultAdjustmentFilters } from './adjustments-filters';

import '@core/i18n';

describe('AdjustmentsFilters', () => {
  afterEach(cleanup);

  it('defaults to everything', () => {
    expect(getDefaultAdjustmentFilters()).toEqual({ q: '', type: 'all', status: 'all', month: 'all' });
  });

  it('is collapsed by default and expands on toggle', () => {
    render(<AdjustmentsFilters values={getDefaultAdjustmentFilters()} onChange={vi.fn()} />);

    expect(screen.queryByLabelText('Persona')).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));

    expect(screen.getByLabelText('Persona')).toBeTruthy();
  });

  it('summarises the active filters in the header row', () => {
    render(
      <AdjustmentsFilters
        values={{ q: 'ana', type: 'advance', status: 'pending', month: '2026-07' }}
        onChange={vi.fn()}
      />,
    );

    const summary = screen.getByRole('button', { name: /filtros/i }).textContent ?? '';

    expect(summary).toContain('Anticipo');
    expect(summary).toContain('Pendiente');
    expect(summary).toContain('Julio 2026');
    expect(summary).toContain('ana');
  });

  it('shows reset only when the values differ from the defaults and restores them', () => {
    const { unmount } = render(<AdjustmentsFilters values={getDefaultAdjustmentFilters()} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    expect(screen.queryByText('Restablecer filtros')).toBeNull();
    unmount();

    const onChange = vi.fn();

    render(<AdjustmentsFilters values={{ ...getDefaultAdjustmentFilters(), type: 'extra' }} onChange={onChange} />);
    fireEvent.click(screen.getByRole('button', { name: /filtros/i }));
    fireEvent.click(screen.getByText('Restablecer filtros'));

    expect(onChange).toHaveBeenCalledWith(getDefaultAdjustmentFilters());
  });
});
