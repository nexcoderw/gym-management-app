import { z } from 'zod';

import { databaseIdSchema, listSearchSchema } from '@/lib/contracts';
import { listUpcomingReminders } from '@/lib/server/endpoints/reminders/list-upcoming-reminders';
import { RequestError } from '@/lib/server/request';
import { errorResponse } from '@/lib/server/upstream';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
	try {
		const url = new URL(request.url);
		const keys = [...url.searchParams.keys()];
		if (
			new Set(keys).size !== keys.length ||
			keys.some((key) => key !== 'cursor' && key !== 'search')
		) {
			throw new RequestError(400, 'Unsupported reminder query.');
		}
		const filters = z
			.strictObject({
				cursor: databaseIdSchema.optional(),
				search: listSearchSchema.optional(),
			})
			.parse(Object.fromEntries(url.searchParams.entries()));
		return Response.json(await listUpcomingReminders(filters), {
			headers: { 'Cache-Control': 'no-store' },
		});
	} catch (error: unknown) {
		if (error instanceof RequestError) {
			return Response.json(
				{ message: error.message },
				{ status: error.status, headers: { 'Cache-Control': 'no-store' } },
			);
		}
		return errorResponse(error);
	}
}
