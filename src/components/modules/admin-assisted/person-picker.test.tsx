import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { PersonPicker } from './person-picker';

import '@core/i18n';

import type { PersonSearchResult } from '@core/api';

vi.mock('@contexts', () => ({ useOrPermissions: () => false }));

const minor: PersonSearchResult = { id: 'minor-1', full_name: 'Sofía Pérez', email: null, is_managed: true };
const adult: PersonSearchResult = { id: 'adult-1', full_name: 'Sofía Adulta', email: 's@correo.com' };

describe('PersonPicker', () => {
  afterEach(cleanup);

  it('flags a managed minor in the results', async () => {
    const search = vi.fn(async () => ({ ok: true, data: [minor, adult] }) as never);

    render(
      <MemoryRouter>
        <PersonPicker person={null} onSelect={vi.fn()} search={search} />
      </MemoryRouter>,
    );
    fireEvent.change(screen.getByPlaceholderText('Busca por nombre o correo'), { target: { value: 'sof' } });

    const minorRow = await screen.findByRole('button', { name: /Sofía Pérez/ }, { timeout: 2000 });

    expect(minorRow.textContent).toContain('Menor');
    expect(screen.getByRole('button', { name: /Sofía Adulta/ }).textContent).not.toContain('Menor');
  });

  it('tells the admin that a selected minor is reached through the guardian', () => {
    render(
      <MemoryRouter>
        <PersonPicker person={minor} onSelect={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByText('Menor')).toBeTruthy();
    expect(screen.getByText(/los avisos le llegan a su acudiente/)).toBeTruthy();
  });
});
