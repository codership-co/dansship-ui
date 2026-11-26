import { describe, expect, it } from 'vitest';

import esErrors from '../../../locales/es/errors.json';
import { DANSSHIP_ERROR_CATEGORY, DansshipAPIError } from '../dansship.error';

import {
  displayPrice,
  editorErrorPath,
  participantTypeFormValues,
  toParticipantTypeUpsert,
} from './participant-type.helpers';

import { landingType, typeAdmin } from '@components/modules/event-participation/participation.fixtures';

import type { LandingParticipantType, ParticipantTypeAdmin } from './participation.models';

function apiError(code: string, details: Record<string, unknown> = {}) {
  return new DansshipAPIError(
    { category: DANSSHIP_ERROR_CATEGORY.VALIDATION_ERROR, error_code: code, message: code, details } as never,
    422,
  );
}

describe('participant type helpers', () => {
  it('round-trips a type through the editor values', () => {
    const type: ParticipantTypeAdmin = typeAdmin({
      registration_options: [{ kind: 'pair', label: null }],
      quota: 16,
      closes_at: '2026-11-28T04:59:00Z',
      edit_days_before_event: 1,
      card_copy: { button_text: 'Inscribirme con mi pareja', title: null, text: null, closing_message: null },
    });
    const upsert = toParticipantTypeUpsert(participantTypeFormValues(type), type.available_notices);

    expect(upsert).toMatchObject({
      registration_options: [{ kind: 'pair', label: null }],
      requires_account: true,
      quota: 16,
      closes_at: '2026-11-27T23:59:00-05:00',
      edit_days_before_event: 1,
      card_copy: { button_text: 'Inscribirme con mi pareja', title: null },
      fees: type.fees,
      payment_plan: [],
      email_settings: null,
    });
  });

  it('drops money settings when the type takes no money and keeps only the chosen notices', () => {
    const values = participantTypeFormValues(typeAdmin({ available_notices: ['signup_approved', 'entry_pass'] }));
    const upsert = toParticipantTypeUpsert(
      {
        ...values,
        contribution_model: 'free',
        email_enabled: ['entry_pass'],
        pay_later_anchor: 'after_signup',
        pay_later_days: 3,
      },
      ['signup_approved', 'entry_pass'],
    );

    expect(upsert.fees).toEqual([]);
    expect(upsert.pay_later_deadline).toBeNull();
    expect(upsert.email_settings).toEqual({ enabled: ['entry_pass'], extra_message: null });
  });

  it('points save errors at the field the API names', () => {
    expect(editorErrorPath(apiError('EVENT_PARTICIPANT_TYPE_INVALID', { field: 'card_copy', key: 'title' }))).toBe(
      'card_copy.title',
    );
    expect(editorErrorPath(apiError('EVENT_PARTICIPANT_TYPE_UNSUPPORTED', { field: 'pricing_model' }))).toBe(
      'pricing_model',
    );
    expect(editorErrorPath(apiError('EVENT_PARTICIPANT_TYPE_INVALID', { field: 'closes_at' }))).toBe('closes_at_local');
    expect(
      editorErrorPath(
        apiError('EVENT_PARTICIPANT_TYPE_INVALID', {
          field: 'edit_days_before_event',
          reason: 'edit_deadline_before_close',
        }),
      ),
    ).toBe('edit_days_before_event');
    expect(editorErrorPath(apiError('EVENT_PAYMENT_PLAN_INVALID'))).toBe('payment_plan');
    expect(
      editorErrorPath(apiError('EVENT_REGISTRATION_OPTION_INVALID', { kind: 'group', reason: 'max_members' })),
    ).toBe('registration_options');
    expect(editorErrorPath(new Error('boom'))).toBeNull();
  });

  it('shows fee names and prices, packages "desde" and the minors row, never why a price applies', () => {
    const perPerson: LandingParticipantType = landingType({
      fees: [{ label: 'Público general', price: '10000' }],
      minors: { allowed: true, max_age: 12, per_adult_max: 3, price: '0' },
    });
    const packages = landingType({
      pricing_model: 'package',
      packages: [
        { id: 'p1', name: 'Básico', base_price: '580000', included_people: 6, additional_person_price: '97000' },
      ],
    });

    expect(displayPrice(perPerson, 'Menores')).toEqual([
      { label: 'Público general', price: 10000 },
      { label: 'Menores', price: null },
    ]);
    expect(displayPrice(packages, 'Menores')).toEqual([{ label: 'Básico', price: 580000, from: true }]);
  });

  it('has Spanish copy for every new error code the UI can receive', () => {
    const codes = [
      'EVENT_LEGACY_CREATE_CLOSED',
      'EVENT_PUBLISH_NO_ACTIVE_TYPE',
      'EVENT_SCHEDULE_REQUIRED',
      'EVENT_REGISTRATION_OPTION_REQUIRED',
      'EVENT_REGISTRATION_OPTION_INVALID',
      'EVENT_REGISTRATION_OPTION_IN_USE',
      'EVENT_TYPE_QUOTA_FULL',
      'EVENT_SIGNUP_NOT_PAYABLE',
      'EVENT_SIGNUP_NOT_REFUNDABLE',
      'EVENT_TICKET_EMAIL_TAKEN',
      'EVENT_FULL_ACCOUNT_REQUIRED',
      'EVENT_PRIVATE_SELF_SIGNUP',
      'EVENT_USE_ENROLLMENT',
      'EVENT_PARTICIPANT_TYPE_INVALID',
      'EVENT_PACKAGE_NOT_CONFIGURED',
      'EVENT_PAYMENT_PLAN_INVALID',
      'EVENT_GROUP_SIZE_INVALID',
      'EVENT_TYPE_LABEL_DUPLICATED',
      'EVENT_TYPE_LABEL_NOT_OFFERED',
      'EVENT_VISIBILITY_UNSUPPORTED',
      'EVENT_INVITE_NOT_AVAILABLE',
      'EVENT_DUPLICATE_UNSUPPORTED',
      'EVENT_ENROLLMENT_INVALID',
      'EVENT_PROOF_KEY_INVALID',
      'EVENT_INSTALLMENT_TRANSFER_ONLY',
      'PARTNER_NOT_FOUND',
      'PAYMENT_IDEMPOTENCY_CONFLICT',
    ];
    const copy = esErrors.codes as Record<string, string>;

    expect(codes.filter(code => !copy[code])).toEqual([]);
  });
});
