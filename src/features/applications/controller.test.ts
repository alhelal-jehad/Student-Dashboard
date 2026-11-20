import { describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/utils/errors';
import type { ApiClient } from '@/shared/api/client';
import { ApplicationsController, type ApplicationsViewPort } from './controller';
import { ApplicationsModel } from './model';

function fakeView(): ApplicationsViewPort & { retry: () => void } {
  let retry: () => void = () => undefined;
  return {
    mount: vi.fn(),
    destroy: vi.fn(),
    focusHeading: vi.fn(),
    showLoading: vi.fn(),
    showEmpty: vi.fn(),
    showError: vi.fn(),
    render: vi.fn(),
    bindRetry: (h) => {
      retry = h;
    },
    retry: () => {
      retry();
    },
  };
}

const api = (get: ApiClient['get']): ApiClient => ({ get, post: vi.fn() });

describe('ApplicationsController', () => {
  it('shows the empty state for an empty list', async () => {
    const view = fakeView();
    await new ApplicationsController(
      new ApplicationsModel(api(() => Promise.resolve([]))),
      view,
    ).start();
    expect(view.showLoading).toHaveBeenCalled();
    expect(view.showEmpty).toHaveBeenCalled();
    expect(view.focusHeading).toHaveBeenCalled();
  });

  it('shows the error state, then recovers on retry', async () => {
    const get = vi
      .fn<ApiClient['get']>()
      .mockRejectedValueOnce(new ApiError('server'))
      .mockResolvedValueOnce([]);
    const view = fakeView();
    await new ApplicationsController(new ApplicationsModel(api(get)), view).start();
    expect(view.showError).toHaveBeenCalledWith('server');

    view.retry();
    await vi.waitFor(() => {
      expect(view.showEmpty).toHaveBeenCalled();
    });
  });

  it('stops reacting to the model after destroy()', async () => {
    const view = fakeView();
    const model = new ApplicationsModel(api(() => Promise.resolve([])));
    const controller = new ApplicationsController(model, view);
    await controller.start();
    controller.destroy();
    expect(view.destroy).toHaveBeenCalled();
    vi.mocked(view.showLoading).mockClear();
    await model.load(true);
    expect(view.showLoading).not.toHaveBeenCalled();
  });
});
