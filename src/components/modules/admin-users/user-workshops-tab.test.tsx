import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserWorkshopsTab } from './user-workshops-tab';

import { DansshipAPI } from '@core/api';
import '@core/i18n';

const history = [
  {
    id: 'reg-direct',
    workshop_id: 'ws-open',
    workshop_name: 'Open Level',
    starts_at: '2026-09-20T15:00:00.000Z',
    status: 'confirmed' as const,
    source: 'direct' as const,
    combo_id: null,
    combo_name: null,
    purchase_id: 'p-direct',
    resolved_price: '55000.00',
    combo_workshops: [],
  },
  {
    id: 'reg-combo',
    workshop_id: 'ws-salsa',
    workshop_name: 'Salsa 1',
    starts_at: '2026-09-18T15:00:00.000Z',
    status: 'confirmed' as const,
    source: 'combo' as const,
    combo_id: 'combo-1',
    combo_name: 'Pack salsa',
    purchase_id: 'p-combo',
    resolved_price: '120000.00',
    combo_workshops: [
      {
        id: 'ws-salsa-2',
        name: 'Salsa 2',
        starts_at: '2026-09-19T15:00:00.000Z',
      },
    ],
  },
];

describe('UserWorkshopsTab', () => {
  beforeEach(() => {
    vi.spyOn(DansshipAPI.talleresAdmin, 'listUserRegistrations').mockResolvedValue({
      ok: true,
      data: history,
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists direct and combo registrations with siblings and no write actions', async () => {
    render(<UserWorkshopsTab userId='user-1' />);

    await waitFor(() => {
      expect(screen.getByText('Open Level')).toBeInTheDocument();
    });

    expect(screen.getByText('Salsa 1')).toBeInTheDocument();
    expect(screen.getByText('Directo')).toBeInTheDocument();
    expect(screen.getByText(/Combo: Pack salsa/)).toBeInTheDocument();
    expect(screen.getByText(/Salsa 2/)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
