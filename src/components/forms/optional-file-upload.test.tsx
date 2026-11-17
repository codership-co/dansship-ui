import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { OptionalFileUpload } from './optional-file-upload';

import '@core/i18n';

const PDF = ['application/pdf'];

describe('OptionalFileUpload', () => {
  const createObjectURL = vi.fn(() => 'blob:picked');
  const revokeObjectURL = vi.fn();

  beforeEach(() => {
    Object.assign(URL, { createObjectURL, revokeObjectURL });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('forgets the picked file when the parent resets its value, and releases the blob URL', () => {
    const file = new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' });
    const view = render(<OptionalFileUpload value={null} acceptedTypes={PDF} showPreview={false} onChange={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Subir archivo'), { target: { files: [file] } });
    view.rerender(<OptionalFileUpload value={file} acceptedTypes={PDF} showPreview={false} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Reemplazar archivo')).toBeInTheDocument();

    view.rerender(<OptionalFileUpload value={null} acceptedTypes={PDF} showPreview={false} onChange={vi.fn()} />);

    expect(screen.getByLabelText('Subir archivo')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Eliminar' })).not.toBeInTheDocument();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:picked');
  });

  it('releases the previous blob URL when another file replaces it', () => {
    render(<OptionalFileUpload acceptedTypes={PDF} showPreview={false} onChange={vi.fn()} />);

    const first = new File(['%PDF-1.4'], 'a.pdf', { type: 'application/pdf' });
    const second = new File(['%PDF-1.4'], 'b.pdf', { type: 'application/pdf' });

    fireEvent.change(screen.getByLabelText('Subir archivo'), { target: { files: [first] } });
    fireEvent.change(screen.getByLabelText('Reemplazar archivo'), { target: { files: [second] } });

    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
  });
});
