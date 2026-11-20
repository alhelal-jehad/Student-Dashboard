import { bus } from '@/shared/events/bus';
import { LOCALES, currentLocale, isLocale, setLocale } from '@/shared/i18n';
import { t } from '@/shared/i18n';
import { createChatbot } from '@/shared/ui/chatbot';
import { h } from '@/shared/ui/dom';
import { icon } from '@/shared/ui/icon';
import { delegate } from '@/shared/utils/delegate';

const NATIVE: Record<string, string> = { en: 'English', ar: 'العربية' };
const FOCUS = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-mid';

const ITEM = `flex items-center gap-2 rounded-3xl px-3 py-1.5 text-sm leading-5 tracking-[-0.16px] text-white hover:bg-white/10 ${FOCUS}`;
const ITEM_ACTIVE = `flex items-center gap-2 rounded-[34px] bg-brand-deep py-1.5 pr-2 pl-3 text-sm leading-5 font-medium tracking-[-0.16px] text-white ${FOCUS}`;
const GROUP_LABEL = `flex w-full items-center justify-between py-2 pr-2 pl-3 text-xs leading-4 font-medium text-nav-muted ${FOCUS}`;
const ROUND_BTN = `flex size-[30px] items-center justify-center rounded-full bg-white ${FOCUS}`;

interface NavItem {
  label: string;
  file: string;
  href: string;
  /** Route path that marks this item active. Items without a built screen have none. */
  path?: string;
  count?: number;
  chat?: boolean;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

function groups(): NavGroup[] {
  return [
    {
      label: t('nav.overview'),
      items: [
        { label: t('nav.home'), file: 'nav-home.svg', href: '/', path: '/' },
        { label: t('nav.studynetAi'), file: 'nav-ai.svg', href: '#', chat: true },
      ],
    },
    {
      label: t('nav.myStudy'),
      items: [
        { label: t('nav.studyPlan'), file: 'nav-plan.svg', href: '#' },
        { label: t('nav.appointment'), file: 'nav-appointment.svg', href: '#' },
        { label: t('nav.documents'), file: 'nav-documents.svg', href: '#' },
        // Not in the Figma, but the Applications screen must stay reachable.
        { label: t('nav.applications'), file: 'nav-plan.svg', href: '/applications', path: '/applications' },
      ],
    },
    {
      label: t('nav.connect'),
      items: [
        { label: t('nav.messages'), file: 'nav-message.svg', href: '#', count: 311 },
        { label: t('nav.events'), file: 'nav-events.svg', href: '#' },
      ],
    },
  ];
}

function link(item: NavItem, active: boolean): HTMLAnchorElement {
  const a = h(
    'a',
    {
      href: item.href,
      'data-link': item.path ? '' : undefined,
      'data-chat-open': item.chat ? '' : undefined,
      'aria-current': active ? 'page' : undefined,
      class: active ? ITEM_ACTIVE : ITEM,
    },
    icon(item.file, 16),
    h('span', { class: 'flex-1 group-data-[collapsed]/nav:hidden' }, item.label),
  );
  if (item.count)
    a.append(
      h(
        'span',
        {
          class:
            'flex h-4 w-6 items-center justify-center rounded-full bg-white text-[10px] font-medium text-brand-deep group-data-[collapsed]/nav:hidden',
        },
        String(item.count),
      ),
    );
  return a;
}

function buildSidebar(): { el: HTMLElement; render: () => void } {
  const el = h('aside', {
    class:
      'group/nav sticky top-0 flex h-screen w-60 shrink-0 flex-col gap-5 overflow-y-auto bg-nav p-4 data-[collapsed]:w-[72px]',
  });
  const render = (): void => {
    const path = location.pathname;
    const toggle = h(
      'button',
      { type: 'button', 'aria-label': t('nav.collapse'), 'data-action': 'collapse', class: `rounded-md ${FOCUS}` },
      icon('sidebar-toggle.svg', 18),
    );
    const top = h(
      'div',
      { class: 'flex items-center justify-between pt-1.5' },
      h(
        'a',
        { href: '/', 'data-link': '', 'aria-label': t('app.name'), class: `h-[30px] w-[101.68px] p-0.5 group-data-[collapsed]/nav:hidden ${FOCUS}` },
        icon('logo.svg', 86, '', 25.38),
      ),
      toggle,
    );
    const search = h(
      'label',
      { class: 'flex h-9 items-center gap-1.5 rounded-[34px] bg-white/6 py-1 pr-1 pl-3 shadow-[0_1px_4px_rgba(0,0,0,0.03)] group-data-[collapsed]/nav:hidden' },
      icon('search.svg', 16),
      h('input', {
        type: 'search',
        placeholder: t('nav.search'),
        'aria-label': t('nav.search'),
        class: 'min-w-0 flex-1 bg-transparent text-xs tracking-[-0.3px] text-nav-text outline-none placeholder:text-nav-text',
      }),
      h(
        'span',
        { class: 'flex h-full items-center gap-0.5 rounded-[18px] bg-nav-deep px-[9px] text-xs text-nav-text', 'aria-hidden': 'true' },
        icon('cmd.svg', 10),
        'K',
      ),
    );
    const sections = h('div', { class: 'flex flex-col gap-4' });
    groups().forEach((g, i) => {
      const id = `nav-group-${i}`;
      sections.append(
        h(
          'div',
          { class: 'flex flex-col gap-1' },
          h(
            'button',
            { type: 'button', 'data-toggle': id, 'aria-expanded': 'true', 'aria-controls': id, class: `${GROUP_LABEL} group-data-[collapsed]/nav:hidden` },
            g.label,
            icon('chevron-up.svg', 16),
          ),
          h(
            'div',
            { id, class: 'flex flex-col gap-0.5' },
            ...g.items.map((item) => link(item, item.path !== undefined && item.path === (path === '/' ? '/' : path))),
          ),
        ),
      );
    });
    el.replaceChildren(top, search, sections);
  };
  render();
  delegate(el, 'click', '[data-action="collapse"]', () => {
    el.toggleAttribute('data-collapsed');
  });
  delegate(el, 'click', '[data-toggle]', (btn) => {
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    const panel = document.getElementById(btn.getAttribute('data-toggle') ?? '');
    if (panel) panel.hidden = !open;
    btn.lastElementChild?.classList.toggle('rotate-180', !open);
  });
  return { el, render };
}

function buildHeader(): { el: HTMLElement; render: () => void } {
  const el = h('header', {
    class: 'sticky top-0 z-(--z-nav) flex items-center justify-between rounded-tl-2xl border-b border-[#f2f2f2] bg-white px-5 py-4',
  });
  const render = (): void => {
    const select = h('select', {
      id: 'lang',
      'aria-label': t('app.language'),
      class: `h-10 rounded-full bg-pill px-3 text-xs text-ink ${FOCUS}`,
    });
    for (const code of LOCALES) {
      const option = h('option', { value: code, lang: code }, NATIVE[code] ?? code);
      if (code === currentLocale()) option.selected = true;
      select.append(option);
    }
    select.addEventListener('change', () => {
      if (!isLocale(select.value)) return;
      void setLocale(select.value).then(() => {
        bus.emit('locale:changed', { locale: select.value });
      });
    });

    const iconBtn = (file: string, label: string, dot = false): HTMLElement =>
      h(
        'button',
        { type: 'button', 'aria-label': label, 'data-chat-open': file === 'hdr-chat.svg' ? '' : undefined, class: `${ROUND_BTN} relative` },
        icon(file, 16),
        dot && h('span', { class: 'absolute top-1 left-3.5 size-2 rounded-full bg-brand-mid', 'aria-hidden': 'true' }),
      );

    el.replaceChildren(
      h(
        'span',
        { class: 'flex h-6 items-center rounded-full border border-gray-200 bg-white px-3 text-xs leading-[15px] font-medium text-ink-2' },
        t('nav.dashboard'),
      ),
      h(
        'div',
        { class: 'flex items-center gap-4' },
        select,
        h(
          'div',
          { class: 'flex h-10 items-center gap-2 rounded-full bg-pill px-1.5' },
          iconBtn('hdr-chat.svg', t('nav.chat')),
          iconBtn('hdr-bell.svg', t('nav.notifications'), true),
          iconBtn('hdr-megaphone.svg', t('nav.announcements')),
        ),
        h(
          'div',
          { class: 'flex h-10 items-center gap-2 rounded-full bg-pill py-1.5 pr-4 pl-1' },
          h('img', { src: '/img/user.png', alt: '', width: 32, height: 32, class: 'size-8 rounded-full bg-[#dadde3] object-cover' }),
          h(
            'div',
            { class: 'whitespace-nowrap' },
            h('p', { class: 'text-xs leading-[1.3] font-semibold text-ink' }, 'Zara Khan'),
            h('p', { class: 'text-[10px] leading-3 text-ink-3' }, t('app.profileRole')),
          ),
        ),
      ),
    );
  };
  render();
  return { el, render };
}

/** App frame: skip link, sidebar, header, and the <main> that screens render into. */
export function buildShell(root: HTMLElement): HTMLElement {
  const main = h('main', { id: 'main', class: 'w-full flex-1 p-[30px]' });
  const sidebar = buildSidebar();
  const header = buildHeader();

  // Active item follows the URL; the router pushes state after this runs, so wait a tick.
  const sync = (): void => {
    setTimeout(sidebar.render, 0);
  };
  delegate(sidebar.el, 'click', 'a[data-link]', sync);
  window.addEventListener('popstate', sync);
  bus.on('locale:changed', () => {
    sidebar.render();
    header.render();
  });

  root.replaceChildren(
    h(
      'a',
      {
        href: '#main',
        class:
          'sr-only focus:not-sr-only focus:absolute focus:z-(--z-nav) focus:m-2 focus:rounded-md focus:bg-primary focus:p-3 focus:text-on-primary',
      },
      t('app.skip'),
    ),
    h('div', { class: 'flex min-h-screen' }, sidebar.el, h('div', { class: 'flex min-w-0 flex-1 flex-col' }, header.el, main)),
    createChatbot(),
  );
  return main;
}
