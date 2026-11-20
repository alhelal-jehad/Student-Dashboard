/** What the Router mounts. Every feature's controller module exports createScreen(ctx). */
export interface Screen {
  start(): void | Promise<void>;
  destroy(): void;
}

export interface ScreenContext {
  /** The element the screen renders into. Controllers pass it to their View untouched. */
  host: HTMLElement;
  params: Readonly<Record<string, string>>;
}

export type ScreenFactory = (ctx: ScreenContext) => Screen;

/**
 * Base Controller. Wires View events to Model calls and Model changes to View updates.
 * No DOM access, no Tailwind, no animation library.
 */
export abstract class Controller implements Screen {
  private readonly subscriptions: (() => void)[] = [];

  abstract start(): void | Promise<void>;

  /** Register an unsubscribe function to be called on destroy(). */
  protected track(unsubscribe: () => void): void {
    this.subscriptions.push(unsubscribe);
  }

  destroy(): void {
    this.subscriptions.splice(0).forEach((fn) => {
      fn();
    });
  }
}
