import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it } from 'vitest';

import { ArtistSignupCard } from './artist-signup-card';

import '@core/i18n';

import type { LandingParticipantType } from '@core/api';

const type: LandingParticipantType = {
  id: 'type-1',
  name: 'Artistas',
  registration_mode: 'single_or_group',
  state: 'open',
  closes_at: '2026-11-28T04:59:00Z',
  requires_account: true,
  fees: [],
  minors: { allowed: true, max_age: 18, per_adult_max: null },
  terms: null,
  my_signup_id: null,
};

function renderCard(overrides: Partial<LandingParticipantType> = {}) {
  return render(
    <MemoryRouter>
      <ArtistSignupCard slug='clausura' type={{ ...type, ...overrides }} accessToken='tok' />
    </MemoryRouter>,
  );
}

describe('ArtistSignupCard', () => {
  afterEach(cleanup);

  it('invites to register until the close date', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: '¿Te vas a presentar?' })).toBeVisible();
    expect(screen.getByText(/viernes, 27 de noviembre|viernes 27 de noviembre/)).toBeVisible();
    expect(screen.getByRole('button', { name: 'Inscribirme como artista' })).toBeEnabled();
  });

  it('shows the closed variant with a contact link', () => {
    renderCard({ state: 'closed' });

    expect(screen.getByRole('heading', { name: 'Las inscripciones de artistas ya cerraron' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Escríbenos' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Inscribirme como artista' })).toBeNull();
  });

  it('opens the existing registration', () => {
    renderCard({ my_signup_id: 'signup-1' });

    expect(screen.getByRole('button', { name: 'Ver inscripción' })).toBeVisible();
  });
});
