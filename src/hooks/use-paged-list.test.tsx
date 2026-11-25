import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { usePagedList } from './use-paged-list';

const page = (offset: number) => ({
  data: { items: [`item-${offset}`], total: 45, limit: 20, offset },
});

describe('usePagedList', () => {
  it('fetches the current page and moves by offset', async () => {
    const fetchPage = vi.fn(async ({ offset }: { limit: number; offset: number }) => page(offset));
    const { result } = renderHook(() => usePagedList(fetchPage));

    await waitFor(() => expect(result.current.items).toEqual(['item-0']));
    expect(fetchPage).toHaveBeenLastCalledWith({ limit: 20, offset: 0 });
    expect(result.current.total).toBe(45);

    act(() => result.current.setPage(3));

    await waitFor(() => expect(result.current.items).toEqual(['item-40']));
    expect(fetchPage).toHaveBeenLastCalledWith({ limit: 20, offset: 40 });
  });
});
