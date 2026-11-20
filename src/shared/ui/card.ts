import { h } from './dom';

const CARD = 'flex min-h-24 flex-col gap-2 rounded-lg border border-line bg-raised p-4 shadow-card';

export function Card(...children: (Node | string)[]): HTMLElement {
  return h('li', { class: CARD }, ...children);
}
