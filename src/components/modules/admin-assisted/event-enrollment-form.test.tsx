import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { EventEnrollmentForm } from './event-enrollment-form';

import { typeAdmin } from '@components/modules/event-participation/participation.fixtures';
import { DansshipAPI, type ParticipantTermsVersion, type ParticipantTypeAdmin } from '@core/api';
import '@core/i18n';

const ok = <T,>(data: T) => ({ ok: true, data, status: 200, error: null }) as never;
const person = { id: 'user-1', full_name: 'Ana Gómez', email: 'ana@example.com' };
const terms: ParticipantTermsVersion = {
  id: 'terms-1',
  version: 1,
  title: 'Términos',
  file_url: 'https://cdn.test/terms.pdf',
  created_at: '2026-11-20T00:00:00Z',
};

function paidQuote(deposit = 532000, total = 1064000) {
  return ok({ charges_money: true, total, discount_percent: 5, deposit, balance: total - deposit, lines: [] });
}

function renderForm(type: ParticipantTypeAdmin, termsVersions: Array<ParticipantTermsVersion> = []) {
  vi.spyOn(DansshipAPI.participationAdmin, 'listTypes').mockResolvedValue(ok([type]));
  vi.spyOn(DansshipAPI.participationAdmin, 'listEventTerms').mockResolvedValue(ok(termsVersions));

  return render(
    <MemoryRouter>
      <EventEnrollmentForm eventId='event-1' eventName='Despedida de Ana' person={person} />
    </MemoryRouter>,
  );
}

describe('EventEnrollmentForm', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    vi.spyOn(DansshipAPI.participationAdmin, 'quoteEnrollment').mockResolvedValue(paidQuote());
    vi.spyOn(DansshipAPI.participationAdmin, 'enroll').mockResolvedValue(
      ok({
        signup_id: 'signup-1',
        user_id: 'user-1',
        status: 'confirmed',
        purchase_id: 'p-1',
        payment_intent_id: 'pi-1',
        pay_by: null,
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('quotes total, discount, deposit and balance, and enrolls "Sí, ya pagó" with the proof', async () => {
    const upload = vi
      .spyOn(DansshipAPI.eventosAdmin, 'uploadInstallmentProof')
      .mockResolvedValue(ok({ upload_url: 'https://s3', file_key: 'proofs/admin/1.pdf' }));
    const { container } = renderForm(typeAdmin());

    expect(await screen.findByText('Anticipo (se paga ahora)')).toBeVisible();
    expect(screen.getByText('5 %')).toBeVisible();
    expect(DansshipAPI.participationAdmin.quoteEnrollment).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({ participant_type_id: 'type-1', user_id: 'user-1', payment: null }),
    );
    const input = container.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [new File(['x'], 'pago.pdf', { type: 'application/pdf' })] } });
    fireEvent.click(await screen.findByRole('button', { name: 'Aprobar pago e inscribir' }));

    await waitFor(() => expect(DansshipAPI.participationAdmin.enroll).toHaveBeenCalledTimes(1));
    expect(upload).toHaveBeenCalledTimes(1);
    expect(DansshipAPI.participationAdmin.enroll).toHaveBeenCalledWith(
      'event-1',
      expect.objectContaining({
        payment: 'paid',
        proof_key: 'proofs/admin/1.pdf',
        idempotency_key: expect.any(String),
      }),
    );
  });

  it('enrolls "No, paga después" with a pending payment until the deadline', async () => {
    vi.mocked(DansshipAPI.participationAdmin.enroll).mockResolvedValue(
      ok({
        signup_id: 's',
        user_id: 'user-1',
        status: 'pending_payment',
        purchase_id: 'p',
        payment_intent_id: null,
        pay_by: '2026-11-26T05:00:00Z',
      }),
    );
    renderForm(typeAdmin());

    fireEvent.click(await screen.findByRole('radio', { name: 'No, paga después' }));
    fireEvent.click(screen.getByRole('button', { name: 'Inscribir con pago pendiente' }));

    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.enroll).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({ payment: 'pay_later' }),
      ),
    );
    expect(await screen.findByText(/con pago pendiente hasta el/)).toBeVisible();
  });

  it('enrolls a free type with no payment question', async () => {
    vi.mocked(DansshipAPI.participationAdmin.quoteEnrollment).mockResolvedValue(
      ok({ charges_money: false, total: 0, discount_percent: null, deposit: 0, balance: 0, lines: [] }),
    );
    renderForm(typeAdmin({ contribution_model: 'free', fees: [] }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Inscribir' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Inscribir' }));

    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.enroll).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({ payment: null }),
      ),
    );
    expect(screen.queryByText('¿Ya pagó? *')).toBeNull();
  });

  it('asks to record the terms only when the event has a PDF, checked by default', async () => {
    vi.mocked(DansshipAPI.participationAdmin.quoteEnrollment).mockResolvedValue(
      ok({ charges_money: false, total: 0, discount_percent: null, deposit: 0, balance: 0, lines: [] }),
    );
    renderForm(typeAdmin({ contribution_model: 'free', fees: [] }), [terms]);

    const checkbox = await screen.findByRole('checkbox', { name: 'Registrar los términos como aceptados' });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Inscribir' })).toBeEnabled());
    fireEvent.click(screen.getByRole('button', { name: 'Inscribir' }));

    await waitFor(() =>
      expect(DansshipAPI.participationAdmin.enroll).toHaveBeenCalledWith(
        'event-1',
        expect.objectContaining({ record_terms_acceptance: false }),
      ),
    );
  });

  it('does not ask about terms without a PDF', async () => {
    renderForm(typeAdmin());

    expect(await screen.findByText('Anticipo (se paga ahora)')).toBeVisible();
    expect(screen.queryByRole('checkbox', { name: 'Registrar los términos como aceptados' })).toBeNull();
  });
});
