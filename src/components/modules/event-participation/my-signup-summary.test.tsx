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

  it('lets her edit while in review and before the close date', () => {
    renderSummary();

    expect(screen.getByText('En revisión')).toBeVisible();
    expect(screen.getByText('https://youtu.be/x · Desde 0:08')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Editar inscripción' })).toBeEnabled();
  });

  it('disables editing after the close date', () => {
    renderSummary({ editable: false });

    expect(screen.getByText(/ya no puedes hacer cambios/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Editar inscripción' })).toBeDisabled();
  });

  it('shows "No aprobada" without any edit button', () => {
    renderSummary({ status: 'not_approved', editable: false });

    expect(screen.getByText('No aprobada')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Editar inscripción' })).toBeNull();
  });
});
