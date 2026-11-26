import { describe, expect, it, vi } from 'vitest';

import { ClassFeedbackAdminAPI } from './class-feedback.api';

function apiWithSpy() {
  const callNoError = vi.fn().mockResolvedValue({ ok: true, data: {} });

  return { api: new ClassFeedbackAdminAPI({ callNoError } as never), callNoError };
}

describe('ClassFeedbackAdminAPI.list', () => {
  it('filters the report by the student the rating belongs to', async () => {
    const { api, callNoError } = apiWithSpy();

    await api.list('2026-11-01', '2026-11-25', { userId: 'minor-1' });

    expect(callNoError).toHaveBeenCalledWith(
      expect.objectContaining({
        path: '/admin/class-feedback',
        params: { from_date: '2026-11-01', to_date: '2026-11-25', user_id: 'minor-1' },
      }),
    );
  });

  it('keeps the instructor filter and sends no empty filters', async () => {
    const { api, callNoError } = apiWithSpy();

    await api.list('2026-11-01', '2026-11-25', { instructorId: 'instructor-1' });
    await api.list();

    expect(callNoError.mock.calls[0][0].params).toEqual({
      from_date: '2026-11-01',
      to_date: '2026-11-25',
      instructor_id: 'instructor-1',
    });
    expect(callNoError.mock.calls[1][0].params).toEqual({ from_date: undefined, to_date: undefined });
  });
});
