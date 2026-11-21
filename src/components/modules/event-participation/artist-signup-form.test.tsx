import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ArtistSignupForm } from './artist-signup-form';
import { artistForm, mySignup } from './participation.fixtures';

import { DansshipAPI } from '@core/api';
import '@core/i18n';

function renderForm(props: Partial<Parameters<typeof ArtistSignupForm>[0]> = {}) {
  return render(
    <MemoryRouter>
      <ArtistSignupForm form={artistForm} accessToken='tok' {...props} />
    </MemoryRouter>,
  );
}

describe('ArtistSignupForm', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.participation, 'submit').mockResolvedValue({
      ok: true,
      data: mySignup,
      status: 201,
      error: null,
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

  it('shows the group only when the act is Baile', () => {
    renderForm();

    expect(screen.queryByText('Integrantes del grupo')).toBeNull();
    fireEvent.click(screen.getByRole('radio', { name: 'Baile' }));

    expect(screen.getByText('Integrantes del grupo')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: /Agregar integrante/ }));
    expect(screen.getByLabelText('Correo')).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: 'Lucía Ríos · 9 años' }));
    expect(screen.getAllByText('Integrante 2')[0]).toBeVisible();
  });

  it('keeps sending disabled until the terms are accepted', () => {
    renderForm();

    const submit = screen.getByRole('button', { name: 'Enviar inscripción' });

    expect(submit).toBeDisabled();
    fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones/ }));
    expect(submit).toBeEnabled();
  });

  it('does not send while required answers are missing', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    expect((await screen.findAllByText('Este campo es obligatorio')).length).toBeGreaterThan(0);
    expect(DansshipAPI.participation.submit).not.toHaveBeenCalled();
  });

  it('sends the answers, the donation and the accepted terms version', async () => {
    renderForm();
    fireEvent.click(screen.getByRole('radio', { name: 'Lira' }));
    fireEvent.change(screen.getByLabelText('Nombre de la presentación'), { target: { value: 'Raíces' } });
    fireEvent.change(screen.getByLabelText('Música'), { target: { value: 'https://youtu.be/x' } });
    fireEvent.change(screen.getByLabelText('Mensaje antes de la presentación'), { target: { value: 'Hola' } });
    fireEvent.click(screen.getByRole('checkbox', { name: 'Juguetes para niños' }));
    fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Enviar inscripción' }));

    await waitFor(() => expect(DansshipAPI.participation.submit).toHaveBeenCalledTimes(1));
    expect(DansshipAPI.participation.submit).toHaveBeenCalledWith(
      'type-1',
      expect.objectContaining({
        answers: expect.objectContaining({ act_type: 'Lira', act_name: 'Raíces' }),
        donation_type_ids: ['don-1'],
        accepted_terms: true,
        terms_version_id: 'terms-1',
        access_token: 'tok',
        members: [],
      }),
    );
  });

  it('edits an existing registration', async () => {
    renderForm({ signup: mySignup, accessToken: null });
    fireEvent.click(screen.getByRole('checkbox', { name: /términos y condiciones/ }));

    fireEvent.click(screen.getByRole('button', { name: 'Guardar cambios' }));

    await waitFor(() => expect(DansshipAPI.participation.update).toHaveBeenCalledWith('signup-1', expect.anything()));
  });

  it('shows the closed message instead of the form', () => {
    renderForm({ form: { ...artistForm, state: 'closed' } });

    expect(screen.getByText('Las inscripciones de artistas ya cerraron')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Enviar inscripción' })).toBeNull();
  });
});
