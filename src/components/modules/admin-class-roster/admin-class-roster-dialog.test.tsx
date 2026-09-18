import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AdminClassRosterDialog } from './admin-class-roster-dialog';

import { DansshipAPI } from '@core/api';
import '@core/i18n';

const pairRoster = [
  {
    id: 'reg-1',
    user_id: 'user-1',
    display_name: 'Ana Pérez',
    email: 'ana@example.com',
    status: 'confirmed' as const,
    source: 'combo' as const,
    combo_id: 'combo-1',
    combo_name: 'Pack salsa',
    purchase_id: 'purchase-pair',
    created_at: '2026-09-01T15:00:00.000Z',
  },
  {
    id: 'reg-2',
    user_id: 'user-2',
    display_name: 'Luis Gómez',
    email: 'luis@example.com',
    status: 'confirmed' as const,
    source: 'combo' as const,
    combo_id: 'combo-1',
    combo_name: 'Pack salsa',
    purchase_id: 'purchase-pair',
    created_at: '2026-09-01T15:00:00.000Z',
  },
];

describe('AdminClassRosterDialog workshop mode', () => {
  beforeEach(() => {
    vi.spyOn(DansshipAPI.talleresAdmin, 'listRoster').mockResolvedValue({
      ok: true,
      data: pairRoster,
    } as never);
    vi.spyOn(DansshipAPI.bookingsAdmin, 'getAdminClassRoster');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows pair members together with combo origin and no class attendance controls', async () => {
    render(
      <AdminClassRosterDialog kind='workshop' id='workshop-1' title='Salsa 1' open onOpenChange={() => undefined} />,
    );

    await waitFor(() => {
      expect(screen.getByText('Ana Pérez')).toBeInTheDocument();
    });

    expect(screen.getByText('Luis Gómez')).toBeInTheDocument();
    expect(screen.getByText('Pareja')).toBeInTheDocument();
    expect(screen.getByText('Combo: Pack salsa')).toBeInTheDocument();
    expect(screen.queryByText('Asistió')).not.toBeInTheDocument();
    expect(DansshipAPI.bookingsAdmin.getAdminClassRoster).not.toHaveBeenCalled();
  });
});
