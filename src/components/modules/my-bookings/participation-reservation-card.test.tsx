import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { ParticipationReservationCard } from './participation-reservation-card';

import '@core/i18n';

import type { MyParticipationRow } from '@core/api';

const row: MyParticipationRow = {
  kind: 'signup',
  repayable: false,
  id: 'signup-1',
  signup_id: 'signup-1',
  event_id: 'event-1',
  event_name: 'Clausura Dansship',
  event_slug: 'clausura-dansship',
  starts_at: '2026-12-12T20:30:00Z',
  ends_at: '2026-12-12T23:30:00Z',
  place_label: 'Estudio Dansship',
  participant_type_name: 'Artistas',
  status: 'in_review',
  holder_name: 'Raíces',
  minors: [],
  editable: true,
  purchase_id: null,
  payment_intent_id: null,
  payment_status: null,
  person_id: 'person-0',
  has_entry_pass: false,
  entered_at: null,
  is_attendee: false,
  issues_entry_qr: false,
};

describe('ParticipationReservationCard', () => {
  afterEach(cleanup);

  it('shows the artist registration with its status', () => {
    render(
      <MemoryRouter>
        <ParticipationReservationCard row={row} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Clausura Dansship')).toBeVisible();
    expect(screen.getByText('Presentación: Raíces')).toBeVisible();
    expect(screen.getByText('En revisión')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Ver inscripción' })).toBeVisible();
  });

  it('says "Te presentaste" in the history after an approved act', () => {
    render(
      <MemoryRouter>
        <ParticipationReservationCard row={{ ...row, status: 'approved' }} tone='history' />
      </MemoryRouter>,
    );

    expect(screen.getByText('Te presentaste')).toBeVisible();
  });

  it('shows a rejected ticket with its minors and "Volver a pagar"', () => {
    render(
      <MemoryRouter>
        <ParticipationReservationCard
          row={{
            ...row,
            kind: 'ticket',
            id: 'person-1',
            status: 'payment_rejected',
            holder_name: 'Andrés',
            minors: ['Sofía'],
            repayable: true,
            purchase_id: 'purchase-1',
          }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByText(/Entrada de Andrés/)).toBeVisible();
    expect(screen.getByText('Entra con: Sofía (menor, sin QR)')).toBeVisible();
    expect(screen.getByText('Pago rechazado')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Volver a pagar' })).toBeVisible();
  });

  it('shows "Lista" once the payment is approved', () => {
    render(
      <MemoryRouter>
        <ParticipationReservationCard row={{ ...row, kind: 'ticket', status: 'confirmed', holder_name: 'Laura' }} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Lista')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Volver a pagar' })).toBeNull();
  });

  it('offers "Ver QR" only while the ticket has an active pass', () => {
    const ticket = { ...row, kind: 'ticket' as const, status: 'confirmed' as const, issues_entry_qr: true };
    const { rerender } = render(
      <MemoryRouter>
        <ParticipationReservationCard row={{ ...ticket, has_entry_pass: false }} />
      </MemoryRouter>,
    );

    expect(screen.queryByRole('button', { name: 'Ver QR' })).toBeNull();

    rerender(
      <MemoryRouter>
        <ParticipationReservationCard row={{ ...ticket, has_entry_pass: true }} />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Ver QR' })).toBeVisible();
  });

  it('offers "Ver mi entrada" to an approved artist', () => {
    render(
      <MemoryRouter>
        <ParticipationReservationCard
          row={{ ...row, status: 'approved', issues_entry_qr: true, has_entry_pass: true }}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: 'Ver mi entrada' })).toBeVisible();
  });

  it.each([
    [{ kind: 'ticket', status: 'confirmed', entered_at: '2026-12-12T21:05:00Z' }, /Usada · \d\d:05/],
    [{ kind: 'ticket', status: 'confirmed', entered_at: null }, /No usada/],
    [{ kind: 'signup', status: 'approved', entered_at: '2026-12-12T21:05:00Z' }, /Te presentaste/],
    [{ kind: 'signup', status: 'approved', entered_at: null }, /Inscripción aprobada/],
  ] as const)('shows the history state %o', (change, text) => {
    render(
      <MemoryRouter>
        <ParticipationReservationCard row={{ ...row, ...change, issues_entry_qr: true }} tone='history' />
      </MemoryRouter>,
    );

    expect(screen.getByText(text)).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Ver QR' })).toBeNull();
  });
});
