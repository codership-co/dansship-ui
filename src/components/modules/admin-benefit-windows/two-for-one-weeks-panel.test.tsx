import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { BenefitWindowsPanel } from './benefit-windows-panel';
import { TwoForOneWeeksPanel } from './two-for-one-weeks-panel';

import {
  DansshipAPI,
  DANSSHIP_ERROR_CATEGORY,
  DANSSHIP_ERROR_CODE,
  DansshipAPIError,
  type BenefitWindow,
  type TwoForOneWeek,
} from '@core/api';
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

const twoForOne: BenefitWindow = {
  id: 'promo',
  code: 'TWO_FOR_ONE',
  name: 'Clase Jueves 2x1',
  is_active: true,
  starts_on: '2026-09-01',
  ends_on: '2026-10-02',
};

const openWeek: TwoForOneWeek = {
  id: 'week-open',
  week_start_date: '2026-11-02',
  week_end_date: '2026-11-08',
  status: 'draft',
  promo_date: null,
  locked: false,
};

const lockedWeek: TwoForOneWeek = {
  id: 'week-locked',
  week_start_date: '2026-10-26',
  week_end_date: '2026-11-01',
  status: 'published',
  promo_date: '2026-10-29',
  locked: true,
};

function openSelect(combobox: HTMLElement) {
  combobox.focus();
  fireEvent.keyDown(combobox, { key: 'ArrowDown', code: 'ArrowDown' });
}

function lockedError(): DansshipAPIError {
  return new DansshipAPIError(
    {
      category: DANSSHIP_ERROR_CATEGORY.CONFLICT,
      error_code: DANSSHIP_ERROR_CODE.TWO_FOR_ONE_WEEK_LOCKED,
      message: 'locked',
      status: 409,
      timestamp: '2026-10-30T00:00:00Z',
      path: '/admin/benefits/two-for-one-weeks/week-open',
      details: { next_action: '', resend_verification_endpoint: '' },
      request_id: null,
      trace_id: null,
    },
    409,
  );
}

describe('2x1 promotions', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = () => undefined;
    vi.spyOn(DansshipAPI.benefitsAdmin, 'listWindows').mockResolvedValue({
      ok: true,
      data: [trial, twoForOne],
    } as never);
    vi.spyOn(DansshipAPI.benefitsAdmin, 'listTwoForOneWeeks').mockResolvedValue({
      ok: true,
      data: [lockedWeek, openWeek],
    } as never);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('shows a switch and no date fields for the 2x1 window', async () => {
    render(<BenefitWindowsPanel />);

    expect(await screen.findByText('2x1')).toBeTruthy();
    expect(screen.getAllByText('Se define por semana')).toHaveLength(2);
    expect(screen.getAllByRole('switch')).toHaveLength(2);
    expect(screen.getAllByLabelText('Desde')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: 'Guardar' })).toBeTruthy();
    const promoRow = screen.getByText('TWO_FOR_ONE').closest('tr') as HTMLElement;
    expect(within(promoRow).queryByLabelText('Desde')).toBeNull();
    expect(within(promoRow).queryByRole('button', { name: 'Guardar' })).toBeNull();
  });

  it('renders locked weeks and sends the chosen day', async () => {
    const setWeek = vi.spyOn(DansshipAPI.benefitsAdmin, 'setTwoForOneWeek').mockResolvedValue({
      ok: true,
      data: { ...openWeek, promo_date: '2026-11-03' },
    } as never);
    render(<TwoForOneWeeksPanel />);

    expect(await screen.findByText('Esta semana ya tiene reservas y no se puede cambiar')).toBeTruthy();
    const lockedRow = screen.getByText('Publicada').closest('tr') as HTMLElement;
    expect(within(lockedRow).getByRole('combobox')).toBeDisabled();
    expect(within(lockedRow).getByRole('button', { name: 'Quitar' })).toBeDisabled();

    const openRow = screen.getByText('Borrador').closest('tr') as HTMLElement;
    openSelect(within(openRow).getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: /3 de nov/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(setWeek).toHaveBeenCalledWith('week-open', { promo_date: '2026-11-03' });
    });
  });

  it('clears a day and maps a locked error', async () => {
    const weekWithDay: TwoForOneWeek = { ...openWeek, promo_date: '2026-11-04' };
    vi.spyOn(DansshipAPI.benefitsAdmin, 'listTwoForOneWeeks').mockResolvedValue({
      ok: true,
      data: [weekWithDay],
    } as never);
    const clearWeek = vi.spyOn(DansshipAPI.benefitsAdmin, 'clearTwoForOneWeek').mockResolvedValue({
      ok: true,
      data: { ...weekWithDay, promo_date: null },
    } as never);
    const { toast } = await import('sonner');
    const { unmount } = render(<TwoForOneWeeksPanel />);

    fireEvent.click(await screen.findByRole('button', { name: 'Quitar' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(clearWeek).toHaveBeenCalledWith('week-open');
    });

    unmount();
    vi.spyOn(DansshipAPI.benefitsAdmin, 'setTwoForOneWeek').mockResolvedValue({
      ok: false,
      error: lockedError(),
    } as never);
    render(<TwoForOneWeeksPanel />);
    const row = (await screen.findByText('Borrador')).closest('tr') as HTMLElement;
    openSelect(within(row).getByRole('combobox'));
    fireEvent.click(await screen.findByRole('option', { name: /5 de nov/i }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirmar' }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Esta semana ya tiene reservas y no se puede cambiar.');
    });
  });
});
