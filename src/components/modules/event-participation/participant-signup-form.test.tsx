import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ParticipantSignupForm } from './participant-signup-form';
import { artistForm, landingType, mySignup } from './participation.fixtures';

import { DansshipAPI, type EventLanding, type ParticipantForm } from '@core/api';
import '@core/i18n';

const landing = {
  slug: 'clausura-dansship',
  name: 'Clausura Dansship',
  starts_at: '2026-12-12T20:30:00Z',
  payment_qr_url: null,
  participation: { types: [landingType()], terms: null, remaining: 40, capacity: 100 },
} as unknown as EventLanding;

function quoteResult(chargesMoney: boolean) {
  return {
    ok: true,
    status: 200,
    error: null,
    data: {
      charges_money: chargesMoney,
      lines: chargesMoney
        ? [{ index: 0, full_name: 'Valentina', is_minor: false, email: null, attach_to_index: null, price: 50000 }]
        : [],
      total: chargesMoney ? 50000 : 0,
      totals: chargesMoney
        ? {
            final_price: 50000,
            base_amount: 42017,
            tax_amount: 7983,
            wallet_amount_applied: 0,
            amount_to_charge: 50000,
          }
        : null,
    },
  } as never;
}

function renderForm(form: ParticipantForm = artistForm, signup: typeof mySignup | null = null, preview = false) {
  return render(
    <MemoryRouter>
      <ParticipantSignupForm form={form} landing={landing} signup={signup} preview={preview} />
    </MemoryRouter>,
  );
}

/** «Lista» answers are a dropdown (Radix opens on ArrowDown in jsdom). */
async function pickChoice(label: string, choice: string) {
  const trigger = screen.getByRole('combobox', { name: label });
  trigger.focus();
  fireEvent.keyDown(trigger, { key: 'ArrowDown', code: 'ArrowDown' });
  fireEvent.click(await screen.findByRole('option', { name: choice }));
}

async function fillArtistAnswers() {
  await pickChoice('Tipo de presentación', 'Lira');
  fireEvent.change(screen.getByLabelText('Nombre de la presentación'), { target: { value: 'Raíces' } });
  fireEvent.change(screen.getByLabelText('Música'), { target: { value: 'https://youtu.be/x' } });
  fireEvent.change(screen.getByLabelText('Mensaje antes de la presentación'), { target: { value: 'Hola' } });
  fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones/ }));
}

describe('ParticipantSignupForm', () => {
  beforeEach(() => {
    Element.prototype.scrollTo = () => undefined;
    Element.prototype.scrollIntoView = () => undefined;
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.participation, 'quoteSignup').mockResolvedValue(quoteResult(false));
    vi.spyOn(DansshipAPI.participation, 'submitSignup').mockResolvedValue({
      ok: true,
      status: 201,
      error: null,
      data: { signup_id: 'signup-1', status: 'in_review' },
    } as never);
    vi.spyOn(DansshipAPI.participation, 'update').mockResolvedValue({
      ok: true,
      data: mySignup,
      status: 200,
      error: null,
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('starts with "¿Cómo te inscribes?" and renders the people of the chosen option', () => {
    renderForm();

    expect(screen.getByText('¿Cómo te inscribes?')).toBeVisible();
    expect(screen.queryByText('Tu grupo')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'En grupo' }));

    expect(screen.getByText('Tu grupo')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Agregar integrante/ }));
    expect(screen.getByLabelText('Correo')).toBeVisible();
  });

  it('maps each question kind to its input, as in the design', async () => {
    renderForm({
      ...artistForm,
      fields: [
        {
          key: 'act_type',
          label: 'Tipo de presentación',
          kind: 'choice',
          required: true,
          options: { choices: ['Lira', 'Pole'] },
        },
        {
          key: 'needs',
          label: '¿Qué necesitas?',
          kind: 'multi_choice',
          required: false,
          options: { choices: ['Luz', 'Silla'] },
        },
        { key: 'message', label: 'Mensaje', kind: 'long_text', required: false, options: { max_length: 1000 } },
      ],
    });

    // «Lista»: a dropdown, not chips.
    expect(screen.getByRole('combobox', { name: 'Tipo de presentación' })).toBeVisible();
    expect(screen.queryByRole('radio', { name: 'Lira' })).toBeNull();
    // «Selección múltiple»: one checkbox row per choice.
    fireEvent.click(screen.getByRole('checkbox', { name: 'Silla' }));
    expect(screen.getByRole('checkbox', { name: 'Silla' })).toBeChecked();
    // «Texto largo»: the limit and the counter.
    fireEvent.change(screen.getByLabelText('Mensaje'), { target: { value: 'Hola' } });
    expect(screen.getByText('Máximo 1.000 caracteres.')).toBeVisible();
    expect(screen.getByText('4 / 1.000')).toBeVisible();
  });

  it('groups the questions in titled sections with their help text', () => {
    renderForm({
      ...artistForm,
      fields: [
        {
          key: 'section_music',
          label: 'Tu música',
          kind: 'section',
          required: false,
          options: {},
          help_text: 'Lo que suena.',
        },
        {
          key: 'music',
          label: 'Enlace de la canción',
          kind: 'link',
          required: true,
          options: { with_note: true },
          help_text: 'Pega el enlace de YouTube, Spotify o Google Drive.',
        },
        { key: 'section_empty', label: 'Sin preguntas', kind: 'section', required: false, options: {} },
      ],
    });

    const music = screen.getByRole('region', { name: 'Tu música' });

    expect(music).toHaveTextContent('Lo que suena.');
    expect(music).toContainElement(screen.getByLabelText('Enlace de la canción'));
    expect(screen.getByText('Pega el enlace de YouTube, Spotify o Google Drive.')).toBeVisible();
    // A section with no questions to show is left out.
    expect(screen.queryByRole('region', { name: 'Sin preguntas' })).toBeNull();
  });

  it('describes each way to sign up and dates the event in Bogotá', () => {
    renderForm();

    expect(screen.getByRole('radio', { name: 'En grupo' })).toHaveAccessibleDescription(
      'Inscribes a tu grupo y agregas a cada integrante.',
    );
    expect(screen.getByText(/Sábado 12 de diciembre · 3:30 p\. m\./)).toBeVisible();
  });

  it('asks the option when there are several', async () => {
    renderForm();
    await fillArtistAnswers();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    expect(await screen.findByText('Elige cómo te inscribes.')).toBeVisible();
    expect(DansshipAPI.participation.quoteSignup).not.toHaveBeenCalled();
  });

  it.each([
    ['pair', 'Correo de tu pareja *'],
    ['multi_ticket', 'Correo de quien asiste *'],
    ['group_booking', '¿Cuántas personas vienen? *'],
  ] as const)('renders the "%s" option with its own inputs and no "¿Cómo te inscribes?"', (kind, label) => {
    renderForm({ ...artistForm, registration_options: [{ kind }] });

    expect(screen.queryByText('¿Cómo te inscribes?')).toBeNull();
    expect(screen.getByLabelText(label)).toBeVisible();
  });

  it('does not send while required answers are missing or the terms are not accepted', async () => {
    renderForm();

    expect(screen.getByRole('button', { name: 'Enviar inscripción' })).toBeDisabled();
    fireEvent.click(screen.getByRole('radio', { name: 'Sola' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    expect((await screen.findAllByText('Este campo es obligatorio')).length).toBeGreaterThan(0);
    expect(DansshipAPI.participation.quoteSignup).not.toHaveBeenCalled();
  });

  it('submits a free type from the page with the chosen option and the event terms', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('radio', { name: 'Sola' }));
    await fillArtistAnswers();
    fireEvent.click(screen.getByRole('checkbox', { name: 'Juguetes para niños' }));

    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    await waitFor(() => expect(DansshipAPI.participation.submitSignup).toHaveBeenCalledTimes(1));
    expect(DansshipAPI.participation.submitSignup).toHaveBeenCalledWith(
      'clausura-dansship',
      expect.objectContaining({
        participant_type_id: 'type-1',
        registration_option: 'single',
        answers: expect.objectContaining({ act_type: 'Lira', act_name: 'Raíces' }),
        donation_type_ids: ['don-1'],
        accepted_terms: true,
        terms_version_id: 'terms-1',
        members: [],
      }),
    );
  });

  it('opens the checkout for a paid type instead of submitting', async () => {
    vi.mocked(DansshipAPI.participation.quoteSignup).mockResolvedValue(quoteResult(true));
    renderForm();
    fireEvent.click(screen.getByRole('radio', { name: 'Sola' }));
    await fillArtistAnswers();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    expect((await screen.findAllByText('Valentina')).length).toBeGreaterThan(0);
    expect(DansshipAPI.participation.submitSignup).not.toHaveBeenCalled();
  });

  it('the admin preview quotes a free type but never submits it', async () => {
    renderForm(artistForm, null, true);
    fireEvent.click(screen.getByRole('radio', { name: 'Sola' }));
    await fillArtistAnswers();

    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    await waitFor(() =>
      expect(DansshipAPI.participation.quoteSignup).toHaveBeenCalledWith(
        'clausura-dansship',
        expect.objectContaining({ participant_type_id: 'type-1' }),
        true,
      ),
    );
    expect(DansshipAPI.participation.submitSignup).not.toHaveBeenCalled();
  });

  it('the admin preview walks a paid type to the payment step but cannot pay', async () => {
    vi.mocked(DansshipAPI.participation.quoteSignup).mockResolvedValue(quoteResult(true));
    renderForm(artistForm, null, true);
    fireEvent.click(screen.getByRole('radio', { name: 'Sola' }));
    await fillArtistAnswers();
    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    fireEvent.click(await screen.findByRole('button', { name: /Siguiente/ }));

    expect(await screen.findByText(/En la vista previa no se puede pagar/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Confirmar pago' })).toBeDisabled();
    expect(DansshipAPI.participation.submitSignup).not.toHaveBeenCalled();
  });

  it('marks the field the API names', async () => {
    const { DansshipAPIError, DANSSHIP_ERROR_CATEGORY } = await import('@core/api');

    vi.mocked(DansshipAPI.participation.quoteSignup).mockResolvedValue({
      ok: false,
      status: 422,
      data: null,
      error: new DansshipAPIError(
        {
          category: DANSSHIP_ERROR_CATEGORY.VALIDATION_ERROR,
          error_code: 'PARTNER_NOT_FOUND',
          message: 'no',
          details: { field_key: 'partner_email' },
        } as never,
        422,
      ),
    } as never);
    renderForm({ ...artistForm, fields: [], terms: null, registration_options: [{ kind: 'pair' }] });
    fireEvent.change(screen.getByLabelText('Correo de tu pareja *'), { target: { value: 'nadie@x.com' } });

    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    expect((await screen.findAllByText(/no tiene cuenta Dansship/)).length).toBeGreaterThan(0);
  });

  it('edits an existing registration', async () => {
    renderForm(artistForm, { ...mySignup, registration_option: 'single' });
    fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(DansshipAPI.participation.update).toHaveBeenCalledWith('signup-1', expect.anything()));
  });

  it('shows the closed message instead of the form', () => {
    renderForm({ ...artistForm, state: 'closed' });

    expect(screen.getByText('Las inscripciones ya cerraron')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Enviar inscripción' })).toBeNull();
  });
});
