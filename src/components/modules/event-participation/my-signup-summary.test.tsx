import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { MySignupSummary } from './my-signup-summary';
import { mySignup } from './participation.fixtures';

import '@core/i18n';

function renderSummary(overrides: Partial<typeof mySignup> = {}) {
  return render(
    <MemoryRouter>
      <MySignupSummary signup={{ ...mySignup, ...overrides }} />
    </MemoryRouter>,
  );
}

describe('MySignupSummary', () => {
  afterEach(cleanup);

  it('lets her edit while in review and before the type deadline', () => {
    renderSummary();

    expect(screen.getByText('En revisión')).toBeVisible();
    // The type's edit deadline, not the close date (ADR-064 addendum 2026-11-26).
    expect(screen.getByText(/Puedes cambiar tus datos hasta el viernes, 11 de diciembre, 11:59/)).toBeVisible();
    expect(screen.getByText('https://youtu.be/x · Desde 0:08')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Editar inscripción' })).toBeEnabled();
  });

  it('disables editing after the type deadline', () => {
    renderSummary({ editable: false, edits_close_at: '2026-11-01T04:59:59Z' });

    expect(screen.getByText(/El plazo para cambiar tus datos terminó el sábado, 31 de octubre/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Editar inscripción' })).toBeDisabled();
  });

  it('never says the deadline passed while it is still ahead', () => {
    renderSummary({ editable: false, edits_close_at: '2099-12-12T04:59:59Z' });

    expect(screen.queryByText(/El plazo para cambiar tus datos terminó/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Editar inscripción' })).toBeDisabled();
  });

  it('shows "No aprobada" without any edit button', () => {
    renderSummary({ status: 'not_approved', editable: false });

    expect(screen.getByText('No aprobada')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Editar inscripción' })).toBeNull();
  });
});
