import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { SimpleRegistrationDialog, type SimpleRegistrationOutcome } from './simple-registration-dialog';

import '@core/i18n';

function renderDialog(onSubmit: () => Promise<SimpleRegistrationOutcome>) {
  render(
    <SimpleRegistrationDialog
      open
      onOpenChange={() => undefined}
      title='Inscríbete al evento'
      description='Solo necesitamos tres datos.'
      submitLabel='Continuar al pago'
      termsLabel='Acepto los términos.'
      existsNotice={<p>Ya tienes una cuenta</p>}
      onSubmit={onSubmit}
    />,
  );
}

function fillIn() {
  fireEvent.change(screen.getByLabelText('Nombre completo'), { target: { value: 'Sofía Herrera' } });
  fireEvent.change(screen.getByLabelText('Correo'), { target: { value: 'sofia@example.com' } });
  fireEvent.change(screen.getByLabelText('Celular'), { target: { value: '3015558899' } });
}

function acceptTerms() {
  fireEvent.click(screen.getByLabelText('Acepto los términos.'));
}

describe('SimpleRegistrationDialog', () => {
  beforeAll(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
  });

  afterEach(cleanup);

  it('keeps the action disabled until the three fields and the terms are given', async () => {
    renderDialog(vi.fn());
    const submit = screen.getByRole('button', { name: 'Continuar al pago' });

    expect(submit).toBeDisabled();
    fillIn();
    await waitFor(() => expect(screen.getByLabelText('Correo')).toHaveValue('sofia@example.com'));
    expect(submit).toBeDisabled();
    acceptTerms();
    await waitFor(() => expect(submit).toBeEnabled());
  });

  it('sends the person with the Colombian country code', async () => {
    const onSubmit = vi.fn().mockResolvedValue('created');

    renderDialog(onSubmit);
    fillIn();
    acceptTerms();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continuar al pago' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Continuar al pago' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        full_name: 'Sofía Herrera',
        email: 'sofia@example.com',
        phone_number: '3015558899',
        phone_country_code: '+57',
        terms_accepted: true,
      }),
    );
  });

  it('shows the notice when an account already exists', async () => {
    renderDialog(vi.fn().mockResolvedValue('exists'));
    fillIn();
    acceptTerms();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Continuar al pago' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Continuar al pago' }));

    expect(await screen.findByText('Ya tienes una cuenta')).toBeInTheDocument();
  });
});
