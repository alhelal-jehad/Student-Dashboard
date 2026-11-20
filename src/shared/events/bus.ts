import { Emitter } from '@/shared/utils/emitter';

/**
 * The only way features talk to each other (plus the URL). Every event is declared here,
 * so cross-feature coupling is visible in one file.
 */
export interface AppEvents {
  navigate: { to: string; replace?: boolean };
  'locale:changed': { locale: string };
  'session:expired': Record<string, never>;
  'document:uploaded': { applicationId: string };
}

export const bus = new Emitter<AppEvents>();
