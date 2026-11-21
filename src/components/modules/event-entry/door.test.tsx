import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DoorScanResult } from './door-scan-result';
import { DoorSearch } from './door-search';
import { searchRow, validScan } from './entry.fixtures';

import '@core/i18n';

describe('door results', () => {
  afterEach(cleanup);

  it('VÁLIDO lets the validator mark the minor through the adult', () => {
    const onEnterMinor = vi.fn();

    render(<DoorScanResult result={validScan} onEnterMinor={onEnterMinor} onNext={vi.fn()} />);

    expect(screen.getByText('VÁLIDO')).toBeVisible();
    expect(screen.getByText('+ 1 menor')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Marcar ingreso de Sofía' }));
    expect(onEnterMinor).toHaveBeenCalledWith(validScan.person?.minors[0]);
  });

  it('YA USADO says when and who', () => {
    render(
      <DoorScanResult result={{ ...validScan, status: 'already_used' }} onEnterMinor={vi.fn()} onNext={vi.fn()} />,
    );

    expect(screen.getByText('YA USADO')).toBeVisible();
    expect(screen.getByText(/Ingresó a las \d\d:00 · validó Puerta/)).toBeVisible();
  });

  it('INVÁLIDO explains the reason', () => {
    render(
      <DoorScanResult
        result={{ status: 'invalid', reason: 'expired', person: null }}
        onEnterMinor={vi.fn()}
        onNext={vi.fn()}
      />,
    );

    expect(screen.getByText('INVÁLIDO')).toBeVisible();
    expect(screen.getByText('Código vencido. Pide que lo muestre de nuevo en vivo.')).toBeVisible();
  });
});

describe('door search', () => {
  afterEach(cleanup);

  function renderSearch(rows = [searchRow], props: Partial<Parameters<typeof DoorSearch>[0]> = {}) {
    const handlers = { onQuery: vi.fn(), onEnter: vi.fn(), onEnterMinor: vi.fn(), onDonation: vi.fn() };

    render(<DoorSearch rows={rows} isLoading={false} {...handlers} {...props} />);
    fireEvent.change(screen.getByRole('searchbox', { name: 'Nombre o correo' }), { target: { value: 'br' } });

    return handlers;
  }

  it('marks an entry by hand', () => {
    const { onEnter } = renderSearch();

    fireEvent.click(screen.getByRole('button', { name: 'Marcar ingreso' }));
    expect(onEnter).toHaveBeenCalledWith(searchRow);
  });

  it('keeps "Marcar ingreso" disabled while the payment is in review', () => {
    renderSearch([{ ...searchRow, can_enter: false, reason: 'payment_in_review' }]);

    expect(screen.getByText('Pago en revisión: todavía no puede ingresar.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Marcar ingreso' })).toBeDisabled();
  });

  it('shows who already entered and the artist donation', () => {
    const { onDonation } = renderSearch([
      {
        ...searchRow,
        kind: 'artist',
        entered_at: '2026-12-12T21:10:00Z',
        validated_by_name: 'Puerta',
        donation: { signup_id: 'signup-1', labels: ['Juguetes'], received_at: null },
      },
    ]);

    expect(screen.getByText(/Ya ingresó a las \d\d:10 · Puerta/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Donación recibida' }));
    expect(onDonation).toHaveBeenCalled();
  });

  it('every action is disabled offline', () => {
    renderSearch([searchRow], { disabled: true });

    expect(screen.getByRole('button', { name: 'Marcar ingreso' })).toBeDisabled();
  });
});
