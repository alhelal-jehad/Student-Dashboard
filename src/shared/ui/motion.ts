import { animate } from 'motion';

/** Seconds. Nothing exceeds 0.3. Keep in sync with --duration-* in styles.css. */
export const DURATION = { micro: 0.12, menu: 0.18, modal: 0.25 } as const;
/** Ease-out when entering, ease-in when leaving. */
export const EASE = { enter: 'easeOut', leave: 'easeIn' } as const;

export type MotionKind = keyof typeof DURATION;

/** The single place prefers-reduced-motion is checked. */
export function reduced(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Fade + small rise. Resolves when finished. With reduced motion it only fades, in 100ms. */
export async function enter(el: HTMLElement, kind: MotionKind = 'menu'): Promise<void> {
  const keyframes = reduced()
    ? { opacity: [0, 1] }
    : { opacity: [0, 1], transform: ['translateY(8px)', 'translateY(0px)'] };
  const duration = reduced() ? DURATION.micro : DURATION[kind];
  await animate(el, keyframes, { duration, ease: EASE.enter }).finished;
}

/** Fade out. With reduced motion it resolves immediately so nothing blocks the next action. */
export async function leave(el: HTMLElement, kind: MotionKind = 'menu'): Promise<void> {
  if (reduced()) return;
  await animate(el, { opacity: [1, 0] }, { duration: DURATION[kind], ease: EASE.leave }).finished;
}
