import { Controller, type ScreenFactory } from '@/core/controller';
import type { ErrorCode } from '@/shared/utils/errors';
import { ApplicationsModel, type Application, type ApplicationsState } from './model';
import { ApplicationsView } from './view';

/** The surface the controller needs from a view, so tests can pass a fake. */
export interface ApplicationsViewPort {
  mount(): void;
  destroy(): void;
  bindRetry(handler: () => void): void;
  focusHeading(): void;
  showLoading(): void;
  showEmpty(): void;
  showError(code: ErrorCode): void;
  render(items: readonly Application[]): void;
}

export class ApplicationsController extends Controller {
  constructor(
    private readonly model: ApplicationsModel,
    private readonly view: ApplicationsViewPort,
  ) {
    super();
  }

  async start(): Promise<void> {
    this.view.mount();
    this.view.bindRetry(() => {
      void this.model.load(true);
    });
    this.track(
      this.model.subscribe((state) => {
        this.show(state);
      }),
    );
    await this.model.load();
    this.view.focusHeading();
  }

  private show(state: ApplicationsState): void {
    switch (state.status) {
      case 'loading':
        this.view.showLoading();
        break;
      case 'error':
        this.view.showError(state.errorCode ?? 'unknown');
        break;
      case 'ready':
        if (state.data?.length) this.view.render(state.data);
        else this.view.showEmpty();
        break;
      case 'idle':
        break;
    }
  }

  override destroy(): void {
    super.destroy();
    this.model.destroy();
    this.view.destroy();
  }
}

export const createScreen: ScreenFactory = ({ host }) =>
  new ApplicationsController(new ApplicationsModel(), new ApplicationsView(host));
