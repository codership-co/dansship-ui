import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';

import { Footer } from '@components/navigation/footer';
import { PageURLS } from '@core/constants';
import '@core/i18n';
import { LocationPage } from '@pages/location.page';

describe('LocationPage', () => {
  it('renders for a logged-out visitor without an auth wrapper', () => {
    render(
      <MemoryRouter>
        <LocationPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Ubicación del estudio' })).toBeInTheDocument();
  });
});

describe('Footer location link', () => {
  it('points to the public location route', () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: /Ubicación/ })).toHaveAttribute('href', PageURLS.location);
  });
});
