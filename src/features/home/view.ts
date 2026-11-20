import { View } from '@/core/view';
import { t } from '@/shared/i18n';
import { h } from '@/shared/ui/dom';

const PANEL = 'rounded-lg border border-line bg-surface p-5 shadow-card';
const H2 = 'text-base font-semibold text-primary';
const SUB = 'text-sm text-muted';
const LINK =
  'inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium hover:bg-sunken focus-visible:outline-2 focus-visible:outline-primary';
const PILL =
  'inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary';
const PRIMARY_PILL = `${PILL} bg-primary text-on-primary hover:bg-primary-hover`;
const OUTLINE_PILL = `${PILL} border border-line bg-surface text-fg hover:bg-sunken`;
const HERO = 'bg-linear-to-br from-primary to-primary-hover text-on-primary';

interface Step {
  key: string;
  state: 'done' | 'now' | 'todo';
  subs?: [string, boolean][];
}
const STEPS: Step[] = [
  { key: 'enquiry', state: 'done' },
  { key: 'apply', state: 'done' },
  {
    key: 'offer',
    state: 'now',
    subs: [
      ['received', true],
      ['accept', false],
      ['sign', false],
    ],
  },
  { key: 'coe', state: 'todo' },
  { key: 'visa', state: 'todo' },
  { key: 'arrive', state: 'todo' },
];
const SERVICES: [string, number][] = [
  ['courses', 20],
  ['visa', 2],
  ['health', 0],
  ['housing', 5],
  ['payments', 1],
  ['english', 0],
  ['tests', 3],
  ['pys', 0],
  ['careers', 12],
  ['documents', 12],
];
const AI_TOOLS: [string, number][] = [
  ['askAi', 0],
  ['scholarships', 8],
  ['canApply', 0],
  ['sop', 1],
  ['budget', 0],
  ['visaCheck', 2],
  ['whatsapp', 20],
];

const badge = (n: number): HTMLElement | false =>
  n > 0 &&
  h(
    'span',
    {
      class:
        'absolute -top-1 -right-1 min-w-5 rounded-full bg-danger px-1 text-center text-xs font-semibold text-on-primary',
    },
    String(n),
  );

function tiles(group: 'services' | 'ai', items: [string, number][]): HTMLElement {
  const list = h('ul', { class: 'mt-4 flex flex-wrap gap-x-6 gap-y-4' });
  for (const [key, n] of items) {
    const label = t(`home.${group}.${key}`);
    list.append(
      h(
        'li',
        {},
        h(
          'a',
          {
            href: '#',
            class:
              'flex w-20 flex-col items-center gap-2 rounded-md text-center text-xs focus-visible:outline-2 focus-visible:outline-primary',
          },
          // ponytail: initial letter stands in for the Figma icon set; swap for SVG icons.
          h(
            'span',
            {
              class:
                'relative flex size-12 items-center justify-center rounded-lg border border-line bg-raised text-lg font-semibold text-primary',
              'aria-hidden': 'true',
            },
            label.charAt(0),
            badge(n),
          ),
          label,
          n > 0 && h('span', { class: 'sr-only' }, t('home.badgeCount', { count: n })),
        ),
      ),
    );
  }
  return list;
}

const panelHead = (id: string, title: string, sub: string, link: string): HTMLElement =>
  h(
    'div',
    { class: 'flex items-start justify-between gap-2' },
    h('div', {}, h('h2', { id, class: H2 }, title), h('p', { class: SUB }, sub)),
    h('a', { href: '#', class: LINK }, link),
  );

const banner = (kind: 'offers' | 'events'): HTMLElement =>
  h(
    'section',
    { class: PANEL, 'aria-labelledby': `h-${kind}` },
    h(
      'div',
      { class: 'flex items-start justify-between' },
      h('h2', { id: `h-${kind}`, class: H2 }, t(`home.${kind}.title`)),
      h('a', { href: '#', class: LINK }, t('home.viewAll')),
    ),
    // ponytail: gradient stands in for campaign artwork; swap for an <img> from the CMS feed.
    h(
      'div',
      { class: `${HERO} mt-3 flex h-40 flex-col justify-center gap-3 rounded-lg p-6` },
      h('p', { class: 'text-xl font-semibold' }, t(`home.${kind}.headline`)),
      h('a', { href: '#', class: `${PILL} w-fit bg-surface text-fg` }, t(`home.${kind}.cta`)),
    ),
  );

function stepsPanel(): HTMLElement {
  const list = h('ol', { class: 'mt-4 flex flex-col gap-4' });
  STEPS.forEach((s, i) => {
    const tone =
      s.state === 'done' ? 'text-success' : s.state === 'now' ? 'text-primary' : 'text-muted';
    list.append(
      h(
        'li',
        { class: 'flex gap-3', 'aria-current': s.state === 'now' ? 'step' : undefined },
        h(
          'span',
          {
            class: `flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold ${s.state === 'todo' ? 'border-line text-muted' : 'border-primary bg-primary text-on-primary'}`,
            'aria-hidden': 'true',
          },
          s.state === 'done' ? '✓' : String(i + 1),
        ),
        h(
          'div',
          { class: 'text-sm' },
          h('p', { class: 'font-semibold' }, t(`home.steps.${s.key}.title`)),
          h('p', { class: tone }, t(`home.steps.${s.key}.note`)),
          !!s.subs &&
            h(
              'ul',
              { class: 'mt-1 flex flex-col gap-0.5 text-xs' },
              ...s.subs.map(([k, done]) =>
                h(
                  'li',
                  {},
                  h('span', { 'aria-hidden': 'true' }, done ? '✓ ' : '○ '),
                  t(`home.steps.offer.sub.${k}`),
                ),
              ),
            ),
        ),
      ),
    );
  });
  return h(
    'section',
    { class: PANEL, 'aria-labelledby': 'h-steps' },
    panelHead(
      'h-steps',
      t('home.steps.title'),
      t('home.steps.progress', { done: 2, total: 6 }),
      t('home.steps.view'),
    ),
    list,
  );
}

export class HomeView extends View {
  private heading!: HTMLHeadingElement;

  mount(): void {
    this.heading = h(
      'h1',
      {
        class: 'text-lg font-semibold focus-visible:outline-2 focus-visible:outline-primary',
        tabindex: '-1',
      },
      t('home.greeting', { name: 'Zara' }),
    );

    const greeting = h(
      'section',
      { class: `${PANEL} flex flex-wrap items-center justify-between gap-3` },
      h('div', {}, this.heading, h('p', { class: SUB }, t('home.actionsDue', { count: 3 }))),
      h(
        'div',
        { class: 'flex gap-2' },
        h('a', { href: '#', class: PRIMARY_PILL }, t('home.askAi')),
        h('a', { href: '#', class: OUTLINE_PILL }, t('home.createPlan')),
      ),
    );

    const todos = h(
      'section',
      { class: 'flex flex-col gap-3', 'aria-labelledby': 'h-todo' },
      h(
        'div',
        { class: 'flex items-start justify-between' },
        h(
          'div',
          {},
          h('h2', { id: 'h-todo', class: H2 }, t('home.todo.title')),
          h('p', { class: SUB }, t('home.todo.sub')),
        ),
        h(
          'span',
          { class: `${OUTLINE_PILL} text-xs` },
          t('home.todo.required'),
          h('span', { class: 'ms-2 rounded-full bg-danger px-1.5 text-on-primary' }, '3'),
        ),
      ),
      h(
        'div',
        { class: `${PANEL} flex items-center justify-between gap-4` },
        h(
          'div',
          {},
          h('h3', { class: 'text-sm font-semibold' }, t('home.todo.item')),
          h('p', { class: SUB }, t('home.todo.itemBody')),
        ),
        h('a', { href: '#', class: OUTLINE_PILL }, t('home.todo.upload')),
      ),
      h('button', { type: 'button', class: `${OUTLINE_PILL} self-center` }, t('home.todo.showAll')),
    );

    const progress = h(
      'section',
      { class: PANEL, 'aria-labelledby': 'h-prog' },
      h(
        'h2',
        { id: 'h-prog', class: H2 },
        t('home.progress.title'),
        ' ',
        h('span', { class: 'font-normal text-muted' }, t('home.progress.meta')),
      ),
      h('p', { class: `${SUB} mt-2` }, t('home.progress.due')),
      h(
        'div',
        { class: 'mt-4 flex flex-wrap items-center justify-between gap-3' },
        h(
          'div',
          {},
          h('p', { class: 'text-sm font-semibold' }, t('home.progress.task')),
          h('p', { class: SUB }, t('home.progress.detail')),
        ),
        h(
          'div',
          { class: 'flex gap-2' },
          h('a', { href: '#', class: OUTLINE_PILL }, t('home.progress.view')),
          h('a', { href: '#', class: PRIMARY_PILL }, t('home.progress.accept')),
        ),
      ),
    );

    const counsellor = h(
      'section',
      { class: `${HERO} flex flex-col gap-3 rounded-lg p-6`, 'aria-labelledby': 'h-couns' },
      h('p', { class: 'text-sm' }, t('home.counsellor.live')),
      h(
        'p',
        { class: 'text-3xl font-semibold' },
        '22 ',
        h('span', { class: 'text-sm font-normal' }, t('home.counsellor.online')),
      ),
      h('h2', { id: 'h-couns', class: 'text-base font-semibold' }, t('home.counsellor.title')),
      h('p', { class: 'text-sm' }, t('home.counsellor.body')),
      h('a', { href: '#', class: `${PILL} w-fit bg-surface text-fg` }, t('home.counsellor.cta')),
    );

    this.host.append(
      h(
        'div',
        { class: 'grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]' },
        h(
          'div',
          { class: 'flex min-w-0 flex-col gap-4' },
          greeting,
          h('div', { class: 'grid gap-4 md:grid-cols-2' }, banner('offers'), banner('events')),
          todos,
          h(
            'section',
            { class: PANEL, 'aria-labelledby': 'h-svc' },
            panelHead('h-svc', t('home.services.title'), t('home.services.sub'), t('home.viewAll')),
            tiles('services', SERVICES),
          ),
          h(
            'section',
            { class: PANEL, 'aria-labelledby': 'h-ai' },
            panelHead('h-ai', t('home.ai.title'), t('home.ai.sub'), t('home.viewAll')),
            tiles('ai', AI_TOOLS),
          ),
          progress,
        ),
        h('div', { class: 'flex flex-col gap-4' }, stepsPanel(), counsellor),
      ),
    );
  }

  focusHeading(): void {
    this.heading.focus();
  }
}
