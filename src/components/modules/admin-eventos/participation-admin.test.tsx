import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EntryWindowEditor } from './entry-window-editor';
import { EventWorkspace } from './event-workspace';
import { ParticipantTypeEditor } from './participant-type-editor';
import { ParticipationPeopleTable } from './participation-people-table';
import { ParticipationSummaryPanel } from './participation-summary';
import { SignupDetail } from './signup-detail';

import { artistTypeAdmin, mySignup, typeAdmin } from '@components/modules/event-participation/participation.fixtures';
import { DansshipAPI, type AdminSignupDetail, type EventAdmin, type ParticipationPeople } from '@core/api';
import '@core/i18n';

vi.mock('./event-info-form', () => ({ EventInfoForm: () => <p>Formulario de información</p> }));
vi.mock('@contexts', async importOriginal => ({
  ...(await importOriginal<typeof import('@contexts')>()),
  useOrPermissions: () => true,
}));

const ok = <T,>(data: T) => ({ ok: true, data, status: 200, error: null }) as never;

const people: ParticipationPeople = {
  filters: [
    { kind: 'all', participant_type_id: null, participant_type_name: null, count: 3 },
    { kind: 'holders', participant_type_id: 'type-1', participant_type_name: 'Artistas', count: 1 },
    { kind: 'members', participant_type_id: null, participant_type_name: null, count: 2 },
    { kind: 'refund_due', participant_type_id: null, participant_type_name: null, count: 1 },
  ],
  columns: [],
  rows: [
    {
      person_id: 'p1',
      signup_id: 'signup-1',
      participant_type_id: 'type-1',
      participant_type_name: 'Artistas',
      role: 'holder',
      is_minor: false,
      full_name: 'Mariana Cárdenas',
      email: 'mariana@example.com',
      phone: null,
      age: null,
      status: 'in_review',
      signup_title: 'Fuego',
      leader_name: null,
      attached_to_name: null,
      answers: {},
      donations: [],
      donation_received: false,
      member_count: 3,
      minor_count: 1,
      buyer_name: null,
      fee_label: null,
      amount: null,
      payment_intent_id: null,
      payment_status: null,
      entered_at: null,
      validated_by_name: null,
      has_entry_pass: false,
      attached_to_person_id: null,
      announcement_copy: null,
      refund_due: true,
      refunded_outside: false,
      terms_source: 'admin',
    },
  ],
};

const configuredEvent = {
  id: 'event-1',
  slug: 'clausura',
  name: 'Clausura',
  capacity: 100,
  status: 'draft',
  configuration_model: 'participant_types',
  visibility: 'public',
} as EventAdmin;

const detail: AdminSignupDetail = {
  ...mySignup,
  answers: [...mySignup.answers, { key: 'announcement', label: 'Mensaje', kind: 'long_text', value: 'Hola' }],
  signer_name: 'Valentina Ríos',
  signer_email: 'valentina@example.com',
  signer_phone: '+57 300',
  admin_copies: {},
  admin_note: null,
  donation_received: false,
  donation_received_at: null,
  reviewed_at: null,
  edited_at: null,
  terms_version: 1,
  editable_copy_fields: ['announcement'],
};

function inRouter(node: React.ReactNode, path = '/admin/eventos/event-1') {
  return render(<MemoryRouter initialEntries={[path]}>{node}</MemoryRouter>);
}

describe('participant-type admin', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([artistTypeAdmin]));
    vi.spyOn(DansshipAPI.participationAdmin, 'listPeople').mockResolvedValue(ok(people));
    vi.spyOn(DansshipAPI.participationAdmin, 'downloadPeopleCsv').mockResolvedValue(undefined);
    vi.spyOn(DansshipAPI.participationAdmin, 'updateType').mockResolvedValue(ok(artistTypeAdmin));
    vi.spyOn(DansshipAPI.participationAdmin, 'getSignup').mockResolvedValue(ok(detail));
    vi.spyOn(DansshipAPI.participationAdmin, 'approve').mockResolvedValue(ok({ ...detail, status: 'approved' }));
    vi.spyOn(DansshipAPI.eventosAdmin, 'listPriceConditions').mockResolvedValue(ok([]));
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the four tabs of an existing event', async () => {
    inRouter(<EventWorkspace event={configuredEvent} />);

    expect(screen.getByText('Formulario de información')).toBeVisible();
    const tabs = screen.getAllByRole('tab').map(tab => tab.textContent);
    expect(tabs).toEqual(['Información', 'Tipos de participante', 'Resumen', 'Inscritos']);
  });

  it('shows only Información and Tipos de participante while creating', () => {
    inRouter(<EventWorkspace />, '/admin/eventos/new');

    expect(screen.getAllByRole('tab').map(tab => tab.textContent)).toEqual(['Información', 'Tipos de participante']);
  });

  it('saves the editor with the close date in Bogotá and no per-type link', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true, data: artistTypeAdmin });

    inRouter(
      <ParticipantTypeEditor
        type={artistTypeAdmin}
        conditions={[]}
        eventCapacity={100}
        isPrivate={false}
        onSave={onSave}
      />,
    );

    expect(screen.getByDisplayValue('2026-11-27T23:59')).toBeVisible();
    expect(screen.queryByDisplayValue(/acceso=/)).toBeNull();
    expect(screen.queryByText(/Cambiar enlace|Solo con enlace/)).toBeNull();
    fireEvent.change(screen.getByLabelText('Nombre del tipo *'), { target: { value: 'Artistas 2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Artistas 2026', closes_at: '2026-11-27T23:59:00-05:00' }),
    );
  });

  it('saves the edit deadline in days before the event, empty meaning the close date', async () => {
    const onSave = vi.fn().mockResolvedValue({ ok: true, data: artistTypeAdmin });

    inRouter(
      <ParticipantTypeEditor
        type={artistTypeAdmin}
        conditions={[]}
        eventCapacity={100}
        isPrivate={false}
        onSave={onSave}
      />,
    );

    const deadline = screen.getByLabelText(/Se pueden cambiar los datos hasta/);
    expect(deadline).toHaveValue(null);
    fireEvent.change(deadline, { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({ edit_days_before_event: 1 }));
  });

  it('hides the edit deadline on a ticket-only type: tickets are never edited', () => {
    inRouter(
      <ParticipantTypeEditor
        type={typeAdmin({ registration_options: [{ kind: 'multi_ticket', label: null }] })}
        conditions={[]}
        eventCapacity={100}
        isPrivate={false}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/Cierre de venta/)).toBeVisible();
    expect(screen.queryByLabelText(/Se pueden cambiar los datos hasta/)).toBeNull();
  });

  it('locks the options in use once the type has signups', () => {
    inRouter(
      <ParticipantTypeEditor
        type={artistTypeAdmin}
        conditions={[]}
        eventCapacity={100}
        isPrivate={false}
        onSave={vi.fn()}
      />,
    );

    expect(screen.getByRole('checkbox', { name: 'Una persona' })).toBeDisabled();
    expect(screen.getByRole('checkbox', { name: 'Pareja' })).toBeEnabled();
  });

  it('marks rows to refund outside the platform and filters them with "Por devolver"', async () => {
    inRouter(<ParticipationPeopleTable eventId='event-1' eventSlug='clausura' />);

    expect(await screen.findByText('Por devolver', { selector: 'span, div' })).toBeVisible();
    expect(screen.getByText('Términos registrados por el admin')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Por devolver · 1' }));

    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.listPeople).toHaveBeenLastCalledWith(
        'event-1',
        expect.objectContaining({ kind: 'refund_due' }),
      ),
    );
    expect(screen.getByRole('link', { name: /Inscribir persona/ })).toHaveAttribute(
      'href',
      '/admin/assisted?tab=event&event=event-1',
    );
  });

  it('marks a not-approved paid signup as refunded outside the platform and undoes it', async () => {
    const refundable = { ...detail, status: 'not_approved' as const, approved_amount: '90000.00', refund_due: true };
    const marked = {
      ...refundable,
      refund_due: false,
      refunded_outside_at: '2026-11-23T15:00:00Z',
      refunded_outside_by_name: 'Admin',
    };

    vi.mocked(DansshipAPI.participationAdmin.getSignup).mockResolvedValue(ok(refundable));
    const setRefunded = vi
      .spyOn(DansshipAPI.participationAdmin, 'setRefundedOutside')
      .mockResolvedValueOnce(ok(marked))
      .mockResolvedValueOnce(ok({ ...refundable }));
    inRouter(<SignupDetail eventId='event-1' signupId='signup-1' />);

    fireEvent.click(await screen.findByRole('button', { name: 'Marcar como devuelto por fuera de la plataforma' }));
    fireEvent.click(
      within(await screen.findByRole('dialog')).getByRole('button', {
        name: 'Marcar como devuelto por fuera de la plataforma',
      }),
    );
    await waitFor(() => expect(setRefunded).toHaveBeenCalledWith('signup-1', true));

    fireEvent.click(await screen.findByRole('button', { name: 'Deshacer' }));
    fireEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Deshacer' }));
    await waitFor(() => expect(setRefunded).toHaveBeenCalledWith('signup-1', false));
  });

  it('filters Inscritos by type and exports the CSV with the same filter', async () => {
    inRouter(<ParticipationPeopleTable eventId='event-1' eventSlug='clausura' />);

    fireEvent.click(await screen.findByRole('button', { name: 'Artistas · 1' }));
    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.listPeople).toHaveBeenLastCalledWith(
        'event-1',
        expect.objectContaining({ kind: 'holders', participant_type_id: 'type-1' }),
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/ }));

    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.downloadPeopleCsv).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({ kind: 'holders', participant_type_id: 'type-1' }),
        'inscritos-clausura.csv',
      ),
    );
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute(
      'href',
      '/admin/eventos/event-1/inscripciones/signup-1',
    );
  });

  it('approves an artist from the detail after confirming', async () => {
    inRouter(<SignupDetail eventId='event-1' signupId='signup-1' />);

    expect(await screen.findByRole('heading', { name: 'Valentina Ríos' })).toBeVisible();
    expect(screen.getByDisplayValue('Hola')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aprobar' }));

    await waitFor(() => expect(DansshipAPI.participationAdmin.approve).toHaveBeenCalledWith('signup-1'));
    expect(await screen.findAllByText('Aprobada')).not.toHaveLength(0);
  });

  it('links the door from the event for people who can validate', () => {
    inRouter(<EventWorkspace event={configuredEvent} />, '/admin/eventos/event-1?tab=people');

    expect(screen.getByRole('link', { name: 'Validar entradas' })).toHaveAttribute('href', '/admin/entradas/event-1');
  });

  it('"Previsualizar" opens the event as the person sees it, once it has dates', () => {
    inRouter(<EventWorkspace event={{ ...configuredEvent, starts_at: '2026-12-12T20:30:00Z' }} />);

    expect(screen.getByRole('link', { name: /Previsualizar/ })).toHaveAttribute(
      'href',
      `/eventos/${configuredEvent.slug}?preview=1`,
    );

    cleanup();
    inRouter(<EventWorkspace event={{ ...configuredEvent, starts_at: null }} />);

    expect(screen.queryByRole('link', { name: /Previsualizar/ })).toBeNull();
    expect(screen.getByRole('button', { name: /Previsualizar/ })).toBeDisabled();
  });

  it('filters by entry, edits a ticket email and resends the QR', async () => {
    const ticket = {
      ...people.rows[0],
      person_id: 'ticket-1',
      role: 'ticket' as const,
      full_name: 'Bruno',
      email: 'bruno@example.com',
      status: 'confirmed' as const,
      entered_at: '2026-12-12T21:05:00Z',
      validated_by_name: 'Puerta',
      has_entry_pass: true,
    };
    vi.spyOn(DansshipAPI.participationAdmin, 'listPeople').mockResolvedValue(ok({ ...people, rows: [ticket] }));
    const update = vi.spyOn(DansshipAPI.entry, 'updatePerson').mockResolvedValue(
      ok({
        person_id: 'ticket-1',
        full_name: 'Bruno',
        email: 'nuevo@example.com',
        has_active_pass: true,
        entered_at: null,
      }),
    );
    const resend = vi.spyOn(DansshipAPI.entry, 'resendEntry').mockResolvedValue(
      ok({
        person_id: 'ticket-1',
        full_name: 'Bruno',
        email: 'nuevo@example.com',
        has_active_pass: true,
        entered_at: null,
      }),
    );

    inRouter(<ParticipationPeopleTable eventId='event-1' eventSlug='clausura' />);

    expect(await screen.findByText(/12\/12 \d\d:05/)).toBeVisible();
    fireEvent.change(screen.getByRole('combobox', { name: 'Filtrar por ingreso' }), { target: { value: 'yes' } });
    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.listPeople).toHaveBeenLastCalledWith(
        'event-1',
        expect.objectContaining({ entered: true }),
      ),
    );

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/el QR y el enlace anteriores dejan de funcionar/)).toBeVisible();
    fireEvent.change(within(dialog).getByLabelText('Correo'), { target: { value: 'nuevo@example.com' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reenviar QR' }));
    await waitFor(() => expect(resend).toHaveBeenCalledWith('ticket-1'));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(update).toHaveBeenCalledWith('ticket-1', { email: 'nuevo@example.com' }));
  });

  it('shows attendance in Resumen once the event issues entry QRs', async () => {
    vi.spyOn(DansshipAPI.participationAdmin, 'getSummary').mockResolvedValue(
      ok({
        capacity: { capacity: 100, held: 2, free: 98 },
        registrations: [],
        expected_people: { total: 3, tickets: 2, ticket_minors: 1, performers: 0, members: 0 },
        revenue: { approved: 0, in_review: 0, total: 0, by_fee: [], in_review_by_fee: [] },
        donations: [],
        attendance: {
          guests: { entered: 1, expected: 2 },
          minors: { entered: 0, expected: 1 },
          artists: { entered: 0, expected: 0 },
        },
        closing: null,
      }),
    );

    inRouter(<ParticipationSummaryPanel eventId='event-1' />);

    expect(await screen.findByText('Asistencia')).toBeVisible();
    expect(screen.getByText('Invitados que ingresaron')).toBeVisible();
    expect(screen.getByText('de 2 esperados')).toBeVisible();
  });

  it('voids a guest ticket after confirming, never once it was used', async () => {
    const ticket = {
      ...people.rows[0],
      person_id: 'ticket-2',
      role: 'ticket' as const,
      full_name: 'Carla',
      email: 'carla@example.com',
      status: 'confirmed' as const,
      has_entry_pass: true,
    };
    vi.spyOn(DansshipAPI.participationAdmin, 'listPeople').mockResolvedValue(ok({ ...people, rows: [ticket] }));
    const voidEntry = vi.spyOn(DansshipAPI.entry, 'voidEntry').mockResolvedValue(
      ok({
        person_id: 'ticket-2',
        full_name: 'Carla',
        email: 'carla@example.com',
        has_active_pass: false,
        entered_at: null,
      }),
    );

    inRouter(<ParticipationPeopleTable eventId='event-1' eventSlug='clausura' />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Anular entrada' }));
    expect(voidEntry).not.toHaveBeenCalled();
    expect(within(dialog).getByText(/el cupo queda libre/)).toBeVisible();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sí, anular' }));
    await waitFor(() => expect(voidEntry).toHaveBeenCalledWith('ticket-2'));
  });

  it('hides "Anular entrada" for a ticket already used at the door', async () => {
    const used = {
      ...people.rows[0],
      person_id: 'ticket-3',
      role: 'ticket' as const,
      status: 'confirmed' as const,
      entered_at: '2026-12-12T21:05:00Z',
    };
    vi.spyOn(DansshipAPI.participationAdmin, 'listPeople').mockResolvedValue(ok({ ...people, rows: [used] }));

    inRouter(<ParticipationPeopleTable eventId='event-1' eventSlug='clausura' />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Anular entrada' })).toBeNull();
  });

  it('hides "Reenviar QR" for a ticket without an active pass', async () => {
    const pending = { ...people.rows[0], person_id: 'ticket-4', role: 'ticket' as const, has_entry_pass: false };
    vi.spyOn(DansshipAPI.participationAdmin, 'listPeople').mockResolvedValue(ok({ ...people, rows: [pending] }));

    inRouter(<ParticipationPeopleTable eventId='event-1' eventSlug='clausura' />);

    fireEvent.click(await screen.findByRole('button', { name: 'Editar' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).queryByRole('button', { name: 'Reenviar QR' })).toBeNull();
  });

  it('sets the entry window in Bogotá time and resets it', async () => {
    const base = { opens_at: '2026-12-12T17:30:00Z', closes_at: '2026-12-13T01:30:00Z', is_override: false };
    vi.spyOn(DansshipAPI.entry, 'getEntryWindow').mockResolvedValue(ok(base));
    const save = vi
      .spyOn(DansshipAPI.entry, 'setEntryWindow')
      .mockResolvedValueOnce(
        ok({ opens_at: '2026-11-21T15:00:00Z', closes_at: '2026-11-21T17:00:00Z', is_override: true }),
      )
      .mockResolvedValueOnce(ok(base));

    inRouter(<EntryWindowEditor eventId='event-1' />);

    expect(await screen.findByText('Ahora: 12/12 12:30 – 12/12 20:30 · Por defecto')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Cambiar' }));
    const opens = await screen.findByLabelText('Abre');
    await waitFor(() => expect(opens).toHaveValue('2026-12-12T12:30'));
    fireEvent.change(opens, { target: { value: '2026-11-21T10:00' } });
    fireEvent.change(screen.getByLabelText('Cierra'), { target: { value: '2026-11-21T12:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar ventana' }));
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('event-1', {
        opens_at: '2026-11-21T10:00:00-05:00',
        closes_at: '2026-11-21T12:00:00-05:00',
      }),
    );
    fireEvent.click(await screen.findByRole('button', { name: 'Volver a la ventana por defecto' }));
    await waitFor(() => expect(save).toHaveBeenLastCalledWith('event-1', { opens_at: null, closes_at: null }));
  });
});
