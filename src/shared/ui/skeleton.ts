import { h } from './dom';

// Same min height as Card, so content replacing the skeleton causes no layout shift.
const ROW = 'min-h-24 animate-pulse rounded-lg bg-sunken motion-reduce:animate-none';

export function SkeletonList(rows = 3): HTMLUListElement {
  const list = h('ul', { class: 'flex flex-col gap-3', 'aria-hidden': 'true' });
  for (let i = 0; i < rows; i++) list.append(h('li', { class: ROW }));
  return list;
}
