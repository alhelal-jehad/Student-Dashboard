/** Single-value cache with a stale time. Models use it to skip refetching fresh data. */
export class StaleCache<T> {
  private entry: { value: T; at: number } | null = null;

  constructor(
    private readonly staleMs: number,
    private readonly now: () => number = Date.now,
  ) {}

  get(): T | null {
    return this.entry && this.now() - this.entry.at < this.staleMs ? this.entry.value : null;
  }

  /** Stale data is still useful to show while refreshing (stale-while-revalidate). */
  peek(): T | null {
    return this.entry?.value ?? null;
  }

  set(value: T): void {
    this.entry = { value, at: this.now() };
  }

  clear(): void {
    this.entry = null;
  }
}
