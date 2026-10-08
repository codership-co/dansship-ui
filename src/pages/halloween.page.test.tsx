import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import '@core/i18n';
import { HalloweenPage } from '@pages/halloween.page';

describe('HalloweenPage', () => {
  it('reveals the free class and resets for the next person', () => {
    render(<HalloweenPage />);

    expect(screen.getByRole('heading', { name: 'Noche de disfraces' })).toBeInTheDocument();
    expect(screen.getAllByText(/Clase/)).toHaveLength(2);
    expect(screen.getByText('Dulce')).toBeInTheDocument();
    expect(screen.getByText('Abrazo')).toBeInTheDocument();

    const spin = screen.getByRole('button', { name: 'Girar' });
    expect(spin).toBeEnabled();

    fireEvent.click(spin);

    expect(spin).toBeDisabled();
    expect(screen.queryByRole('heading', { name: '1 clase adicional gratis' })).not.toBeInTheDocument();

    fireEvent.transitionEnd(screen.getByTestId('halloween-wheel'));

    expect(screen.getByRole('heading', { name: '1 clase adicional gratis' })).toBeInTheDocument();
    expect(spin).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Siguiente persona' }));

    expect(screen.queryByRole('heading', { name: '1 clase adicional gratis' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Girar' })).toBeEnabled();
  });
});
