type Handler<P> = (payload: P) => void;

/** Minimal typed event emitter. Used by Model (observer) and the app event bus. */
export class Emitter<E extends object> {
  private readonly handlers = new Map<keyof E, Set<Handler<never>>>();

  on<K extends keyof E>(event: K, handler: Handler<E[K]>): () => void {
    const set = this.handlers.get(event) ?? new Set();
    set.add(handler);
    this.handlers.set(event, set);
    return () => set.delete(handler);
  }

  emit<K extends keyof E>(event: K, payload: E[K]): void {
    this.handlers.get(event)?.forEach((h) => {
      (h as Handler<E[K]>)(payload);
    });
  }

  clear(): void {
    this.handlers.clear();
  }
}
