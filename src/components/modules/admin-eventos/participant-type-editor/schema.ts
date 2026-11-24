import { type TFunction } from 'i18next';
import { z } from 'zod';

import { chargesMoney, toNumber, type ParticipantTypeFormValues } from '@core/api';

/** API limits of the card copy ("Cómo se ve"). */
export const CARD_COPY_LIMITS = { button_text: 40, title: 80, text: 600, closing_message: 600 } as const;
export const EXTRA_MESSAGE_LIMIT = 500;

/**
 * Client checks of the generic editor: only what the admin can fix before saving.
 * Every other rule is the API's (its errors land on the field named in `details.field`).
 */
export const createParticipantTypeSchema = (t: TFunction) =>
  z.custom<ParticipantTypeFormValues>().superRefine((values, ctx) => {
    const issue = (path: Array<string | number>, message: string) => ctx.addIssue({ code: 'custom', path, message });

    if (!values.name.trim()) {
      issue(['name'], t('eventos:participation.editor.nameRequired'));
    }

    if (values.registration_options.length === 0) {
      issue(['registration_options'], t('eventos:participation.editor.noOptionError'));
    }

    (Object.keys(CARD_COPY_LIMITS) as Array<keyof typeof CARD_COPY_LIMITS>).forEach(key => {
      if ((values.card_copy[key] ?? '').length > CARD_COPY_LIMITS[key]) {
        issue(['card_copy', key], t('eventos:participation.editor.tooLong', { max: CARD_COPY_LIMITS[key] }));
      }
    });

    if (values.email_extra_message.length > EXTRA_MESSAGE_LIMIT) {
      issue(['email_extra_message'], t('eventos:participation.editor.tooLong', { max: EXTRA_MESSAGE_LIMIT }));
    }

    if (values.minors_allowed && !values.minor_max_age) {
      issue(['minor_max_age'], t('eventos:participation.editor.minorMaxAgeRequired'));
    }

    if (!chargesMoney(values.contribution_model)) {
      return;
    }

    if (values.pricing_model === 'per_person' && !values.fees.some(fee => fee.condition_type === null)) {
      issue(['fees'], t('eventos:participation.editor.feesRequired'));
    }

    if (values.pricing_model === 'package' && values.packages.length === 0) {
      issue(['packages'], t('eventos:participation.editor.packagesRequired'));
    }

    if (values.payment_mode !== 'installments') {
      return;
    }

    if (values.payment_plan.length === 0) {
      issue(['payment_plan'], t('eventos:participation.editor.installmentsRequired'));

      return;
    }

    const byPercent = values.pricing_model === 'package' || values.plan_unit === 'percent';
    const sum = values.payment_plan.reduce((total, line) => total + (toNumber(line.percent ?? 0) || 0), 0);

    if (byPercent && Math.round(sum * 100) !== 10000) {
      issue(['payment_plan'], t('eventos:participation.editor.percentSum', { sum }));
    }
  });
