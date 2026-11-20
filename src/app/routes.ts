import type { RouteDef } from './router';

// Roles here are a UX convenience. The API enforces authorization independently.
export const routes: readonly RouteDef[] = [
  {
    path: '/',
    roles: ['student'],
    titleKey: 'nav.home',
    load: () => import('@/features/home/controller'),
  },
  {
    path: '/applications',
    roles: ['student', 'agent'],
    titleKey: 'applications.title',
    load: () => import('@/features/applications/controller'),
  },
];
