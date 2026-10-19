import 'server-only';

import { ZodError } from 'zod';

import { reminderActivitySchema } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

/** Nest authenticates the owner and resolves the organization from the request origin. */
export async function listReminderActivity() {
	try {
		const result = await upstreamJson(
			'/owner/reminders/activity?limit=50',
			{ method: 'GET' },
			reminderActivitySchema,
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
