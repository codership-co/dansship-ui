import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { EntryPassCard } from './entry-pass-card';
import { EntryQrScreen } from './entry-qr-screen';
import { entryPass } from './entry.fixtures';
import { nextPollDelay } from './use-entry-code';

import { DansshipAPIError } from '@core/api';
import '@core/i18n';

vi.mock('qrcode', () => ({ default: { toCanvas: vi.fn().mockResolvedValue(undefined) } }));

describe('EntryPassCard', () => {
  afterEach(cleanup);

  it('shows the live code with the ring, holder and minors, never a price', () => {
    const { container } = render(<EntryPassCard pass={entryPass} fraction={0.5} isOnline />);

    expect(screen.getByText('Ana Gómez')).toBeVisible();
    expect(screen.getByText('Entran contigo: Sofía (menores, sin QR)')).toBeVisible();
    expect(screen.getByText('El código se actualiza solo')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Código QR de tu entrada' })).not.toHaveClass('opacity-15');
    expect(container.textContent).not.toMatch(/\$|COP/);
  });

  it('offline dims the code and shows the email to be found by', () => {
    render(<EntryPassCard pass={entryPass} fraction={0.5} isOnline={false} />);

    expect(screen.getByText('Sin conexión')).toBeVisible();
    expect(screen.getByText('ana@example.com')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Código QR de tu entrada' })).toHaveClass('opacity-15');
    expect(screen.queryByText('El código se actualiza solo')).toBeNull();
  });

  it('dims the code and warns when the last refresh failed while online', () => {
    render(<EntryPassCard pass={entryPass} fraction={0.5} isOnline isStale />);

    expect(screen.getByText('No pudimos actualizar el código')).toBeVisible();
    expect(screen.getByText('ana@example.com')).toBeVisible();
    expect(screen.getByRole('img', { name: 'Código QR de tu entrada' })).toHaveClass('opacity-15');
  });

  it('says when the entry was recorded', () => {
    render(<EntryPassCard pass={{ ...entryPass, entered_at: '2026-12-12T21:05:00Z' }} fraction={1} isOnline />);

    expect(screen.getByRole('status')).toHaveTextContent(/Ingreso registrado a las \d\d:05/);
  });
});

describe('EntryQrScreen', () => {
  afterEach(cleanup);

  it('loads the code and shows the pass', async () => {
    const load = vi.fn().mockResolvedValue({ ok: true, data: entryPass });

    render(<EntryQrScreen load={load} cacheKey='token' />);

    expect(await screen.findByText('Ana Gómez')).toBeVisible();
    expect(load).toHaveBeenCalled();
  });

  it('shows a final message for a replaced link and stops polling', async () => {
    const error = new DansshipAPIError({ error_code: 'ENTRY_LINK_REVOKED' } as never, 410);
    const load = vi.fn().mockResolvedValue({ ok: false, error });

    render(<EntryQrScreen load={load} cacheKey='token' />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Este enlace ya no es válido');
    await waitFor(() => expect(load).toHaveBeenCalledTimes(1));
  });

  it('polls right after the code rotates and at least every refresh period', () => {
    const now = new Date('2026-12-12T20:00:00Z').getTime();

    expect(nextPollDelay(entryPass, now, 0)).toBe(10_000);
    expect(nextPollDelay(entryPass, now + 8_000, 0)).toBe(7_400);
    expect(nextPollDelay(null, now, 0)).toBe(10_000);
  });
});
