import { Controller, type ScreenFactory } from '@/core/controller';
import { HomeView } from './view';

/** Static for now; add a model + API call when the dashboard endpoint exists. */
export class HomeController extends Controller {
  constructor(private readonly view: HomeView) {
    super();
  }

  start(): void {
    this.view.mount();
    this.view.focusHeading();
  }

  override destroy(): void {
    super.destroy();
    this.view.destroy();
  }
}

export const createScreen: ScreenFactory = ({ host }) => new HomeController(new HomeView(host));
