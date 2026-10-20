import { z } from 'zod';

import { manualReminderInputSchema } from '@/lib/contracts';
import { queueManualReminder } from '@/lib/server/endpoints/reminders/queue-manual-reminder';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { RequestError, readJson, requireSameOrigin } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

export async function POST(
	request: Request,
	context: { params: Promise<{ subscriptionId: string }> },
): Promise<Response> {
	try {
		const origin = requireSameOrigin(request);
		const csrfToken = await requireOwnerCsrfToken();
		const { subscriptionId } = await context.params;
		if (!z.guid().safeParse(subscriptionId).success) {
			throw new RequestError(400, 'Invalid membership registration.');
		}
		const input = manualReminderInputSchema.parse(await readJson(request));
		return Response.json(await queueManualReminder(subscriptionId, input, csrfToken, origin), {
			status: 202,
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json({ message: error.message }, { status: error.status, headers: { 'Cache-Control': 'no-store' } });
		}
		return errorResponse(error);
	}
}
