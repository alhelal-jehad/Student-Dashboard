import type { ErrorCode } from '@/shared/utils/errors';
import { Emitter } from '@/shared/utils/emitter';

export type Status = 'idle' | 'loading' | 'ready' | 'error';

/** The standard shape for anything fetched. The View can render every status explicitly. */
export interface Loadable<T> {
  status: Status;
  data: T | null;
  errorCode: ErrorCode | null;
}

/**
 * Observable state holder. Subclasses own rules and API calls. Never touches the DOM.
 * State is replaced, never mutated, so subscribers can compare snapshots.
 */
export abstract class Model<S extends object> {
  private readonly emitter = new Emitter<{ change: S }>();

  constructor(private state: S) {}

  get snapshot(): Readonly<S> {
    return this.state;
  }

  subscribe(listener: (state: S) => void): () => void {
    return this.emitter.on('change', listener);
  }

  protected set(patch: Partial<S>): void {
    this.state = { ...this.state, ...patch };
    this.emitter.emit('change', this.state);
  }

  destroy(): void {
    this.emitter.clear();
  }
}
