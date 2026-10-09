import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserEventsTab } from './user-events-tab';

import { DansshipAPI } from '@core/api';
import '@core/i18n';

const history = [
  {
    id: 'reg-direct',
    event_id: 'ws-open',
    event_name: 'Open Level',
    starts_at: '2026-09-20T15:00:00.000Z',
    status: 'confirmed' as const,
    source: 'direct' as const,
    combo_id: null,
    combo_name: null,
    purchase_id: 'p-direct',
    resolved_price: '55000.00',
    combo_events: [],
  },
  {
    id: 'reg-combo',
    event_id: 'ws-salsa',
    event_name: 'Salsa 1',
    starts_at: '2026-09-18T15:00:00.000Z',
    status: 'confirmed' as const,
    source: 'combo' as const,
    combo_id: 'combo-1',
    combo_name: 'Pack salsa',
    purchase_id: 'p-combo',
    resolved_price: '120000.00',
    combo_events: [
      {
        id: 'ws-salsa-2',
        name: 'Salsa 2',
        starts_at: '2026-09-19T15:00:00.000Z',
      },
    ],
  },
];

describe('UserEventsTab', () => {
  beforeEach(() => {
    vi.spyOn(DansshipAPI.eventosAdmin, 'listUserRegistrations').mockResolvedValue({
      ok: true,
      data: history,
    } as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lists direct and combo registrations with siblings and no write actions', async () => {
    render(<UserEventsTab userId='user-1' />);

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
