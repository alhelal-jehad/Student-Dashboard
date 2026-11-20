import type { Screen, ScreenFactory } from '@/core/controller';
import { bus } from '@/shared/events/bus';
import { t } from '@/shared/i18n';
import { h } from '@/shared/ui/dom';
import { Button } from '@/shared/ui/button';
import { delegate } from '@/shared/utils/delegate';

export type Role = 'student' | 'agent';

export interface RouteDef {
  /** e.g. "/applications" or "/applications/:id" */
  path: string;
  /** UX guard only. Real enforcement is always server-side. */
  roles: readonly Role[];
  titleKey: string;
  /** Dynamic import: each screen's code is a separate chunk, fetched on first visit. */
  load: () => Promise<{ createScreen: ScreenFactory }>;
}

export interface RouterDeps {
  host: HTMLElement;
  routes: readonly RouteDef[];
  getRole: () => Role | null;
  /** Called when there is no session. Usually redirects to the sign-in page. */
  onUnauthenticated: (returnTo: string) => void;
}

function match(pattern: string, path: string): Record<string, string> | null {
  const a = pattern.split('/').filter(Boolean);
  const b = path.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < a.length; i++) {
    const seg = a[i] ?? '';
    const val = b[i] ?? '';
    if (seg.startsWith(':')) params[seg.slice(1)] = decodeURIComponent(val);
    else if (seg !== val) return null;
  }
  return params;
}

export class Router {
  private current: Screen | null = null;
  private navId = 0; // guards against a slow chunk resolving after a newer navigation
  private readonly cleanups: (() => void)[] = [];

  constructor(private readonly deps: RouterDeps) {}

  start(): void {
    const onPop = (): void => {
      void this.resolve(location.pathname);
    };
    window.addEventListener('popstate', onPop);
    this.cleanups.push(() => {
      window.removeEventListener('popstate', onPop);
    });

    // Internal links: <a href data-link>. Intercept plain clicks only, so Ctrl/Cmd-click still works.
    const body = document.body;
    this.cleanups.push(
      delegate(body, 'click', 'a[data-link]', (a, event) => {
        const e = event as MouseEvent;
        if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey) return;
        event.preventDefault();
        this.navigate(a.getAttribute('href') ?? '/');
      }),
      // Prefetch the next screen's chunk on hover/focus so the click feels instant.
      delegate(body, 'pointerover', 'a[data-link]', (a) => {
        void this.routeFor(a.getAttribute('href') ?? '')?.route.load();
      }),
      delegate(body, 'focusin', 'a[data-link]', (a) => {
        void this.routeFor(a.getAttribute('href') ?? '')?.route.load();
      }),
      bus.on('navigate', ({ to, replace }) => {
        this.navigate(to, replace);
      }),
      bus.on('locale:changed', () => {
        void this.resolve(location.pathname);
      }),
    );

    void this.resolve(location.pathname);
  }

  navigate(to: string, replace = false): void {
    if (replace) history.replaceState(null, '', to);
    else history.pushState(null, '', to);
    void this.resolve(to);
  }

  destroy(): void {
    this.cleanups.splice(0).forEach((fn) => {
      fn();
    });
    this.current?.destroy();
  }

  private routeFor(path: string): { route: RouteDef; params: Record<string, string> } | null {
    for (const route of this.deps.routes) {
      const params = match(route.path, path);
      if (params) return { route, params };
    }
    return null;
  }

  private async resolve(path: string): Promise<void> {
    const id = ++this.navId;
    const found = this.routeFor(path);
    const role = this.deps.getRole();

    if (!found) {
      this.fallback(id, t('app.notFoundTitle'), t('errors.not_found'));
      return;
    }
    if (!role) {
      this.deps.onUnauthenticated(path);
      return;
    }
    if (!found.route.roles.includes(role)) {
      this.fallback(id, t('app.notFoundTitle'), t('errors.forbidden'));
      return;
    }

    let factory: ScreenFactory;
    try {
      factory = (await found.route.load()).createScreen;
    } catch {
      // Chunk failed to download (weak network or a deploy happened mid-session).
      this.fallback(id, t('app.notFoundTitle'), t('errors.chunk'), true);
      return;
    }
    if (id !== this.navId) return; // a newer navigation won

    this.current?.destroy();
    this.deps.host.replaceChildren();
    document.title = `${t(found.route.titleKey)} · ${t('app.name')}`;
    this.current = factory({ host: this.deps.host, params: found.params });
    await this.current.start();
  }

  private fallback(id: number, title: string, message: string, reload = false): void {
    if (id !== this.navId) return;
    this.current?.destroy();
    this.current = null;
    document.title = `${title} · ${t('app.name')}`;
    const box = h(
      'section',
      { class: 'flex flex-col items-start gap-3', role: 'alert' },
      h('h1', { class: 'text-xl font-semibold' }, title),
      h('p', { class: 'text-muted' }, message),
    );
    if (reload) {
      const button = Button({ label: t('actions.reload'), action: 'reload' });
      button.addEventListener(
        'click',
        () => {
          location.reload();
        },
        { once: true },
      );
      box.append(button);
    } else {
      box.append(
        h(
          'a',
          {
            href: '/applications',
            'data-link': '',
            class:
              'min-h-11 text-primary underline focus-visible:outline-2 focus-visible:outline-primary',
          },
          t('actions.goHome'),
        ),
      );
    }
    this.deps.host.replaceChildren(box);
  }
}
