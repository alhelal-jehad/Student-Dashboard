import { delegate } from '@/shared/utils/delegate';

/**
 * Base View. Owns a host element. No business logic, no API calls, no Tailwind classes here;
 * subclasses add those. Everything registered through listen()/delegateOn() is removed in destroy().
 */
export abstract class View {
  private readonly cleanups: (() => void)[] = [];

  constructor(protected readonly host: HTMLElement) {}

  /** Build the static frame once. Called by the Controller on start. */
  abstract mount(): void;

  protected listen(target: EventTarget, type: string, handler: (event: Event) => void): void {
    target.addEventListener(type, handler);
    this.cleanups.push(() => {
      target.removeEventListener(type, handler);
    });
  }

  protected delegateOn(
    root: HTMLElement,
    type: string,
    selector: string,
    handler: (target: HTMLElement, event: Event) => void,
  ): void {
    this.cleanups.push(delegate(root, type, selector, handler));
  }

  destroy(): void {
    this.cleanups.splice(0).forEach((fn) => {
      fn();
    });
    this.host.replaceChildren();
  }
}
