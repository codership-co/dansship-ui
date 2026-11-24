import { describe, expect, it } from 'vitest';

import {
  answerText,
  bogotaLocalToIso,
  isFieldVisible,
  isoToBogotaLocal,
  configuredParticipationRows,
  nextPayableSequences,
  signupStatusTone,
} from './participation.helpers';

import type { MyParticipationRow, ParticipantField } from './participation.models';

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

  it('groups statuses by tone', () => {
    expect(signupStatusTone('not_approved')).toBe('rejected');
    expect(signupStatusTone('pending_payment')).toBe('review');
    expect(signupStatusTone('confirmed')).toBe('approved');
    expect(signupStatusTone('expired')).toBe('rejected');
  });

  it('pays the deposit lines already due, or the first unpaid one', () => {
    const row = {
      installments: [
        { sequence: 1, due_date: '2026-11-20', amount: '532000', status: 'overdue' },
        { sequence: 2, due_date: '2026-12-19', amount: '532000', status: 'pending' },
      ],
    } as Pick<MyParticipationRow, 'installments'>;
    const now = new Date('2026-11-23T15:00:00Z');

    expect(nextPayableSequences(row, now)).toEqual([1]);
    expect(nextPayableSequences({ installments: [{ ...row.installments![1] }] }, now)).toEqual([2]);
    expect(
      nextPayableSequences(
        { installments: [{ ...row.installments![0], status: 'in_review' }, row.installments![1]] },
        now,
      ),
    ).toEqual([2]);
    expect(nextPayableSequences({ installments: [] }, now)).toEqual([]);
  });

  it('keeps legacy rows out of the configured Mis reservas rows', () => {
    const rows = [{ kind: 'signup' }, { kind: 'registration' }, { kind: 'ticket' }] as Array<MyParticipationRow>;

    expect(configuredParticipationRows(rows).map(row => row.kind)).toEqual(['signup', 'ticket']);
    expect(configuredParticipationRows(null)).toEqual([]);
  });
});
