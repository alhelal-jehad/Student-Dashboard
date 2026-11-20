import './styles.css';
import { env } from '@/shared/config/env';
import { initI18n, savedLocale } from '@/shared/i18n';
import { routes } from '@/app/routes';
import { Router } from '@/app/router';
import { loadRole } from '@/app/session';
import { buildShell } from '@/app/shell';

async function boot(): Promise<void> {
  const root = document.getElementById('app');
  if (!root) throw new Error('#app missing from index.html');

  await initI18n(savedLocale() ?? env.VITE_DEFAULT_LOCALE);
  const role = await loadRole();
  const host = buildShell(root);

  new Router({
    host,
    routes,
    getRole: () => role,
    // Sign-in is hosted by the backend/IdP, so unauthenticated users are redirected there.
    onUnauthenticated: (returnTo) => {
      location.assign(`/login?next=${encodeURIComponent(returnTo)}`);
    },
  }).start();
}

void boot();
