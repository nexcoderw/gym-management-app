import 'server-only';

import { z } from 'zod';

const environmentSchema = z.object({
	GYM_API_BASE_URL: z.url().refine((value) => !value.endsWith('/'), 'Must not end with a slash.'),
	MANAGER_ORIGIN: z.url().refine((value) => new URL(value).origin === value, 'Must be an origin.'),
});

export const environment = environmentSchema.parse({
	GYM_API_BASE_URL: process.env.GYM_API_BASE_URL,
	MANAGER_ORIGIN: process.env.MANAGER_ORIGIN,
});
