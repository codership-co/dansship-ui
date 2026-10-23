import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DANSSHIP_ERROR_CODE, DansshipAPI, DansshipAPIError, type DansshipResponseError } from '@core/api';
import '@core/i18n';
import { HalloweenPage } from '@pages/halloween.page';

const outcomes = [
  { code: 'DISCOUNT_10', weight: 40, label_key: 'halloween:prizes.discount', percent: 10 },
  { code: 'DISCOUNT_15', weight: 30, label_key: 'halloween:prizes.discount', percent: 15 },
  { code: 'DISCOUNT_20', weight: 10, label_key: 'halloween:prizes.discount', percent: 20 },
  { code: 'FREE_CLASS', weight: 20, label_key: 'halloween:prizes.freeClass', percent: null },
];

const student = {
  id: 'student-1',
  full_name: 'Ana Ruiz',
  email: 'ana@example.com',
};

function ok<T>(data: T) {
  return { ok: true as const, data, status: 200, error: null };
}

function apiError(code: DANSSHIP_ERROR_CODE) {
  return new DansshipAPIError(
    {
      error_code: code,
      category: 'CONFLICT',
      message: code,
      status: 409,
      timestamp: '',
      path: '/admin/halloween/spins',
      details: { next_action: '', resend_verification_endpoint: '' },
      request_id: null,
      trace_id: null,
    } as DansshipResponseError,
    409,
  );
}

describe('HalloweenPage', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.spyOn(DansshipAPI.halloweenAdmin, 'config').mockResolvedValue(
      ok({ validity_days: 30, window_open: true, outcomes }),
    );
    vi.spyOn(DansshipAPI.halloweenAdmin, 'status').mockResolvedValue(ok({ spun: false, result: null }));
    vi.spyOn(DansshipAPI.halloweenAdmin, 'spin').mockResolvedValue(
      ok({
        outcome: 'DISCOUNT_15',
        label_key: 'halloween:prizes.discount',
        percent: 15,
        expires_at: '2026-11-22T04:59:59.999999Z',
        spin_id: 'spin-1',
        weights: { DISCOUNT_10: 40, DISCOUNT_15: 30, DISCOUNT_20: 10, FREE_CLASS: 20 },
      }),
    );
    vi.spyOn(DansshipAPI.usersAdmin, 'search').mockResolvedValue(
      ok({ items: [student], total: 1, limit: 8, offset: 0 }),
    );
  });

  it('draws slices from the wheel config', async () => {
    render(<HalloweenPage />);

    expect(await screen.findAllByText('10%')).toHaveLength(4);
    expect(screen.getAllByText('15%')).toHaveLength(3);
    expect(screen.getAllByText('20%')).toHaveLength(1);
    expect(screen.getAllByText('descuento')).toHaveLength(8);
    expect(screen.getAllByText('1 clase')).toHaveLength(2);
    expect(screen.getAllByText('gratis')).toHaveLength(2);
  });

  it('disables Girar when the student has already spun', async () => {
    vi.mocked(DansshipAPI.halloweenAdmin.status).mockResolvedValue(
      ok({
        spun: true,
        result: {
          outcome: 'FREE_CLASS',
          label_key: 'halloween:prizes.freeClass',
          percent: null,
          expires_at: '2026-11-22T04:59:59.999999Z',
          spin_id: 'spin-1',
          weights: {},
        },
      }),
    );
    render(<HalloweenPage />);
    fireEvent.change(screen.getByLabelText('Estudiante'), { target: { value: 'Ana' } });

    expect(await screen.findByRole('button', { name: /Ana Ruiz/ }, { timeout: 2000 })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Ana Ruiz/ }));

    expect(await screen.findByRole('heading', { name: '¡Felicitaciones!' })).toBeInTheDocument();
    expect(screen.getByText('Entregado a Ana Ruiz')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Girar', hidden: true })).toBeDisabled();
    expect(DansshipAPI.halloweenAdmin.spin).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente persona' }));
    expect(screen.getByLabelText('Estudiante')).toHaveValue('');
  });

  it('does not rotate the wheel when the spin request fails', async () => {
    vi.mocked(DansshipAPI.halloweenAdmin.spin).mockResolvedValue({
      ok: false,
      data: null,
      status: 409,
      error: apiError(DANSSHIP_ERROR_CODE.HALLOWEEN_WHEEL_CLOSED),
    });
    render(<HalloweenPage />);
    fireEvent.change(screen.getByLabelText('Estudiante'), { target: { value: 'Ana' } });
    fireEvent.click(await screen.findByRole('button', { name: /Ana Ruiz/ }, { timeout: 2000 }));

    const spin = await screen.findByRole('button', { name: 'Girar' });

    await waitFor(() => expect(spin).toBeEnabled());
    const wheel = screen.getByTestId('halloween-wheel');

    expect(wheel).toHaveStyle({ transform: 'rotate(0deg)' });
    fireEvent.click(spin);
    await screen.findByRole('alert');
    expect(wheel).toHaveStyle({ transform: 'rotate(0deg)' });
    expect(screen.queryByText('Entregado a Ana Ruiz')).not.toBeInTheDocument();
  });
});
