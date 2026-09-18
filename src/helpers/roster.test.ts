import { describe, expect, it } from 'vitest';

import { groupWorkshopRosterByPurchase } from './roster';

import type { WorkshopRosterEntry } from '@core/api';

function entry(
  overrides: Partial<WorkshopRosterEntry> & Pick<WorkshopRosterEntry, 'id' | 'purchase_id'>,
): WorkshopRosterEntry {
  return {
    user_id: `user-${overrides.id}`,
    display_name: 'Student',
    email: 'student@example.com',
    status: 'confirmed',
    source: 'direct',
    combo_id: null,
    combo_name: null,
    created_at: '2026-09-01T10:00:00.000Z',
    ...overrides,
  };
}

describe('groupWorkshopRosterByPurchase', () => {
  it('keeps a single registrant as its own group', () => {
    const rows = [entry({ id: 'a', purchase_id: 'p1', display_name: 'Ana' })];

    expect(groupWorkshopRosterByPurchase(rows)).toEqual([{ purchaseId: 'p1', members: [rows[0]] }]);
  });

  it('groups pair members that share a purchase, preserving direct vs combo source', () => {
    const rows = [
      entry({
        id: 'a',
        purchase_id: 'combo-purchase',
        display_name: 'Ana Pérez',
        source: 'combo',
        combo_id: 'combo-1',
        combo_name: 'Pack salsa',
      }),
      entry({ id: 'b', purchase_id: 'solo', display_name: 'Carlos Solo', source: 'direct' }),
      entry({
        id: 'c',
        purchase_id: 'combo-purchase',
        display_name: 'Luis Gómez',
        source: 'combo',
        combo_id: 'combo-1',
        combo_name: 'Pack salsa',
      }),
    ];

    const groups = groupWorkshopRosterByPurchase(rows);

    expect(groups).toHaveLength(2);
    expect(groups[0]?.purchaseId).toBe('combo-purchase');
    expect(groups[0]?.members.map(member => member.display_name)).toEqual(['Ana Pérez', 'Luis Gómez']);
    expect(groups[0]?.members.every(member => member.source === 'combo')).toBe(true);
    expect(groups[1]?.members.map(member => member.display_name)).toEqual(['Carlos Solo']);
    expect(groups[1]?.members[0]?.source).toBe('direct');
  });
});
