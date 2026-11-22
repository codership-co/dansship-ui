import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ParticipationPeopleTable } from './participation-people-table';
import { groupForPrint, ParticipationPrintList, PRINT_BODY_CLASS } from './participation-print-list';
import { ParticipationSummaryPanel } from './participation-summary';

import { DansshipAPI, type ParticipationPeople, type ParticipationPersonRow } from '@core/api';
import '@core/i18n';

const ok = <T,>(data: T) => ({ ok: true, data, status: 200, error: null }) as never;

function person(overrides: Partial<ParticipationPersonRow>): ParticipationPersonRow {
  return {
    person_id: 'p',
    signup_id: 's1',
    participant_type_id: 'guests',
    participant_type_name: 'Invitados',
    role: 'ticket',
    is_minor: false,
    full_name: 'Persona',
    email: 'persona@example.com',
    phone: null,
    age: null,
    status: 'confirmed',
    signup_title: null,
    leader_name: null,
    attached_to_name: null,
    answers: {},
    donations: [],
    donation_received: false,
    member_count: 0,
    minor_count: 0,
    buyer_name: null,
    fee_label: 'Entrada general',
    amount: 10000,
    payment_intent_id: null,
    payment_status: null,
    entered_at: null,
    validated_by_name: null,
    has_entry_pass: true,
    attached_to_person_id: null,
    announcement_copy: null,
    ...overrides,
  };
}

const zoe = person({ person_id: 'zoe', full_name: 'Zoe' });
const ana = person({ person_id: 'ana', full_name: 'ana' });
const sofia = person({
  person_id: 'sofia',
  full_name: 'Sofía',
  is_minor: true,
  email: null,
  attached_to_person_id: 'ana',
});
const bruno = person({ person_id: 'bruno', full_name: 'Bruno', status: 'pending_payment' });

describe('printed list', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.classList.remove(PRINT_BODY_CLASS);
  });

  it('orders adults alphabetically with their minors under them', () => {
    const entries = groupForPrint([zoe, sofia, bruno, ana]);

    expect(entries.map(entry => entry.person.full_name)).toEqual(['ana', 'Bruno', 'Zoe']);
    expect(entries[0].minors.map(minor => minor.full_name)).toEqual(['Sofía']);
  });

  it('keeps a minor whose adult is filtered out as its own row', () => {
    expect(groupForPrint([sofia]).map(entry => entry.person.full_name)).toEqual(['Sofía']);
  });

  it('renders a confidential A4 list in a print-only portal', async () => {
    render(
      <ParticipationPrintList
        rows={[zoe, sofia, ana]}
        columns={[]}
        kind='tickets'
        eventName='Clausura Dansship'
        eventStartsAt='2026-12-12T20:30:00Z'
        filterLabel='Invitados · Aprobados'
        printedAt={new Date('2026-12-12T15:00:00Z')}
      />,
    );

    const root = await screen.findByTestId('print-root');
    expect(root).toHaveClass('print-root');
    expect(root.parentElement).toBe(document.body);
    expect(within(root).getByText(/CONFIDENCIAL/)).toBeInTheDocument();
    expect(within(root).getByText('Clausura Dansship')).toBeInTheDocument();
    expect(within(root).getByText(/12 de diciembre · 3:30/)).toBeInTheDocument();
    expect(within(root).getByText(/Lista: Invitados · Aprobados · 3 personas/)).toBeInTheDocument();
    expect(within(root).getByText(/Impreso el 12\/12\/2026/)).toBeInTheDocument();
    expect(
      within(root)
        .getAllByRole('columnheader')
        .map(cell => cell.textContent),
    ).toEqual(['Ingreso', 'Nombre', 'Correo', 'Tipo', 'Estado']);
    const rows = root.querySelectorAll('tbody tr');
    expect([...rows].map(row => row.getAttribute('data-print-row'))).toEqual(['person', 'minor', 'person']);
    expect(rows[1].textContent).toContain('Sofía (menor)');
    expect(root.textContent).not.toMatch(/10\.000|COP|\$/);
  });

  it('prints the leader announcement and configured columns for artists', async () => {
    const leader = person({
      person_id: 'leader',
      role: 'holder',
      full_name: 'Valentina',
      answers: { act_name: 'Fuego' },
      member_count: 3,
      minor_count: 1,
      donations: ['Juguetes'],
      donation_received: true,
      announcement_copy: 'Texto leído en el evento',
    });

    render(
      <ParticipationPrintList
        rows={[leader]}
        columns={[{ key: 'act_name', label: 'Nombre de la presentación' }]}
        kind='holders'
        eventName='Clausura'
        filterLabel='Artistas'
        printedAt={new Date('2026-12-12T15:00:00Z')}
      />,
    );

    const root = await screen.findByTestId('print-root');
    expect(within(root).getByText('Nombre de la presentación')).toBeInTheDocument();
    expect(within(root).getByText('Fuego')).toBeInTheDocument();
    expect(within(root).getByText('Mensaje: Texto leído en el evento')).toBeInTheDocument();
    expect(within(root).getByText('Juguetes (recibida)')).toBeInTheDocument();
  });
});

describe('Inscritos print button', () => {
  const people: ParticipationPeople = {
    filters: [
      { kind: 'all', participant_type_id: null, participant_type_name: null, count: 2 },
      { kind: 'tickets', participant_type_id: 'guests', participant_type_name: 'Invitados', count: 2 },
    ],
    columns: [],
    rows: [zoe, ana],
  };

  beforeEach(() => {
    vi.spyOn(DansshipAPI.participationAdmin, 'listPeople').mockResolvedValue(ok(people));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    document.body.classList.remove(PRINT_BODY_CLASS);
  });

  it('prints from the click with the filtered rows and only the print portal visible', async () => {
    let printed: Array<string> = [];
    let header = '';
    const print = vi.spyOn(window, 'print').mockImplementation(() => {
      expect(document.body).toHaveClass(PRINT_BODY_CLASS);
      const root = screen.getByTestId('print-root');

      header = root.querySelector('header')?.textContent ?? '';
      printed = [...root.querySelectorAll('tbody tr')].map(row => row.textContent ?? '');
    });

    render(
      <MemoryRouter>
        <ParticipationPeopleTable eventId='event-1' eventSlug='clausura' eventName='Clausura Dansship' />
      </MemoryRouter>,
    );

    expect(screen.queryByTestId('print-root')).toBeNull();
    fireEvent.click(await screen.findByRole('button', { name: 'Invitados · 2' }));
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por estado' }), { target: { value: 'approved' } });
    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.listPeople).toHaveBeenLastCalledWith(
        'event-1',
        expect.objectContaining({ kind: 'tickets', participant_type_id: 'guests', status: 'approved' }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Imprimir lista' }));

    expect(print).toHaveBeenCalledTimes(1);
    expect(header).toMatch(/Lista: Invitados · Aprobados/);
    expect(printed).toEqual([expect.stringContaining('ana'), expect.stringContaining('Zoe')]);
    act(() => {
      window.dispatchEvent(new Event('afterprint'));
    });
    expect(document.body).not.toHaveClass(PRINT_BODY_CLASS);
    expect(screen.queryByTestId('print-root')).toBeNull();
  });
});

describe('Cierre del evento', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders the closing numbers from the payload, counts only', async () => {
    vi.spyOn(DansshipAPI.participationAdmin, 'getSummary').mockResolvedValue(
      ok({
        capacity: { capacity: 100, held: 3, free: 97 },
        registrations: [],
        expected_people: { total: 4, tickets: 3, ticket_minors: 1, performers: 0, members: 0 },
        revenue: {
          approved: 20000,
          in_review: 10000,
          total: 30000,
          by_fee: [{ label: 'Entrada general', amount: 10000, count: 2, total: 20000 }],
          in_review_by_fee: [{ label: 'Entrada general', amount: 10000, count: 1, total: 10000 }],
        },
        donations: [],
        attendance: null,
        closing: {
          tickets_approved: 2,
          ticket_minors_approved: 1,
          entered_by_scan: 1,
          entered_by_manual: 0,
          minors_entered: 1,
          no_show_tickets: 1,
          artists_approved: 3,
          artists_presented: 2,
          members_approved: 4,
          members_presented: 3,
          entry_closed: false,
        },
      }),
    );

    render(
      <MemoryRouter>
        <ParticipationSummaryPanel eventId='event-1' />
      </MemoryRouter>,
    );

    expect(await screen.findByText('Cierre del evento')).toBeVisible();
    expect(screen.getByText('QR 1 · manual 0 · menores 1')).toBeVisible();
    expect(screen.getByText('Aún sin ingresar')).toBeVisible();
    expect(screen.queryByText('No usaron su entrada')).toBeNull();
    expect(screen.getByText('2 / 3')).toBeVisible();
    expect(screen.getByText('Integrantes: 3 de 4')).toBeVisible();
    expect(screen.getByText('Entradas en revisión por tarifa')).toBeVisible();
    expect(document.body.textContent).not.toMatch(/@example\.com/);
  });
});
