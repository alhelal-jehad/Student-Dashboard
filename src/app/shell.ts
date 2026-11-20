import { bus } from '@/shared/events/bus';
import { LOCALES, currentLocale, isLocale, setLocale } from '@/shared/i18n';
import { t } from '@/shared/i18n';
import { h } from '@/shared/ui/dom';

const LINK =
  'inline-flex min-h-11 min-w-11 items-center rounded-md px-3 font-medium text-fg hover:bg-sunken focus-visible:outline-2 focus-visible:outline-primary';
const NATIVE: Record<string, string> = { en: 'English', ar: 'العربية' };

/** App frame: skip link, nav, language switcher, and the <main> that screens render into. */
export function buildShell(root: HTMLElement): HTMLElement {
  const main = h('main', { id: 'main', class: 'mx-auto w-full max-w-[1400px] p-4' });

  const select = h('select', {
    id: 'lang',
    class:
      'min-h-11 rounded-md border border-line bg-surface px-3 text-fg focus-visible:outline-2 focus-visible:outline-primary',
  });
  for (const code of LOCALES) {
    const option = h('option', { value: code, lang: code }, NATIVE[code] ?? code);
    if (code === currentLocale()) option.selected = true;
    select.append(option);
  }
  select.addEventListener('change', () => {
    if (!isLocale(select.value)) return;
    void setLocale(select.value).then(() => {
      rebuildNav();
      bus.emit('locale:changed', { locale: select.value });
    });
  });

  const nav = h('nav', {
    'aria-label': t('nav.label'),
    class: 'flex flex-wrap items-center gap-1',
  });
  const rebuildNav = (): void => {
    nav.setAttribute('aria-label', t('nav.label'));
    nav.replaceChildren(
      h('a', { href: '/', 'data-link': '', class: LINK }, t('nav.home')),
      h('a', { href: '/applications', 'data-link': '', class: LINK }, t('nav.applications')),
    );
  };
  rebuildNav();

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
    h(
      'header',
      {
        class:
          'sticky top-0 z-(--z-nav) flex items-center justify-between gap-2 border-b border-line bg-surface px-4 py-2',
      },
      nav,
      h(
        'label',
        { class: 'flex items-center gap-2 text-sm text-muted', for: 'lang' },
        t('app.language'),
        select,
      ),
    ),
    main,
  );
  return main;
}
