import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ParticipantTypeEditor } from './participant-type-editor';

import { artistTypeAdmin, typeAdmin } from '@components/modules/event-participation/participation.fixtures';
import {
  DANSSHIP_ERROR_CATEGORY,
  DansshipAPIError,
  type ParticipantTypeAdmin,
  type PriceConditionCatalogItem,
} from '@core/api';
import '@core/i18n';

const community: PriceConditionCatalogItem = {
  condition_type: 'has_active_plan',
  label: 'Comunidad Dansship',
  param_schema: {},
  offered_in_editor: true,
};

function renderEditor(type: ParticipantTypeAdmin, onSave = vi.fn().mockResolvedValue({ ok: true, data: type })) {
  render(
    <MemoryRouter>
      <ParticipantTypeEditor
        type={type}
        conditions={[community]}
        eventCapacity={100}
        isPrivate={false}
        onSave={onSave}
      />
    </MemoryRouter>,
  );

  return onSave;
}

async function save(onSave: ReturnType<typeof vi.fn>) {
  fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));
  await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));

  return onSave.mock.calls[0][0];
}

const fees = {
  general: { id: 'fee-all', label: 'General', condition_type: null, condition_params: {}, price: '240000.00' },
  plan: {
    id: 'fee-plan',
    label: 'Con plan activo',
    condition_type: 'has_active_plan',
    condition_params: {},
    price: '180000.00',
  },
};

describe('ParticipantTypeEditor reference configurations', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('saves an individual workshop: one person, simple registration, fees and a quota', async () => {
    const onSave = renderEditor(
      typeAdmin({
        requires_account: false,
        quota: 24,
        fees: [
          { id: 'fee-all', label: 'Público general', condition_type: null, condition_params: {}, price: '75000.00' },
          {
            id: 'fee-plan',
            label: 'Con plan activo',
            condition_type: 'has_active_plan',
            condition_params: {},
            price: '45000.00',
          },
        ],
      }),
    );

    expect(await save(onSave)).toMatchObject({
      registration_options: [{ kind: 'single', label: null }],
      requires_account: false,
      contribution_model: 'money',
      pricing_model: 'per_person',
      condition_subject: 'holder',
      quota: 24,
      fees: [
        expect.objectContaining({ condition_type: null }),
        expect.objectContaining({ condition_type: 'has_active_plan' }),
      ],
      payment_plan: [],
    });
  });

  it('saves a pair: one priced unit for two people', async () => {
    const onSave = renderEditor(
      typeAdmin({
        name: 'Parejas',
        registration_options: [{ kind: 'pair', label: null }],
        quota: 16,
        fees: [
          { id: 'fee-all', label: 'Precio pareja', condition_type: null, condition_params: {}, price: '100000.00' },
        ],
      }),
    );

    expect(await save(onSave)).toMatchObject({ name: 'Parejas', registration_options: [{ kind: 'pair' }], quota: 16 });
  });

  it('saves a recital with two installments by fee and reminders', async () => {
    const onSave = renderEditor(
      typeAdmin({
        name: 'Inscritas',
        fees: [fees.general, fees.plan],
        payment_plan: [
          {
            sequence: 1,
            percent: null,
            amounts: [
              { fee_id: 'fee-all', amount: '120000.00' },
              { fee_id: 'fee-plan', amount: '90000.00' },
            ],
            due: { anchor: 'fixed_date', date: '2026-10-31' },
          },
          {
            sequence: 2,
            percent: null,
            amounts: [
              { fee_id: 'fee-all', amount: '120000.00' },
              { fee_id: 'fee-plan', amount: '90000.00' },
            ],
            due: { anchor: 'fixed_date', date: '2026-11-27' },
          },
        ],
        installment_reminder_days: [3],
        available_notices: ['pending_payment', 'installment_reminder'],
      }),
    );

    expect(screen.getByText('3 días antes')).toBeVisible();
    expect(await save(onSave)).toMatchObject({
      payment_plan: [
        {
          percent: null,
          amounts: [
            { fee_id: 'fee-all', amount: 120000 },
            { fee_id: 'fee-plan', amount: 90000 },
          ],
          due: { anchor: 'fixed_date', date: '2026-10-31' },
        },
        { due: { anchor: 'fixed_date', date: '2026-11-27' } },
      ],
      installment_reminder_days: [3],
    });
  });

  it('saves a private package booking: packages, discount, 50 % deposit, balance 1 day before and the pay-later deadline', async () => {
    const onSave = renderEditor(
      typeAdmin({
        name: 'Quien reserva',
        registration_options: [{ kind: 'group_booking', label: null, min_people: 6, max_people: 30 }],
        counts_toward_capacity: false,
        pricing_model: 'package',
        fees: [],
        packages: [
          {
            id: 'pkg-1',
            name: 'Básico',
            base_price: '580000.00',
            included_people: 6,
            additional_person_price: '97000.00',
          },
          {
            id: 'pkg-2',
            name: 'Premium',
            base_price: '1790000.00',
            included_people: 6,
            additional_person_price: '298000.00',
          },
        ],
        condition_discounts: [
          { id: 'd-1', label: 'Plan activo', condition_type: 'has_active_plan', condition_params: {}, percent: '5' },
        ],
        payment_plan: [
          { sequence: 1, percent: '50', amounts: [], due: { anchor: 'at_signup' } },
          { sequence: 2, percent: '50', amounts: [], due: { anchor: 'days_before_event', days: 1 } },
        ],
        pay_later_deadline: { anchor: 'after_signup', days: 3 },
      }),
    );

    expect(screen.getByDisplayValue('Básico')).toBeVisible();
    expect(screen.getByLabelText('Días antes del evento *')).toHaveValue(1);
    expect(await save(onSave)).toMatchObject({
      registration_options: [{ kind: 'group_booking', min_people: 6, max_people: 30 }],
      pricing_model: 'package',
      fees: [],
      packages: [expect.objectContaining({ name: 'Básico' }), expect.objectContaining({ name: 'Premium' })],
      condition_discounts: [expect.objectContaining({ condition_type: 'has_active_plan', percent: '5' })],
      payment_plan: [
        { percent: 50, amounts: [], due: { anchor: 'at_signup' } },
        { percent: 50, amounts: [], due: { anchor: 'days_before_event', days: 1 } },
      ],
      pay_later_deadline: { anchor: 'after_signup', days: 3 },
    });
  });

  it('saves Clausura artists as a paid type that needs approval', async () => {
    const onSave = renderEditor({
      ...artistTypeAdmin,
      signup_count: 0,
      people_count: 0,
      contribution_model: 'money_and_in_kind',
      fees: [{ id: 'fee-all', label: 'Inscripción', condition_type: null, condition_params: {}, price: '30000.00' }],
    });

    expect(await save(onSave)).toMatchObject({
      requires_approval: true,
      contribution_model: 'money_and_in_kind',
      registration_options: [
        { kind: 'single', label: 'Sola' },
        expect.objectContaining({ kind: 'group', max_members: 30 }),
      ],
      donation_types: [{ id: 'don-1', label: 'Juguetes para niños' }],
    });
  });

  it('saves Clausura guests as free tickets checked by each person', async () => {
    const onSave = renderEditor(
      typeAdmin({
        name: 'Invitados',
        registration_options: [{ kind: 'multi_ticket', label: null, max_tickets: 10 }],
        contribution_model: 'free',
        condition_subject: 'each_person',
        fees: [],
        minors_allowed: true,
        minor_max_age: 12,
        minors_per_adult_max: 3,
        issues_entry_qr: true,
        available_notices: ['entry_pass'],
      }),
    );

    expect(screen.getByText('Correo de quien asiste')).toBeVisible();
    expect(await save(onSave)).toMatchObject({
      registration_options: [{ kind: 'multi_ticket', max_tickets: 10 }],
      contribution_model: 'free',
      fees: [],
      minors_allowed: true,
      minor_max_age: 12,
      minors_per_adult_max: 3,
      minor_price: null,
      issues_entry_qr: true,
    });
  });

  it('adds an option with its defaults from the registry', async () => {
    const onSave = renderEditor(typeAdmin());

    fireEvent.click(screen.getByRole('checkbox', { name: 'Un grupo (líder + integrantes)' }));
    expect(screen.getByText('Con más de una opción, la inscripción empieza con «¿Cómo te inscribes?».')).toBeVisible();

    expect((await save(onSave)).registration_options).toEqual([
      { kind: 'single', label: null },
      { kind: 'group', label: null, max_members: 30, members_required: true },
    ]);
  });

  it('refuses to save without an option or a fee for everyone', async () => {
    const onSave = renderEditor(typeAdmin({ fees: [] }));

    fireEvent.click(screen.getByRole('checkbox', { name: 'Una persona' }));
    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    expect(await screen.findByText('Marca al menos una opción.')).toBeVisible();
    expect(screen.getByText('Agrega una tarifa para «Todos».')).toBeVisible();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('shows the API error on the field it names', async () => {
    const error = new DansshipAPIError(
      {
        category: DANSSHIP_ERROR_CATEGORY.VALIDATION_ERROR,
        error_code: 'EVENT_PARTICIPANT_TYPE_INVALID',
        message: 'too long',
        details: { field: 'card_copy', key: 'title', reason: 'too_long' },
      } as never,
      422,
    );
    const onSave = renderEditor(typeAdmin(), vi.fn().mockResolvedValue({ ok: false, error }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
    expect(await screen.findByRole('alert')).toHaveTextContent('Revisa el tipo de participante');
    expect(screen.getByLabelText('Título de la tarjeta (opcional)')).toHaveFocus();
  });
});
