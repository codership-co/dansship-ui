import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AuthProvider } from '@contexts';
import { DansshipAPI, type User } from '@core/api';
import { AUTH_SESSION_KEY } from '@core/constants';
import '@core/i18n';
import { SecureHalloweenPage } from '@pages/halloween.page';

vi.mock('../contexts/feature-flags.context', () => ({
  FEATURE_FLAG: { areAdminPagesEnabled: 'areAdminPagesEnabled' },
  useEnabledFeatureFlag: () => true,
}));

const staff: User = {
  id: 'staff-1',
  username: 'staff',
  baseProfileRedirect: '/',
  email: 'staff@example.com',
  name: 'Staff',
  isAdmin: false,
  isInstructor: false,
  isCoach: false,
  roles: ['staff'],
  permissions: ['create:order'],
  requiresOnboarding: false,
  onboardingCompleted: true,
  mustChangePassword: false,
  preferredLanguage: 'es',
  joinDate: '2026-01-01T00:00:00.000Z',
  level: 'Beginner',
};

describe('SecureHalloweenPage', () => {
  beforeEach(() => {
    localStorage.setItem(AUTH_SESSION_KEY, '1');
    vi.spyOn(DansshipAPI.auth, 'getProfile').mockResolvedValue(staff);
  });

  it('renders the unauthorized page for someone who cannot spin the wheel', async () => {
    render(
      <MemoryRouter initialEntries={['/halloween']}>
        <AuthProvider>
          <SecureHalloweenPage />
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('¡Alto ahí! No tienes autorización')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Noche de disfraces' })).not.toBeInTheDocument();
    });
  });
});
