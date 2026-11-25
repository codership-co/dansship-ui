import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ListPagination } from './list-pagination';

import '@core/i18n';

describe('ListPagination', () => {
  afterEach(cleanup);

  it('is hidden when everything fits in one page', () => {
    const { container } = render(<ListPagination page={1} pageSize={20} total={20} onPageChange={vi.fn()} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('moves between pages and stops at the ends', () => {
    const onPageChange = vi.fn();

    render(<ListPagination page={1} pageSize={20} total={45} onPageChange={onPageChange} />);

    expect(screen.getByText('Página 1 de 3')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});
