import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { WindowTermsEditor } from './window-terms-editor';

import '@core/i18n';

import type { PromotionWindowTerms, WindowTermsVersion } from '@core/api';

const version2: WindowTermsVersion = {
  id: 'v2',
  version: 2,
  title: 'Black Friday 2026',
  file_url: 'https://cdn.example.com/misc/promotion-terms/bf/v2.pdf',
  created_at: '2026-11-12T20:40:00Z',
  created_by_name: 'Admin',
};

const version1: WindowTermsVersion = {
  ...version2,
  id: 'v1',
  version: 1,
  file_url: 'https://cdn.example.com/misc/promotion-terms/bf/v1.pdf',
};

function entry(current: WindowTermsVersion | null): PromotionWindowTerms {
  return {
    definition_id: 'bf',
    code: 'BLACK_FRIDAY_2026',
    discount_percentage: 30,
    discount_modes: ['monthly'],
    exclusive: true,
    current,
  };
}

function renderEditor(current: WindowTermsVersion | null) {
  const onSave = vi.fn().mockResolvedValue(true);
  const loadVersions = vi.fn().mockResolvedValue([version2, version1]);

  render(
    <WindowTermsEditor
      promotionName='Black Friday 2026'
      entry={entry(current)}
      isSaving={false}
      onSave={onSave}
      loadVersions={loadVersions}
    />,
  );

  return { onSave, loadVersions };
}

function pickPdf(name = 'terminos.pdf', type = 'application/pdf') {
  const file = new File(['%PDF-1.4'], name, { type });

  fireEvent.change(screen.getByLabelText(/Elegir PDF|Reemplazar archivo/), { target: { files: [file] } });

  return file;
}

describe('WindowTermsEditor', () => {
  afterEach(cleanup);

  it('links the current PDF and says what saving will do', () => {
    renderEditor(version2);

    expect(screen.getByRole('link', { name: 'Ver PDF actual' })).toHaveAttribute('href', version2.file_url);
    expect(screen.getByText('Versión 2')).toBeInTheDocument();
    expect(screen.getByText(/subida el .* por Admin\. Al guardar se crea la versión 3/)).toBeInTheDocument();
  });

  it('saves the chosen PDF under the promotion name and only once a file is chosen', async () => {
    const { onSave } = renderEditor(version2);
    const save = screen.getByRole('button', { name: 'Guardar términos' });

    expect(save).toBeDisabled();

    const file = pickPdf();

    expect(save).toBeEnabled();

    fireEvent.click(save);

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Black Friday 2026', file));
  });

  it('removes the terms without a file, which removes the checkbox from checkout', async () => {
    const { onSave } = renderEditor(version2);

    fireEvent.click(screen.getByRole('button', { name: 'Quitar términos' }));

    await waitFor(() => expect(onSave).toHaveBeenCalledWith('Black Friday 2026', null));
  });

  it('explains that no PDF means no checkbox before a first version exists', () => {
    renderEditor(null);

    expect(screen.getByText('Sin versión')).toBeInTheDocument();
    expect(screen.getByText('Sin PDF no se pide casilla en el checkout.')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Ver PDF actual' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Quitar términos' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Historial de versiones' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Guardar términos' })).toBeDisabled();
  });

  it('lists every saved version with its PDF, newest first, in the history dialog', async () => {
    const { loadVersions } = renderEditor(version2);

    fireEvent.click(screen.getByRole('button', { name: 'Historial de versiones' }));

    const dialog = await screen.findByRole('dialog');

    await waitFor(() => expect(within(dialog).getAllByText(/^Versión \d ·/)).toHaveLength(2));
    expect(loadVersions).toHaveBeenCalledTimes(1);

    const headings = within(dialog)
      .getAllByText(/^Versión \d ·/)
      .map(node => node.textContent);

    expect(headings[0]).toMatch(/^Versión 2/);
    expect(headings[1]).toMatch(/^Versión 1/);

    const links = within(dialog).getAllByRole('link', { name: 'Ver PDF' });

    expect(links.map(link => link.getAttribute('href'))).toEqual([version2.file_url, version1.file_url]);
  });
});
