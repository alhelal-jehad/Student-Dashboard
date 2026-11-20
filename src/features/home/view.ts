import { animate, stagger } from 'motion';
import { View } from '@/core/view';
import { t } from '@/shared/i18n';
import { h } from '@/shared/ui/dom';
import { icon } from '@/shared/ui/icon';

// All class lists are constants (see shared/ui/dom.ts). Values come from the Figma "Student Page" file.
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-mid';
const CARD = 'rounded-[24px] border-[0.5px] border-gray-200 bg-white p-5';
const TITLE = 'text-base leading-5 font-semibold text-brand';
const SUB = 'text-xs leading-4 text-ink-2';
const TEXT_BTN = `flex h-6 items-center rounded-full px-2 text-xs leading-[15px] font-medium text-nav hover:bg-gray-50 ${FOCUS}`;
const OUTLINE_BTN = `flex items-center justify-center rounded-full border-[0.5px] border-gray-300 bg-white text-[13px] leading-[15px] font-medium whitespace-nowrap text-nav hover:bg-gray-50 ${FOCUS}`;
const BRAND_BTN = `flex items-center justify-center rounded-full bg-brand text-[13px] leading-[15px] font-medium whitespace-nowrap text-white hover:bg-brand-deep ${FOCUS}`;
const BADGE =
  'absolute top-[-2px] left-[60px] flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose px-1.5 text-[11px] leading-[14px] font-semibold text-white';

// Smooth ease-out, no overshoot.
const SMOOTH: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Fade + rise, staggered. Skipped when the user prefers reduced motion.
const enter = (els: ArrayLike<Element>, delay = 0): void => {
  if (!els.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  animate(Array.from(els), { opacity: [0, 1], y: [16, 0] }, { duration: 0.45, ease: 'easeOut', delay: stagger(0.06, { startDelay: delay }) });
};

const heading = (title: string, sub?: string, id?: string): HTMLElement =>
  h('div', { class: 'flex flex-col gap-1 whitespace-nowrap' }, h('h2', { id, class: TITLE }, title), sub && h('p', { class: SUB }, sub));

const viewAll = (hidden = false): HTMLElement =>
  h('a', { href: '#', class: `${TEXT_BTN} ${hidden ? 'invisible' : ''}`, tabindex: hidden ? '-1' : undefined }, t('home.viewAll'));

// ---------- greeting ----------
function greeting(titleEl: HTMLElement): HTMLElement {
  const due = h(
    'p',
    { class: 'text-sm leading-5 text-ink-3' },
    t('home.due.pre', { count: 3 }),
    h('span', { class: 'text-brand' }, t('home.due.action', { count: 3 })),
    t('home.due.post'),
  );
  return h(
    'section',
    { class: 'flex items-center justify-between gap-3 rounded-[20px] border border-gray-200 bg-white px-5 py-4' },
    h('div', { class: 'flex gap-2' }, icon('sun.svg', 24), h('div', { class: 'flex flex-col gap-1' }, titleEl, due)),
    h(
      'div',
      { class: 'flex items-center gap-[11px]' },
      h(
        'a',
        {
          href: '#',
          'data-chat-open': '',
          class: `flex h-[38px] items-center gap-2 rounded-full bg-[linear-gradient(90deg,#c62b78_0%,#b8368c_28%,#a146a9_72%,#8439b9_100%)] py-2 pr-[18px] pl-4 text-xs leading-[15px] font-medium text-white ${FOCUS}`,
        },
        icon('sparkle.svg', 18),
        t('home.askAi'),
      ),
      h(
        'a',
        { href: '#', class: `flex h-[38px] items-center rounded-full border-[0.5px] border-brand px-[22px] text-xs leading-[15px] font-medium text-brand hover:bg-brand-50 ${FOCUS}` },
        t('home.createPlan'),
      ),
    ),
  );
}

// ---------- offers / events ----------
function promo(kind: 'offers' | 'events'): HTMLElement {
  const offers = kind === 'offers';
  const arrow = (file: string, label: string, dark: boolean): HTMLElement =>
    h(
      'button',
      {
        type: 'button',
        'aria-label': label,
        class: `flex size-7 items-center justify-center rounded-full ${dark ? 'border-[0.35px] border-white bg-nav' : 'border-[0.5px] border-gray-200 bg-white'} ${FOCUS}`,
      },
      icon(file, 14),
    );
  return h(
    'section',
    { class: `${CARD} flex flex-col gap-4`, 'aria-labelledby': `h-${kind}` },
    h('div', { class: 'flex items-center justify-between' }, heading(t(`home.${kind}.title`), undefined, `h-${kind}`), viewAll()),
    h(
      'div',
      { class: 'relative h-[193px] overflow-hidden rounded-2xl' },
      h('img', {
        src: offers ? '/img/offer-banner.png' : '/img/event-banner.png',
        alt: t(`home.${kind}.alt`),
        class: 'absolute inset-0 size-full rounded-2xl object-cover',
      }),
      h(
        'a',
        {
          href: '#',
          class: `absolute left-5 ${offers ? 'top-[144.5px] w-[122px] border-gray-300 bg-white text-nav' : 'top-[143.5px] w-[127px] border-gray-300 bg-brand text-white'} flex items-center justify-center rounded-full border-[0.5px] px-2 py-[7px] text-xs leading-[15px] font-medium ${FOCUS}`,
        },
        t(`home.${kind}.cta`),
      ),
    ),
    h(
      'div',
      { class: 'flex items-center justify-between' },
      icon(offers ? 'dots-1.svg' : 'dots-2.svg', 34, '', 6),
      h('div', { class: 'flex gap-[7px]' }, arrow('chevron-left.svg', t('home.prev'), false), arrow('chevron-right.svg', t('home.next'), true)),
    ),
  );
}

// ---------- to-dos ----------
interface Task {
  key: 'passport' | 'declaration' | 'profile';
  rim: string;
  edge: string;
  face: string;
  glow: string;
  file: string;
}
const TASKS: Task[] = [
  { key: 'passport', rim: 'from-[#ede0fc] to-[#b58adf]', edge: 'bg-[#f1e5fe]', face: 'from-[#e7d7fc] to-[#d6bbf6]', glow: 'shadow-[0_5.9px_8.2px_-0.9px_rgba(168,121,223,0.26)]', file: 'passport-3.svg' },
  { key: 'declaration', rim: 'from-[#fff1cc] to-[#f0cc69]', edge: 'bg-[#fff5d6]', face: 'from-[#fff1c3] to-[#ffe7a0]', glow: 'shadow-[0_5.9px_8.2px_-0.9px_rgba(236,192,76,0.26)]', file: 'passport-2.svg' },
  { key: 'profile', rim: 'from-[#fce6f1] to-[#e9a8c9]', edge: 'bg-[#fef0f7]', face: 'from-[#fbe3ef] to-[#f3c3dc]', glow: 'shadow-[0_5.9px_8.2px_-0.9px_rgba(201,74,140,0.26)]', file: 'passport-1.svg' },
];
const TASK_CARD =
  'flex h-24 items-center gap-4 overflow-hidden rounded-[20px] border border-gray-200 bg-white p-6';

function taskCard(task: Task, front: boolean): HTMLElement {
  const tile = h(
    'div',
    { class: 'relative size-12 shrink-0' },
    h('div', { class: `absolute inset-0 rounded-[14px] bg-linear-to-b ${task.rim} ${task.glow}` }),
    h('div', { class: `absolute inset-[1.36px] rounded-[12.64px] ${task.edge}` }),
    h('div', { class: `absolute inset-[2.72px] rounded-[11.28px] bg-linear-to-b ${task.face}` }),
    h('div', { class: 'absolute top-3 left-3' }, icon(task.file, 24)),
  );
  return h(
    'article',
    {
      class: `${TASK_CARD} ${front ? 'shadow-[0_12px_16px_-4px_rgba(16,24,40,0.08),0_4px_6px_-2px_rgba(16,24,40,0.03)]' : 'shadow-[0_4px_8px_-2px_rgba(16,24,40,0.1),0_2px_4px_-2px_rgba(16,24,40,0.06)]'}`,
    },
    h(
      'div',
      { class: 'flex min-w-0 flex-1 items-center gap-6' },
      tile,
      h(
        'div',
        { class: 'flex min-w-0 flex-col gap-1' },
        h('h3', { class: 'text-sm leading-5 font-medium tracking-[-0.16px] text-ink' }, t(`home.todo.${task.key}.title`)),
        h('p', { class: 'text-[13px] leading-5 text-ink-3' }, t(`home.todo.${task.key}.body`)),
      ),
    ),
    h('a', { href: '#', class: `${OUTLINE_BTN} h-10 w-[113px] shrink-0 px-4 py-2` }, t(`home.todo.${task.key}.cta`)),
  );
}

function todos(): HTMLElement {
  const stack = h('div', { class: 'relative h-[118px] w-full' });
  const showAll = h(
    'button',
    {
      type: 'button',
      'aria-expanded': 'false',
      class: `flex h-8 items-center gap-1 self-center rounded-full bg-[#fafafa] py-1.5 pr-4 pl-5 text-xs leading-[15px] font-medium text-nav shadow-[0_1px_1.5px_rgba(16,24,40,0.1),0_1px_1px_rgba(16,24,40,0.06)] ${FOCUS}`,
    },
  );
  const paint = (open: boolean, animated = false): void => {
    const from = stack.offsetHeight;
    showAll.setAttribute('aria-expanded', String(open));
    showAll.replaceChildren(t(open ? 'home.todo.showLess' : 'home.todo.showAll'), icon('chevron-down.svg', 14, open ? 'rotate-180' : ''));
    if (open) {
      stack.className = 'flex w-full flex-col gap-3';
      stack.replaceChildren(...TASKS.map((task) => taskCard(task, false)));
    } else {
      stack.className = 'relative h-[118px] w-full';
      const back = (inset: string, top: string): HTMLElement =>
        h('div', { class: `absolute ${inset} ${top} ${TASK_CARD} shadow-[0_4px_8px_-2px_rgba(16,24,40,0.1),0_2px_4px_-2px_rgba(16,24,40,0.06)]`, 'aria-hidden': 'true' });
      const front = taskCard(TASKS[0] as Task, true);
      front.classList.add('absolute', 'inset-x-0', 'top-0');
      stack.replaceChildren(back('inset-x-[18px]', 'top-[22px]'), back('inset-x-[9px]', 'top-[11px]'), front);
    }
    if (!animated || !open || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Open: front card stays put; the cards beneath unfold downward from the stack position.
    const to = stack.offsetHeight;
    (stack.firstElementChild as HTMLElement).style.cssText = 'position:relative;z-index:3';
    stack.style.overflow = 'hidden';
    animate(stack, { height: [`${from}px`, `${to}px`] }, { duration: 0.5, ease: SMOOTH }).then(() => {
      stack.style.height = '';
      stack.style.overflow = '';
    });
    Array.from(stack.children).slice(1).forEach((c, k) => {
      const i = k + 1;
      (c as HTMLElement).style.position = 'relative';
      (c as HTMLElement).style.zIndex = String(3 - i);
      animate(c, { y: [-97 * i, 0], scaleX: [1 - 0.015 * i, 1], opacity: [0.6, 1] }, { duration: 0.5, ease: SMOOTH, delay: 0.04 * i });
    });
  };
  // Close: fold the lower cards back up under the front card, then swap to the stacked layout.
  const fold = (): void => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return paint(false);
    const from = stack.offsetHeight;
    stack.style.overflow = 'hidden';
    const cards = Array.from(stack.children).slice(1);
    cards.forEach((c, k) => {
      const i = k + 1;
      (c as HTMLElement).style.position = 'relative';
      (c as HTMLElement).style.zIndex = String(3 - i);
      animate(c, { y: -97 * i, scaleX: 1 - 0.015 * i }, { duration: 0.45, ease: SMOOTH });
    });
    (stack.firstElementChild as HTMLElement).style.cssText = 'position:relative;z-index:3';
    animate(stack, { height: [`${from}px`, '118px'] }, { duration: 0.45, ease: SMOOTH }).then(() => {
      paint(false);
      stack.style.height = '';
      stack.style.overflow = '';
    });
  };
  paint(false);
  showAll.addEventListener('click', () => {
    if (showAll.getAttribute('aria-expanded') === 'true') fold();
    else paint(true, true);
  });

  return h(
    'section',
    { class: 'flex flex-col gap-3.5', 'aria-labelledby': 'h-todo' },
    h(
      'div',
      { class: 'flex items-center justify-between' },
      heading(t('home.todo.title'), t('home.todo.sub'), 'h-todo'),
      h(
        'div',
        { class: 'relative h-12 w-[151px]' },
        h(
          'span',
          { class: 'absolute top-2 left-0 flex items-center gap-1.5 rounded-[18px] border border-gray-200 bg-white py-2.5 pr-5 pl-4 text-xs font-medium whitespace-nowrap text-nav' },
          icon('alert.svg', 15),
          t('home.todo.required'),
        ),
        h(
          'span',
          { class: 'anim-breathe absolute top-0.5 left-[131px] flex size-5 items-center justify-center rounded-full border-[1.43px] border-gray-200 bg-rose text-[10px] font-semibold text-white', 'aria-label': t('home.badge', { count: 3 }) },
          '3',
        ),
      ),
    ),
    h('div', { class: 'flex flex-col items-center gap-3' }, stack, showAll),
  );
}

// ---------- tiles ----------
interface Tile {
  key: string;
  file: string;
  count?: string;
  hover?: boolean;
}
const SERVICES: Tile[] = [
  { key: 'courses', file: 'svc-1.svg', count: '20+' },
  { key: 'visa', file: 'svc-2.svg', count: '2' },
  { key: 'health', file: 'svc-3.svg' },
  { key: 'housing', file: 'svc-4.svg', count: '5' },
  { key: 'payments', file: 'svc-5.svg', count: '1' },
  { key: 'english', file: 'svc-6.svg' },
  { key: 'tests', file: 'svc-7.svg', count: '3' },
  { key: 'pys', file: 'svc-8.svg' },
  { key: 'careers', file: 'svc-9.svg', count: '12' },
  { key: 'documents', file: 'svc-10.svg', count: '12' },
];
const AI_TOOLS: Tile[] = [
  { key: 'askAi', file: 'ai-stars.svg', hover: true },
  { key: 'scholarships', file: 'ai-1.svg', count: '8' },
  { key: 'canApply', file: 'ai-2.svg' },
  { key: 'sop', file: 'ai-3.svg', count: '1' },
  { key: 'budget', file: 'ai-4.svg' },
  { key: 'visaCheck', file: 'ai-5.svg', count: '2' },
  { key: 'whatsapp', file: 'ai-6.svg', count: '20+' },
];

function tile(group: 'services' | 'ai', item: Tile): HTMLElement {
  const featured = group === 'ai' && item.key === 'askAi';
  const label = t(`home.${group}.${item.key}`);
  return h(
    'li',
    {},
    h(
      'a',
      { href: '#', 'data-chat-open': featured ? '' : undefined, class: `group relative flex w-[88px] flex-col items-center gap-2.5 rounded-xl py-1 ${FOCUS}` },
      h(
        'span',
        {
          class: `relative flex size-14 items-center justify-center overflow-hidden rounded-2xl ${featured ? 'shadow-[0_1px_2px_rgba(158,33,102,0.2),0_6px_12px_-4px_rgba(158,33,102,0.28)]' : 'shadow-[0_1px_2px_rgba(15,23,41,0.06),0_6px_12px_-4px_rgba(15,23,41,0.1)]'}`,
        },
        h('span', {
          class: `absolute inset-0 rounded-2xl bg-linear-to-b ${featured ? 'from-[#cc458f] to-[#9e2166]' : 'from-white to-[#f0f2f5] group-hover:from-[#f2f2f2] group-hover:to-[#e7ebef]'}`,
          'aria-hidden': 'true',
        }),
        h('span', { class: 'relative' }, icon(item.file, 26)),
        h('span', {
          class: `pointer-events-none absolute inset-0 rounded-[inherit] ${featured ? 'shadow-[inset_0_-2px_0_rgba(77,13,46,0.3),inset_0_1px_0_rgba(255,255,255,0.35)]' : 'shadow-[inset_0_-2px_0_rgba(15,23,41,0.06),inset_0_1px_0_#fff]'}`,
        }),
      ),
      h('span', { class: 'w-full truncate text-center text-[13px] leading-4 font-medium text-ink' }, label),
      item.count && h('span', { class: BADGE }, item.count, h('span', { class: 'sr-only' }, ` ${t('home.badge', { count: item.count })}`)),
    ),
  );
}

function tiles(group: 'services' | 'ai', items: Tile[], withViewAll: boolean): HTMLElement {
  return h(
    'section',
    { class: `${CARD} flex flex-col gap-5`, 'aria-labelledby': `h-${group}` },
    h('div', { class: 'flex items-center justify-between' }, heading(t(`home.${group}.title`), t(`home.${group}.sub`), `h-${group}`), viewAll(!withViewAll)),
    h('ul', { class: 'flex flex-wrap gap-4' }, ...items.map((i) => tile(group, i))),
  );
}

// ---------- progress tracker ----------
const STEPS: { key: string; state: 'done' | 'now' | 'todo'; subs?: [string, 'done' | 'active' | 'todo'][] }[] = [
  { key: 'enquiry', state: 'done' },
  { key: 'apply', state: 'done' },
  { key: 'offer', state: 'now', subs: [['received', 'done'], ['accept', 'active'], ['sign', 'todo']] },
  { key: 'coe', state: 'todo' },
  { key: 'visa', state: 'todo' },
  { key: 'arrive', state: 'todo' },
];

function segments(gap: string, classes: string[]): HTMLElement {
  return h('div', { class: `flex ${gap}`, 'aria-hidden': 'true' }, ...classes.map((c) => h('span', { class: `h-1.5 flex-1 rounded-[3px] ${c}` })));
}

function progress(): HTMLElement {
  const detail = h('ol', { class: 'flex flex-col gap-2 text-sm text-ink-2', hidden: true, id: 'progress-steps' });
  STEPS.forEach((s, i) => {
    detail.append(
      h('li', { class: s.state === 'now' ? 'font-medium text-brand' : '' }, `${i + 1}. ${t(`home.steps.${s.key}.title`)} – ${t(`home.steps.${s.key}.note`)}`),
    );
  });
  const toggle = h('button', {
    type: 'button',
    'aria-expanded': 'false',
    'aria-controls': 'progress-steps',
    class: `flex items-center gap-1.5 rounded-full px-3 py-2 text-sm leading-5 font-semibold whitespace-nowrap text-brand ${FOCUS}`,
  });
  const paint = (open: boolean, animated = false): void => {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.replaceChildren(t(open ? 'home.progress.hide' : 'home.progress.show'), icon('chevron-pink.svg', 20, open ? 'rotate-180' : ''));
    detail.hidden = !open;
    if (open && animated) enter(detail.children);
  };
  paint(false);
  toggle.addEventListener('click', () => {
    paint(toggle.getAttribute('aria-expanded') !== 'true', true);
  });

  return h(
    'section',
    { class: 'flex flex-col gap-5 rounded-[24px] border-[0.5px] border-gray-200 bg-white px-5 py-6', 'aria-labelledby': 'h-progress' },
    h(
      'div',
      { class: 'flex flex-col gap-[5px]' },
      h(
        'div',
        { class: 'flex items-center gap-3 pr-2 pb-2' },
        h('h2', { id: 'h-progress', class: `${TITLE} whitespace-nowrap` }, t('home.progress.title')),
        h('p', { class: 'flex-1 text-sm leading-5 font-medium text-gray-600' }, t('home.progress.meta', { total: 6, done: 2 })),
        toggle,
      ),
      h(
        'div',
        { class: 'flex gap-2' },
        h('span', { class: 'rounded-full bg-brand-50 px-2.5 py-1 text-xs leading-4 font-medium whitespace-nowrap text-brand' }, t('home.progress.chip', { n: 3, total: 6 })),
        h('span', { class: 'rounded-full bg-gray-50 px-2.5 py-1 text-xs leading-4 font-medium whitespace-nowrap text-ink' }, t('home.progress.due')),
      ),
    ),
    detail,
    h('hr', { class: 'border-gray-200' }),
    h(
      'div',
      { class: 'flex flex-wrap items-center gap-4' },
      h('span', { class: 'flex size-10 shrink-0 items-center justify-center rounded-[10px] bg-brand-50' }, icon('dashed.svg', 22)),
      h(
        'div',
        { class: 'flex min-w-0 flex-1 flex-col gap-1' },
        h('h3', { class: 'text-sm leading-5 font-semibold tracking-[-0.16px] text-nav' }, t('home.progress.task')),
        h('p', { class: 'text-[15px] leading-[22px] text-gray-600' }, t('home.progress.detail')),
      ),
      h(
        'div',
        { class: 'flex items-center gap-3' },
        h('a', { href: '#', class: `${OUTLINE_BTN} h-9 w-[141px] px-4 py-2` }, t('home.progress.view')),
        h('a', { href: '#', class: `${BRAND_BTN} h-9 px-[17px] py-2` }, t('home.progress.accept')),
      ),
    ),
    segments('gap-1.5', ['bg-brand', 'bg-brand', 'bg-brand opacity-35', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200']),
  );
}

// ---------- journey steps ----------
function journey(): HTMLElement {
  const list = h('ol', { class: 'flex flex-col gap-1' });
  STEPS.forEach((s, i) => {
    const last = i === STEPS.length - 1;
    const dot =
      s.state === 'done'
        ? h('span', { class: 'flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-mid' }, icon('check.svg', 14))
        : s.state === 'now'
          ? h('span', { class: 'anim-ripple relative flex size-7 shrink-0 items-center justify-center rounded-full border-4 border-brand-100 bg-brand text-xs leading-4 font-semibold text-white' }, String(i + 1))
          : h('span', { class: 'flex size-7 shrink-0 items-center justify-center rounded-full border-[1.5px] border-gray-200 bg-white text-xs leading-4 font-semibold text-ink-2' }, String(i + 1));
    const noteTone = s.state === 'done' ? 'text-green' : s.state === 'now' ? 'font-medium text-brand' : 'text-ink-2';
    const subs =
      s.subs &&
      h(
        'ul',
        { class: 'flex flex-col gap-2 pt-2.5' },
        ...s.subs.map(([k, state]) =>
          h(
            'li',
            { class: `flex items-center gap-2 text-xs leading-4 ${state === 'active' ? 'font-medium text-ink' : 'text-ink-2'}` },
            icon(`sub-${state}.svg`, 16),
            t(`home.steps.offer.sub.${k}`),
          ),
        ),
      );
    list.append(
      h(
        'li',
        { class: 'flex items-stretch gap-3', 'aria-current': s.state === 'now' ? 'step' : undefined },
        h(
          'div',
          { class: 'flex flex-col items-center gap-1 self-stretch', 'aria-hidden': 'true' },
          dot,
          !last && h('span', { class: `w-0.5 flex-1 rounded-[1px] ${s.state === 'done' ? 'bg-brand-mid' : 'bg-gray-200'}` }),
        ),
        h(
          'div',
          { class: `flex min-w-0 flex-1 flex-col gap-0.5 pt-[3px] ${last ? '' : 'pb-[18px]'}` },
          h('p', { class: 'text-sm leading-5 font-medium tracking-[-0.16px] text-ink' }, t(`home.steps.${s.key}.title`)),
          h('p', { class: `text-xs leading-4 ${noteTone}` }, t(`home.steps.${s.key}.note`)),
          subs,
        ),
      ),
    );
  });
  return h(
    'section',
    { class: 'flex flex-col gap-4 rounded-[24px] border-[0.5px] border-gray-200 bg-white px-6 py-5', 'aria-labelledby': 'h-steps' },
    h(
      'div',
      { class: 'flex items-center justify-between' },
      heading(t('home.steps.title'), t('home.steps.progress', { done: 2, total: 6 }), 'h-steps'),
      h('a', { href: '#', class: TEXT_BTN }, t('home.steps.view')),
    ),
    segments('gap-1', ['bg-brand', 'bg-brand', 'bg-brand-100', 'bg-gray-200', 'bg-gray-200', 'bg-gray-200']),
    list,
  );
}

// ---------- counsellor tile ----------
function counsellor(): HTMLElement {
  const avatar = (file: string, bg: string, z: string, imgCls: string, last = false): HTMLElement =>
    h(
      'span',
      { class: `relative size-[41.54px] shrink-0 overflow-hidden rounded-full border-[1.5px] border-white/90 ${bg} ${z} ${last ? '' : '-mr-[10.385px]'}` },
      h('img', { src: `/img/${file}`, alt: '', class: `absolute max-w-none ${imgCls}` }),
    );
  return h(
    'section',
    {
      class: 'relative h-[363px] overflow-hidden rounded-[24px] bg-[linear-gradient(91.3deg,#d6286a_8.76%,#b0308c_60.74%,#7e3bc0_103.26%)]',
      'aria-labelledby': 'h-counsellor',
    },
    h('img', { src: '/img/blob-peach.svg', alt: '', class: 'absolute top-[-140px] left-[170px] size-[280px] max-w-none' }),
    h('div', { class: 'absolute top-[250px] left-[200px] size-[300px]' }, h('img', { src: '/img/blob-pink.svg', alt: '', class: 'absolute -inset-[30%] max-w-none' })),
    h('div', { class: 'absolute top-[280px] left-[-140px] size-[260px]' }, h('img', { src: '/img/blob-cyan.svg', alt: '', class: 'absolute -inset-[38.46%] max-w-none' })),
    h('img', { src: '/img/wave.svg', alt: '', class: 'absolute top-0 left-24 h-[125px] w-[304px] max-w-none' }),
    h('img', { src: '/img/wave.svg', alt: '', class: 'absolute top-[-32px] left-[99px] h-[125px] w-[304px] max-w-none' }),
    h(
      'div',
      { class: 'absolute top-6 left-6 flex h-[309px] w-[347px] flex-col gap-[43px]' },
      h(
        'div',
        { class: 'flex flex-col gap-4' },
        h(
          'span',
          { class: 'flex w-fit items-center gap-2 rounded-full border border-white/24 bg-white/14 px-3 py-1.5 text-[13px] leading-4 font-medium text-white backdrop-blur-[6px]' },
          h('span', { class: 'relative size-2' }, h('img', { src: '/img/live-dot.svg', alt: '', width: 14, height: 14, class: 'anim-blink absolute -inset-[37.5%] max-w-none' })),
          t('home.counsellor.live'),
        ),
        h(
          'p',
          { class: 'flex items-center gap-2 whitespace-nowrap text-white' },
          h('span', { class: 'text-[64px] leading-[64px] font-bold tracking-[-1.92px]' }, '22'),
          h('span', { class: 'block w-20 whitespace-normal text-sm leading-[18px] font-medium text-white/80' }, t('home.counsellor.online')),
        ),
      ),
      h(
        'div',
        { class: 'flex flex-col gap-5' },
        h(
          'div',
          { class: 'flex flex-col gap-2' },
          h('h2', { id: 'h-counsellor', class: 'w-[312px] text-lg font-semibold text-white' }, t('home.counsellor.title')),
          h('p', { class: 'w-[312px] text-sm leading-5 tracking-[-0.16px] text-white/82' }, t('home.counsellor.body')),
        ),
        h(
          'div',
          { class: 'flex items-center justify-between' },
          h(
            'div',
            { class: 'isolate flex', role: 'img', 'aria-label': t('home.counsellor.online') },
            avatar('av-sa.png', 'bg-[#be185d]', 'z-[4]', 'top-[-1.76%] left-[0.17%] h-[132.41%] w-[99.58%]'),
            avatar('av-rk.png', 'bg-[#334155]', 'z-[3]', 'top-[2.14%] left-[4.71%] h-[140.55%] w-[93.7%]'),
            avatar('av-mt.png', 'bg-[#15803d]', 'z-[2]', 'top-[0.1%] left-[0.13%] h-[109.14%] w-[99.84%]'),
            avatar('av-19.png', 'bg-white/22', 'z-[1]', 'top-[0.31%] left-[0.29%] h-[154.69%] w-[112.19%]', true),
          ),
          h(
            'a',
            { href: '#', class: `flex items-center gap-2 rounded-full bg-white py-3 pr-4 pl-5 text-sm leading-5 font-medium whitespace-nowrap text-[#2e1065] shadow-[0_8px_20px_-6px_rgba(23,8,64,0.25)] ${FOCUS}` },
            t('home.counsellor.cta'),
            h('span', { class: 'text-base leading-5 font-semibold', 'aria-hidden': 'true' }, '→'),
          ),
        ),
      ),
    ),
  );
}

export class HomeView extends View {
  private title!: HTMLHeadingElement;

  mount(): void {
    this.title = h(
      'h1',
      { class: 'text-lg leading-[normal] font-medium text-ink focus-visible:outline-2 focus-visible:outline-brand-mid', tabindex: '-1' },
      t('home.greeting', { name: 'Zara' }),
    );
    this.host.append(
      h(
        'div',
        { class: 'flex flex-col gap-5' },
        greeting(this.title),
        h(
          'div',
          { class: 'grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_395px]' },
          h(
            'div',
            { class: 'flex min-w-0 flex-col gap-6' },
            h('div', { class: 'grid gap-5 md:grid-cols-2' }, promo('offers'), promo('events')),
            todos(),
            tiles('services', SERVICES, true),
            tiles('ai', AI_TOOLS, false),
            progress(),
          ),
          h('div', { class: 'flex flex-col gap-6' }, journey(), counsellor()),
        ),
      ),
    );
    enter(this.host.querySelectorAll('section'));
  }

  focusHeading(): void {
    this.title.focus();
  }
}
