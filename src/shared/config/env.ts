import { z } from 'zod';

// Fails fast at startup with a readable message if the build was configured wrongly.
const schema = z.object({
  VITE_API_BASE_URL: z.string().startsWith('/').default('/api'),
  VITE_DEFAULT_LOCALE: z.enum(['en', 'ar']).default('en'),
});

export const env = schema.parse(import.meta.env);
