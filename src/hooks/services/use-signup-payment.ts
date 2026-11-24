import { useCallback } from 'react';

import { DansshipAPI, nextPayableSequences, type MyParticipationRow } from '@core/api';

/**
 * What "Pagar" opens from Mis reservas, by `pay_action`:
 * a deposit or next installments (`/installments/pay`), or the whole amount (`/pay`).
 */
export const useSignupPayment = (row: MyParticipationRow) => {
  const usesInstallments = (row.installments?.length ?? 0) > 0;

  /** Installments are transfers with proof (`EVENT_INSTALLMENT_TRANSFER_ONLY`); a whole payment takes the chosen method. */
  const openPayment = useCallback(
    async (paymentMethodType: string) => {
      if (!row.signup_id) {
        return null;
      }

      const result = usesInstallments
        ? await DansshipAPI.participation.paySignupInstallments(row.signup_id, nextPayableSequences(row))
        : await DansshipAPI.participation.paySignup(row.signup_id, paymentMethodType);

      return result;
    },
    [row, usesInstallments],
  );

  return { openPayment, usesInstallments };
};
