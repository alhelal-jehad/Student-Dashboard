import { h } from './dom';

/** Decorative image from /public/img (Figma exports). Size is the design's, so it never reflows. */
export function icon(file: string, size: number, cls = '', height = size): HTMLImageElement {
  return h('img', { src: `/img/${file}`, alt: '', width: size, height, class: `block shrink-0 ${cls}`.trim() });
}
