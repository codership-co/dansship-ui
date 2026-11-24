import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { LegacyEventAccessPanel } from './legacy-event-access-panel';

import { DansshipAPI, type EventAdmin } from '@core/api';
import '@core/i18n';

const legacyLinkEvent = {
  id: 'event-1',
  type: 'recital',
  visibility: 'link_only',
  access_token: 'token-1',
} as EventAdmin;

describe('LegacyEventAccessPanel', () => {
  beforeEach(() => {
    vi.spyOn(DansshipAPI.eventosAdmin, 'listInvites').mockResolvedValue({ ok: true, data: [] } as never);
    Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows an inherited link read-only: it can be copied, not rotated', async () => {
    render(<LegacyEventAccessPanel event={legacyLinkEvent} />);

    expect(screen.getAllByText('Con enlace (heredado)').length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: /Cambiar enlace|Rotar/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Copiar enlace' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${window.location.origin}/eventos/acceso/token-1`);
    });
  });

  it('switches a legacy event to Privado and never offers the link to others', async () => {
    const setVisibility = vi
      .spyOn(DansshipAPI.eventosAdmin, 'setVisibility')
      .mockResolvedValue({ ok: true, data: { ...legacyLinkEvent, visibility: 'invite_only' } } as never);

    render(<LegacyEventAccessPanel event={{ ...legacyLinkEvent, visibility: 'public', access_token: null }} />);

    expect(screen.queryByRole('option', { name: 'Con enlace (heredado)' })).toBeNull();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'invite_only' } });

    await waitFor(() => expect(setVisibility).toHaveBeenCalledWith('event-1', 'invite_only'));
  });
});
