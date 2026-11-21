import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArtistSignupDetail } from './artist-signup-detail';
import { EventoAdminTabs } from './evento-admin-tabs';
import { ParticipantTypeEditor } from './participant-type-editor';
import { ParticipationPeopleTable } from './participation-people-table';

import { artistTypeAdmin, mySignup } from '@components/modules/event-participation/participation.fixtures';
import { DansshipAPI, type AdminSignupDetail, type EventAdmin, type ParticipationPeople } from '@core/api';
import '@core/i18n';

vi.mock('./evento-edit-form', () => ({ EventoEditForm: () => <p>Formulario de información</p> }));

const ok = <T,>(data: T) => ({ ok: true, data, status: 200, error: null }) as never;

const people: ParticipationPeople = {
  filters: [
    { kind: 'all', participant_type_id: null, participant_type_name: null, count: 3 },
    { kind: 'holders', participant_type_id: 'type-1', participant_type_name: 'Artistas', count: 1 },
    { kind: 'members', participant_type_id: null, participant_type_name: null, count: 2 },
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
    },
  ],
};

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
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the four tabs and opens the participant types', async () => {
    inRouter(
      <EventoAdminTabs event={{ id: 'event-1', slug: 'clausura', name: 'Clausura', capacity: 100 } as EventAdmin} />,
    );

    expect(screen.getByText('Formulario de información')).toBeVisible();
    const tabs = screen.getAllByRole('tab').map(tab => tab.textContent);
    expect(tabs).toEqual(['Información', 'Tipos de participante', 'Resumen', 'Inscritos']);
  });

  it('saves the editor with the close date in Bogotá and shows the artists link', async () => {
    inRouter(
      <ParticipantTypeEditor
        eventId='event-1'
        eventSlug='clausura'
        eventCapacity={100}
        type={artistTypeAdmin}
        onSaved={() => undefined}
      />,
    );

    expect(screen.getByDisplayValue(/\/eventos\/clausura\?acceso=tok-123$/)).toBeVisible();
    expect(screen.getByDisplayValue('2026-11-27T23:59')).toBeVisible();
    fireEvent.change(screen.getByLabelText('Nombre del tipo'), { target: { value: 'Artistas 2026' } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(DansshipAPI.participationAdmin.updateType).toHaveBeenCalledTimes(1));
    expect(DansshipAPI.participationAdmin.updateType).toHaveBeenCalledWith(
      'event-1',
      'type-1',
      expect.objectContaining({ name: 'Artistas 2026', closes_at: '2026-11-27T23:59:00-05:00' }),
    );
  });

  it('locks "who signs up" once the type has signups', () => {
    inRouter(
      <ParticipantTypeEditor
        eventId='event-1'
        eventSlug='clausura'
        eventCapacity={100}
        type={artistTypeAdmin}
        onSaved={() => undefined}
      />,
    );

    expect(screen.getByLabelText('¿Quién se inscribe?')).toBeDisabled();
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
    inRouter(<ArtistSignupDetail eventId='event-1' signupId='signup-1' />);

    expect(await screen.findByRole('heading', { name: 'Valentina Ríos' })).toBeVisible();
    expect(screen.getByDisplayValue('Hola')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Aprobar' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Aprobar' }));

    await waitFor(() => expect(DansshipAPI.participationAdmin.approve).toHaveBeenCalledWith('signup-1'));
    expect(await screen.findAllByText('Aprobada')).not.toHaveLength(0);
  });
});
