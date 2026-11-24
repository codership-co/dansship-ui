import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventoLanding } from './evento-landing';

import { landingType } from '@components/modules/event-participation/participation.fixtures';
import {
  DANSSHIP_ERROR_CATEGORY,
  DANSSHIP_ERROR_CODE,
  DansshipAPI,
  DansshipAPIError,
  type EventLanding,
} from '@core/api';
import '@core/i18n';

vi.mock('@contexts', () => ({
  useAuth: () => ({ isAuthenticated: false, ready: true }),
  useOrPermissions: () => false,
}));

const landing = {
  kind: 'event',
  slug: 'video-class-halloween',
  name: 'Video class Halloween',
  price_rows: [],
  components: [],
} as unknown as EventLanding;

function failedLanding(status: number, message: string) {
  const body = {
    category: status === 404 ? DANSSHIP_ERROR_CATEGORY.RESOURCE_NOT_FOUND : DANSSHIP_ERROR_CATEGORY.SYSTEM_ERROR,
    error_code: status === 404 ? DANSSHIP_ERROR_CODE.RESOURCE_NOT_FOUND : DANSSHIP_ERROR_CODE.HTTP_ERROR,
    message,
    status,
    timestamp: '2026-10-22T00:00:00.000Z',
    path: '/events/by-slug/video-class-halloween',
    details: {
      next_action: '',
      resend_verification_endpoint: '',
    },
    request_id: null,
    trace_id: null,
  };

  return {
    ok: false as const,
    data: null,
    status,
    error: new DansshipAPIError(body, status, message),
  };
}

function renderLanding() {
  return render(
    <MemoryRouter>
      <EventoLanding slug='video-class-halloween' preview={false} />
    </MemoryRouter>,
  );
}

describe('EventoLanding', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.eventos, 'getBySlug');
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('offers a retry when the landing request fails', async () => {
    vi.mocked(DansshipAPI.eventos.getBySlug).mockResolvedValue(failedLanding(0, 'Load failed'));

    renderLanding();

    expect(
      await screen.findByText('No pudimos cargar este evento. Revisa tu conexión e intenta de nuevo.'),
    ).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Intentar de nuevo' }));

    await waitFor(() => {
      expect(DansshipAPI.eventos.getBySlug).toHaveBeenCalledTimes(2);
    });
  });

  it('shows the event after a failed load succeeds on retry', async () => {
    vi.mocked(DansshipAPI.eventos.getBySlug)
      .mockResolvedValueOnce(failedLanding(0, 'Load failed'))
      .mockResolvedValueOnce({
        ok: true,
        data: landing,
        status: 200,
        error: null,
      });

    renderLanding();

    fireEvent.click(await screen.findByRole('button', { name: 'Intentar de nuevo' }));

    expect(await screen.findByRole('heading', { name: 'Video class Halloween' })).toBeVisible();
  });

  it('keeps a missing event as not found', async () => {
    vi.mocked(DansshipAPI.eventos.getBySlug).mockResolvedValue(failedLanding(404, 'Event not found'));

    renderLanding();

    expect(await screen.findByText('No encontramos este evento.')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Intentar de nuevo' })).toBeNull();
  });

  it('shows one card per active type with its copy and display price, with no per-type link', async () => {
    vi.mocked(DansshipAPI.eventos.getBySlug).mockResolvedValue({
      ok: true,
      data: {
        ...landing,
        type: 'configured',
        participation: {
          remaining: 100,
          capacity: 100,
          terms: null,
          types: [
            landingType({
              id: 'artists',
              name: 'Artistas',
              card_copy: {
                title: '¿Te vas a presentar?',
                button_text: 'Inscribirme como artista',
                text: null,
                closing_message: null,
              },
            }),
            landingType({
              id: 'guests',
              name: 'Invitados',
              registration_options: [{ kind: 'multi_ticket' }],
              card_copy: {
                title: '¿Vienes a ver la muestra?',
                button_text: 'Comprar entradas',
                text: null,
                closing_message: null,
              },
              fees: [
                { label: 'Comunidad Dansship', price: '5000' },
                { label: 'Público general', price: '10000' },
              ],
              minors: { allowed: true, max_age: 12, per_adult_max: 3, price: '0' },
            }),
          ],
        },
      } as EventLanding,
      status: 200,
      error: null,
    });

    renderLanding();

    expect(await screen.findByRole('heading', { name: '¿Te vas a presentar?' })).toBeVisible();
    expect(screen.getByRole('heading', { name: '¿Vienes a ver la muestra?' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Inscribirme como artista' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Comprar entradas' })).toBeEnabled();
    expect(screen.getByText('Comunidad Dansship')).toBeVisible();
    expect(screen.getByText('Menores de 12 años (con un adulto)')).toBeVisible();
    expect(screen.getByText('Gratis')).toBeVisible();
    expect(DansshipAPI.eventos.getBySlug).toHaveBeenCalledWith('video-class-halloween');
  });

  it('keeps the purchase button on events without participant types', async () => {
    vi.mocked(DansshipAPI.eventos.getBySlug).mockResolvedValue({ ok: true, data: landing, status: 200, error: null });

    renderLanding();

    expect(await screen.findByRole('heading', { name: 'Video class Halloween' })).toBeVisible();
    expect(screen.queryByRole('heading', { name: '¿Te vas a presentar?' })).toBeNull();
    expect(screen.getAllByRole('button').length).toBeGreaterThan(0);
  });

  it('labels the place «Salón» for a studio room and «Lugar» elsewhere', async () => {
    vi.mocked(DansshipAPI.eventos.getBySlug).mockResolvedValue({
      ok: true,
      data: { ...landing, room_name: 'Salón 1', external_location: null },
      status: 200,
      error: null,
    });
    renderLanding();

    expect(await screen.findByText('Salón 1')).toBeVisible();
    expect(screen.getByText('Salón')).toBeVisible();

    cleanup();
    vi.mocked(DansshipAPI.eventos.getBySlug).mockResolvedValue({
      ok: true,
      data: { ...landing, room_name: null, external_location: 'Teatro Colsubsidio' },
      status: 200,
      error: null,
    });
    renderLanding();

    expect(await screen.findByText('Teatro Colsubsidio')).toBeVisible();
    expect(screen.getByText('Lugar')).toBeVisible();
    expect(screen.queryByText('Salón')).toBeNull();
  });

  it('shows a closed type with its closing message and "Escríbenos"', async () => {
    vi.mocked(DansshipAPI.eventos.getBySlug).mockResolvedValue({
      ok: true,
      data: {
        ...landing,
        type: 'configured',
        participation: {
          remaining: 40,
          capacity: 100,
          terms: null,
          types: [
            landingType({
              id: 'guests',
              name: 'Invitados',
              state: 'closed',
              card_copy: {
                title: null,
                button_text: 'Comprar entradas',
                text: null,
                closing_message: 'La venta cerró el jueves.',
              },
              fees: [{ label: 'Entrada general', price: '10000' }],
            }),
          ],
        },
      } as EventLanding,
      status: 200,
      error: null,
    });

    renderLanding();

    expect(await screen.findByText('La venta cerró el jueves.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Escríbenos' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Comprar entradas' })).toBeNull();
  });
});
