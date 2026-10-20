import 'server-only';

import { z, ZodError } from 'zod';

import { databaseIdSchema, listSearchSchema, upcomingReminderSchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

const filtersSchema = z.strictObject({
	cursor: databaseIdSchema.optional(),
	search: listSearchSchema.optional(),
});

export async function listUpcomingReminders(filters: z.input<typeof filtersSchema> = {}) {
	try {
		const parsed = filtersSchema.parse(filters);
		const query = new URLSearchParams({ limit: '24' });
		if (parsed.cursor !== undefined) query.set('cursor', parsed.cursor);
		if (parsed.search !== undefined) query.set('search', parsed.search);
		const result = await upstreamJson(
			`/owner/reminders/upcoming?${query}`,
			{ method: 'GET' },
			upcomingReminderSchema,
		);
		if (result.response.status !== 200) {
			throw new UpstreamError(502, 'The service returned an incompatible response.');
		}
		return result.data;
	} catch (error: unknown) {
		if (error instanceof ZodError) {
			throw new UpstreamError(502, 'The service returned an incompatible response.');
		}
		throw error;
	}
}
