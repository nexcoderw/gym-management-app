import 'server-only';

import { ZodError } from 'zod';

import { queuedReminderSchema, type ManualReminderInput } from '@/lib/contracts';
import { UpstreamError, upstreamJson } from '@/lib/server/upstream';

export async function queueManualReminder(
	subscriptionId: string,
	input: ManualReminderInput,
	csrfToken: string,
	origin: string,
) {
	try {
		const result = await upstreamJson(
			`/owner/reminders/subscriptions/${encodeURIComponent(subscriptionId)}/deliveries`,
			{ method: 'POST', body: input, csrfToken, origin },
			queuedReminderSchema,
		);
		if (result.response.status !== 202) {
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
