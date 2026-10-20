import 'server-only';

import { ZodError } from 'zod';

import { upcomingReminderSchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function listUpcomingReminders(cursor?: string) {
	try {
		const query = new URLSearchParams({ limit: '24' });
		if (cursor !== undefined) query.set('cursor', cursor);
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
