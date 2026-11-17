import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BenefitWindowsPanel } from './benefit-windows-panel';

import { DansshipAPI, type BenefitWindow, type PromotionWindowTerms } from '@core/api';
import '@core/i18n';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const trial: BenefitWindow = {
  id: 'trial',
  code: 'TRIAL_CLASS',
  name: 'Clase de prueba',
  is_active: true,
  starts_on: '2026-09-01',
  ends_on: '2026-12-31',
};

const blackFriday: BenefitWindow = {
  id: 'bf',
  code: 'BLACK_FRIDAY_2026',
  name: 'Black Friday 2026',
  is_active: true,
  starts_on: '2026-11-26',
  ends_on: '2026-11-30',
};

const blackFridayTerms: PromotionWindowTerms = {
  definition_id: 'bf',
  code: 'BLACK_FRIDAY_2026',
  discount_percentage: '30.00',
  discount_modes: ['monthly'],
  exclusive: true,
  current: {
    id: 'v2',
    version: 2,
    title: 'Black Friday 2026',
    file_url: 'https://cdn.example.com/misc/promotion-terms/bf/v2.pdf',
    created_at: '2026-11-12T20:40:00Z',
    created_by_name: 'Admin',
  },
};

describe('BenefitWindowsPanel promotions', () => {
  beforeEach(() => {
    vi.spyOn(DansshipAPI.benefitsAdmin, 'listWindows').mockResolvedValue({
      ok: true,
      data: [trial, blackFriday],
    } as never);
    vi.spyOn(DansshipAPI.benefitsAdmin, 'listPromotionWindowTerms').mockResolvedValue({
      ok: true,
      data: [blackFridayTerms],
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists the promotion as one more row with its read-only percentage and no editable value', async () => {
    render(<BenefitWindowsPanel />);

    expect(await screen.findByText('Black Friday 2026')).toBeInTheDocument();
    expect(screen.getByText('BLACK_FRIDAY_2026')).toBeInTheDocument();
    expect(
      screen.getByText('30 % en planes mensuales · Exclusiva (no se combina con otros descuentos)'),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/porcentaje|descuento/i)).not.toBeInTheDocument();
  });

  it('offers the terms editor on the promotion row only', async () => {
    render(<BenefitWindowsPanel />);

    await screen.findByText('Black Friday 2026');
    await waitFor(() => expect(screen.getAllByLabelText('Elegir PDF')).toHaveLength(1));

    const row = screen.getByText('Black Friday 2026').closest('tbody')!;

    expect(within(row).getByRole('link', { name: 'Ver PDF actual' })).toHaveAttribute(
      'href',
      blackFridayTerms.current?.file_url,
    );
    expect(screen.getByText('Versión 2')).toBeInTheDocument();
  });

  it('uploads the PDF and saves its key for that promotion as a new version', async () => {
    const upload = vi
      .spyOn(DansshipAPI.benefitsAdmin, 'uploadWindowTermsPdf')
      .mockResolvedValue('misc/promotion-terms/bf/new.pdf');
    const save = vi.spyOn(DansshipAPI.benefitsAdmin, 'saveWindowTerms').mockResolvedValue({
      ok: true,
      data: { ...blackFridayTerms.current, version: 3 },
    } as never);

    render(<BenefitWindowsPanel />);

    const input = await screen.findByLabelText('Elegir PDF');
    const pdf = new File(['%PDF-1.4'], 'terminos.pdf', { type: 'application/pdf' });

    fireEvent.change(input, { target: { files: [pdf] } });
    fireEvent.click(screen.getByRole('button', { name: 'Guardar términos' }));

    await waitFor(() =>
      expect(save).toHaveBeenCalledWith('bf', {
        title: 'Black Friday 2026',
        file_key: 'misc/promotion-terms/bf/new.pdf',
      }),
    );
    expect(upload).toHaveBeenCalledWith('bf', pdf);
  });
});
