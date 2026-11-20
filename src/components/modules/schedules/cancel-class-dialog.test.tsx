import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CancelClassDialog } from './cancel-class-dialog';

import '@core/i18n';

function renderDialog(props: { isPastClass?: boolean; onConfirm?: (note: string | null) => void } = {}) {
  const onConfirm = props.onConfirm ?? vi.fn();

  render(<CancelClassDialog open onOpenChange={vi.fn()} onConfirm={onConfirm} isPastClass={props.isPastClass} />);

  return { onConfirm };
}

function confirmButton() {
  return screen.getByRole('button', { name: 'Cancelar Clase' });
}

describe('CancelClassDialog', () => {
  afterEach(cleanup);

  it('lets an upcoming class be cancelled without a note', () => {
    const { onConfirm } = renderDialog();

    expect(screen.queryByText(/Esta clase ya ocurrió/)).not.toBeInTheDocument();
    fireEvent.click(confirmButton());

    expect(onConfirm).toHaveBeenCalledWith(null);
  });

  it('warns and requires a note for a class that already happened', () => {
    const { onConfirm } = renderDialog({ isPastClass: true });

    expect(screen.getByText(/no contará para el pago del instructor/)).toBeInTheDocument();
    expect(confirmButton()).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } });
    expect(confirmButton()).toBeDisabled();

    fireEvent.change(screen.getByRole('textbox'), { target: { value: '  Instructor llegó tarde  ' } });
    expect(confirmButton()).toBeEnabled();

    fireEvent.click(confirmButton());
    expect(onConfirm).toHaveBeenCalledWith('Instructor llegó tarde');
  });
});
