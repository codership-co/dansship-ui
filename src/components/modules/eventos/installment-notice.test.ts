import { describe, expect, it } from 'vitest';

import { paymentNotice } from './installment-notice';

import i18n from '@core/i18n';

const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

const singlePayment = 'La inscripción a este evento es de pago único y no reembolsable, una vez confirmada.';
const comboPayment = 'La inscripción al combo es de pago único y no reembolsable, una vez confirmada.';
const checkoutPayment =
  'Esta compra es de pago único y no reembolsable. No hay opción de cancelar una vez confirmado el pago.';

describe('paymentNotice', () => {
  it('keeps the single-payment landing notice', () => {
    expect(
      paymentNotice({ kind: 'event', installmentDueDates: [], hasInstallmentAmounts: false, surface: 'landing' }, t),
    ).toBe(singlePayment);
  });

  it('keeps the combo landing notice', () => {
    expect(
      paymentNotice({ kind: 'combo', installmentDueDates: [], hasInstallmentAmounts: false, surface: 'landing' }, t),
    ).toBe(comboPayment);
  });

  it('keeps the single-payment checkout notice', () => {
    expect(
      paymentNotice({ kind: 'event', installmentDueDates: [], hasInstallmentAmounts: false, surface: 'checkout' }, t),
    ).toBe(checkoutPayment);
  });

  it('builds the recital schedule from the due dates', () => {
    expect(
      paymentNotice(
        {
          kind: 'event',
          installmentDueDates: ['2026-10-31', '2026-11-27'],
          hasInstallmentAmounts: true,
          surface: 'landing',
        },
        t,
      ),
    ).toBe(
      'Pagas en 2 cuotas: la primera vence el 31 de octubre y la segunda el 27 de noviembre. Una vez confirmada tu inscripción, lo pagado no es reembolsable.',
    );
  });

  it('updates the count and dates when the schedule changes', () => {
    expect(
      paymentNotice(
        {
          kind: 'event',
          installmentDueDates: ['2026-10-31', '2026-11-15', '2026-11-27'],
          hasInstallmentAmounts: true,
          surface: 'checkout',
        },
        t,
      ),
    ).toBe(
      'Pagas en 3 cuotas: la primera vence el 31 de octubre, la segunda el 15 de noviembre y la tercera el 27 de noviembre. Una vez confirmada tu inscripción, lo pagado no es reembolsable.',
    );
  });

  it('renders nothing when an installment event has no due dates yet', () => {
    expect(
      paymentNotice({ kind: 'event', installmentDueDates: [], hasInstallmentAmounts: true, surface: 'landing' }, t),
    ).toBeNull();
    expect(paymentNotice({ kind: 'event', hasInstallmentAmounts: true, surface: 'checkout' }, t)).toBeNull();
  });
});
