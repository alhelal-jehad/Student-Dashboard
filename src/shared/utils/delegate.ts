/** One listener on the container instead of one per item. Returns an unsubscribe function. */
export function delegate(
  root: HTMLElement,
  type: string,
  selector: string,
  handler: (target: HTMLElement, event: Event) => void,
): () => void {
  const listener = (event: Event): void => {
    const target = (event.target as Element | null)?.closest<HTMLElement>(selector);
    if (target && root.contains(target)) handler(target, event);
  };
  root.addEventListener(type, listener);
  return () => {
    root.removeEventListener(type, listener);
  };
}
