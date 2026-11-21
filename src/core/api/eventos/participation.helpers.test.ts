import { describe, expect, it } from 'vitest';

import {
  answerText,
  bogotaLocalToIso,
  isFieldVisible,
  isoToBogotaLocal,
  participantAccessLink,
  signupStatusTone,
  splitLandingTypes,
} from './participation.helpers';

import type { LandingParticipation, ParticipantField } from './participation.models';

const t = (key: string) => key;

describe('participation helpers', () => {
  it('converts a Bogotá local time to an instant and back', () => {
    expect(bogotaLocalToIso('2026-11-27T23:59')).toBe('2026-11-27T23:59:00-05:00');
    expect(isoToBogotaLocal('2026-11-28T04:59:00Z')).toBe('2026-11-27T23:59');
    expect(bogotaLocalToIso('')).toBeNull();
    expect(isoToBogotaLocal(null)).toBe('');
  });

  it('shows a conditional field only for its value', () => {
    const field = {
      key: 'members',
      label: 'Integrantes',
      kind: 'people',
      required: true,
      options: {},
      visible_when: { field_key: 'act_type', equals: 'Baile' },
    } as ParticipantField;

    expect(isFieldVisible(field, { act_type: 'Baile' })).toBe(true);
    expect(isFieldVisible(field, { act_type: 'Lira' })).toBe(false);
    expect(isFieldVisible({ ...field, visible_when: null }, {})).toBe(true);
  });

  it('renders answers as plain text', () => {
    expect(answerText({ url: 'https://youtu.be/x', note: '0:08' }, t)).toBe('https://youtu.be/x · 0:08');
    expect(answerText(true, t)).toBe('eventos:participation.yes');
    expect(answerText(['a', 'b'], t)).toBe('a, b');
    expect(answerText('', t)).toBe('—');
  });

  it('builds the artists link on the same event page', () => {
    expect(participantAccessLink('https://dansship.com', 'clausura', 'a b')).toBe(
      'https://dansship.com/eventos/clausura?acceso=a%20b',
    );
    expect(participantAccessLink('https://dansship.com', 'clausura', null)).toBeNull();
  });

  it('groups statuses by tone and splits landing types', () => {
    expect(signupStatusTone('not_approved')).toBe('rejected');
    expect(signupStatusTone('pending_payment')).toBe('review');
    const participation = {
      types: [
        { id: '1', registration_mode: 'single_or_group' },
        { id: '2', registration_mode: 'multi_ticket' },
      ],
    } as LandingParticipation;

    const split = splitLandingTypes(participation);

    expect(split.registrations.map(type => type.id)).toEqual(['1']);
    expect(split.tickets.map(type => type.id)).toEqual(['2']);
  });
});
