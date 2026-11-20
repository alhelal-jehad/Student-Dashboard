import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/utils/errors';
import type { ApiClient } from '@/shared/api/client';
import { ApplicationsModel } from './model';

const row = (id: string, updatedAt: string) => ({
  id,
  university: 'University of Leeds',
  program: 'MSc Data Science',
  status: 'submitted',
  updatedAt,
});

function fakeApi(get: () => Promise<unknown>): ApiClient {
  return { get: vi.fn(get), post: vi.fn() };
}

describe('ApplicationsModel', () => {
  it('goes loading -> ready and sorts newest first', async () => {
    const api = fakeApi(() =>
      Promise.resolve([row('a', '2026-01-01T00:00:00Z'), row('b', '2026-03-01T00:00:00Z')]),
    );
    const model = new ApplicationsModel(api);
    const seen: string[] = [];
    model.subscribe((s) => seen.push(s.status));

    await model.load();

    expect(seen).toEqual(['loading', 'ready']);
    expect(model.snapshot.data?.map((a) => a.id)).toEqual(['b', 'a']);
  });

  it('rejects malformed API data with invalid_response', async () => {
    const model = new ApplicationsModel(fakeApi(() => Promise.resolve([{ id: 1 }])));
    await model.load();
    expect(model.snapshot).toMatchObject({ status: 'error', errorCode: 'invalid_response' });
  });

  it('maps network failures to an error code, not a message', async () => {
    const model = new ApplicationsModel(fakeApi(() => Promise.reject(new ApiError('network'))));
    await model.load();
    expect(model.snapshot).toMatchObject({ status: 'error', errorCode: 'network' });
  });

  it('serves fresh data from cache and refetches on force', async () => {
    const api = fakeApi(() => Promise.resolve([row('a', '2026-01-01T00:00:00Z')]));
    const model = new ApplicationsModel(api);
    await model.load();
    await model.load();
    expect(api.get).toHaveBeenCalledTimes(1);
    await model.load(true);
    expect(api.get).toHaveBeenCalledTimes(2);
  });
});
