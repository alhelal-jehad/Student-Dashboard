import { z } from 'zod';
import { apiClient } from '@/shared/api/client';
import type { Role } from './router';

const SessionSchema = z.object({ role: z.enum(['student', 'agent']) });

/** The role lives in memory only. The credential itself is an httpOnly cookie JS cannot read. */
export async function loadRole(): Promise<Role | null> {
  try {
    const parsed = SessionSchema.safeParse(await apiClient.get('/session'));
    return parsed.success ? parsed.data.role : null;
  } catch {
    // Dev only: no backend on :8080 means no session, which would bounce every page to /login.
    return import.meta.env.DEV ? 'student' : null;
  }
}
