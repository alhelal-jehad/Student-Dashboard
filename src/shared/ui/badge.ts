import { h } from './dom';

const BASE = 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium';

const TONE = {
  neutral: 'bg-sunken text-fg',
  info: 'bg-primary-soft text-fg',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
} as const;

export type BadgeTone = keyof typeof TONE;

/** Status is never conveyed by color alone: every badge carries an icon glyph and a text label. */
export function Badge(tone: BadgeTone, icon: string, label: string): HTMLSpanElement {
  return h(
    'span',
    { class: `${BASE} ${TONE[tone]}` },
    h('span', { 'aria-hidden': 'true' }, icon),
    label,
  );
}
