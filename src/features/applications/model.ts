import { z } from 'zod';
import { StaleCache } from '@/core/cache';
import { Model, type Loadable } from '@/core/model';
import { apiClient, type ApiClient } from '@/shared/api/client';
import { ApiError, toErrorCode } from '@/shared/utils/errors';

export const ApplicationSchema = z.object({
  id: z.string(),
  university: z.string().min(1),
  program: z.string().min(1),
  status: z.enum(['draft', 'submitted', 'under_review', 'offer', 'rejected']),
  updatedAt: z.iso.datetime(), // UTC; the View formats it for the user's time zone
});

const ListSchema = z.array(ApplicationSchema);

export type Application = z.infer<typeof ApplicationSchema>;
export type ApplicationsState = Loadable<Application[]>;

const STALE_MS = 60_000;

export class ApplicationsModel extends Model<ApplicationsState> {
  private readonly cache = new StaleCache<Application[]>(STALE_MS);

  constructor(private readonly api: ApiClient = apiClient) {
    super({ status: 'idle', data: null, errorCode: null });
  }

  /** Loads the list. Fresh cached data is reused unless `force` is set (retry, pull to refresh). */
  async load(force = false): Promise<void> {
    const fresh = force ? null : this.cache.get();
    if (fresh) {
      this.set({ status: 'ready', data: fresh, errorCode: null });
      return;
    }
    // Show stale data while refreshing instead of flashing a skeleton again.
    const stale = this.cache.peek();
    this.set({ status: stale ? 'ready' : 'loading', data: stale, errorCode: null });

    try {
      const parsed = ListSchema.safeParse(await this.api.get('/applications'));
      if (!parsed.success) throw new ApiError('invalid_response');
      const sorted = parsed.data.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      this.cache.set(sorted);
      this.set({ status: 'ready', data: sorted, errorCode: null });
    } catch (error) {
      this.set({ status: 'error', data: stale, errorCode: toErrorCode(error) });
    }
  }
}
