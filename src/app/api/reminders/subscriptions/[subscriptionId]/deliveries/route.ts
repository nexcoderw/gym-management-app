import { z } from 'zod';

import { queueManualReminder } from '@/lib/server/endpoints/reminders/queue-manual-reminder';
import { requireOwnerCsrfToken } from '@/lib/server/owner-csrf';
import { RequestError, requireSameOrigin } from '@/lib/server/request';
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
		return Response.json(await queueManualReminder(subscriptionId, csrfToken, origin), {
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
